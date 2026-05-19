# FOXAI HDOS v3 — Authentication & Authorization Briefing

> Tài liệu đầy đủ về luồng xác thực Keycloak, RBAC, token management và cách tích hợp auth vào code mới. Đọc hết trước khi chạm vào bất kỳ file nào liên quan đến auth.

---

## 1. Tổng quan kiến trúc

HDOS dùng **Keycloak** làm Identity Provider duy nhất. Không có form email/password riêng. Toàn bộ luồng là **OIDC Authorization Code + PKCE**.

```
[Browser]
    │ 1. Truy cập /executive (chưa có cookie)
    ▼
[middleware.ts] → đọc cookie auth_token → hết hạn/thiếu → redirect /login
    │
    ▼
[/login page] → hiển thị nút "Đăng nhập với Keycloak"
    │ user nhấn nút
    ▼
[authService.login()] → kc.login({ redirectUri }) → browser redirect đến Keycloak
    │
    ▼
[Keycloak Server] → user nhập credentials → redirect về /login?code=...&state=...
    │
    ▼
[AppProviders — kc.init()] → tự động exchange code → nhận JWT access token
    │
    ▼
[authStore.setAuthFromKeycloak(kc)] →
    - parse JWT claims (sub, email, name, roles)
    - resolvePermissions(roles) → Set<PermissionKey>
    - set cookie auth_token (expiry từ JWT exp)
    - save User vào localStorage
    - set isAuthenticated = true trong Zustand store
    │
    ▼
[login page useEffect] → isAuthenticated=true → router.replace('/executive')
    │
    ▼
[Mọi API call] → httpClient tự gắn Authorization: Bearer {kc.token}
```

---

## 2. Cấu trúc file

```
src/core/auth/
  keycloakClient.ts      ← Singleton Keycloak instance + initKeycloak()
  authStore.ts           ← Zustand store: user, token, permissions, isAuthenticated
  authService.ts         ← login() và logout() (thin wrapper gọi Keycloak JS)
  rolePermissions.ts     ← Map Keycloak role → Set<PermissionKey>
  types.ts               ← User { id, email, name? }

src/core/permissions/
  constants.ts           ← PERMISSIONS object + PermissionKey type
  Gate.tsx               ← <Gate permission="x:y"> component
  usePermission.ts       ← hook: usePermission(perm) → boolean

src/core/providers/
  AppProviders.tsx       ← kc.init() on mount, onTokenExpired handler, socket connect/disconnect

src/infrastructure/http/
  httpClient.ts          ← Axios wrapper: auto Bearer header, 401 → refresh → retry

src/middleware.ts        ← Next.js Edge: đọc cookie auth_token → redirect nếu expired/absent

public/
  silent-check-sso.html  ← OIDC silent iframe handler (postMessage về origin)
```

---

## 3. Chi tiết từng file

### `keycloakClient.ts`

```typescript
// Singleton — tạo 1 lần, dùng mãi
let instance: Keycloak | null = null;
let initPromise: Promise<boolean> | null = null;

export function getKeycloak(): Keycloak | null {
  if (typeof window === 'undefined') return null;  // SSR-safe
  if (!instance) {
    instance = new Keycloak({
      url:      process.env.NEXT_PUBLIC_KEYCLOAK_URL     ?? 'http://192.168.100.60:8080',
      realm:    process.env.NEXT_PUBLIC_KEYCLOAK_REALM   ?? 'hdos',
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'hdos-frontend',
    });
  }
  return instance;
}

export function initKeycloak(): Promise<boolean> {
  if (initPromise) return initPromise;  // prevent double-init (React StrictMode)

  const pkceMethod = window.crypto?.subtle ? 'S256' : undefined;

  initPromise = kc.init({
    ...(pkceMethod ? { pkceMethod } : {}),
    checkLoginIframe: false,  // không có onLoad → không auto-redirect
    // Nếu URL có ?code= → exchange code → authenticated = true
    // Nếu sessionStorage có token → restore → authenticated = true
    // Nếu không có gì → authenticated = false (không redirect)
  }).catch(() => false);

  return initPromise;
}
```

**Quan trọng:** `initKeycloak()` không có `onLoad: 'login-required'` — nó không tự redirect đến Keycloak. Redirect chỉ xảy ra khi user nhấn nút hoặc middleware bắt cookie hết hạn.

---

### `authStore.ts` (Zustand)

**State:**

```typescript
interface AuthState {
  user: User | null;           // { id, email, name }
  accessToken: string | null;  // raw JWT string
  permissions: Set<string>;    // Set<PermissionKey>
  isAuthenticated: boolean;
}
```

**Actions:**

```typescript
setAuthFromKeycloak(kc: Keycloak): void
// Đọc kc.tokenParsed → lấy sub, email, name, roles
// Gọi resolvePermissions(roles) → permissions Set
// Set cookie auth_token (expiry = JWT exp)
// Save User vào localStorage key 'auth_user'
// Update Zustand state

clearAuth(): void
// Remove localStorage 'auth_user'
// Expire cookie auth_token
// Reset state về null/false/empty Set

hasPermission(permission: string): boolean
// get().permissions.has(permission)
```

**Token cookie** (`auth_token`):
- Set bằng `document.cookie` — không `HttpOnly` (middleware đọc được, frontend cũng đọc được)
- `SameSite=Lax; path=/`
- Expiry khớp `exp` từ JWT payload

**localStorage** (`auth_user`):
- Lưu `User { id, email, name }` để UI hiển thị tên/avatar
- Không lưu token (token chỉ trong memory + cookie)

---

### `authService.ts`

```typescript
export const authService = {
  login(redirectUri?: string): void {
    // Gọi kc.login() → redirect browser đến Keycloak login page
    // redirectUri mặc định: /login (để AppProviders exchange code)
    getKeycloak()?.login({ redirectUri: redirectUri ?? `${origin}/login` });
  },

  async logout(): Promise<void> {
    queryClient.clear();              // xóa toàn bộ TanStack Query cache
    useAuthStore.getState().clearAuth();   // xóa store + cookie + localStorage
    socketManager.disconnect();       // ngắt SignalR

    const kc = getKeycloak();
    if (kc?.authenticated) {
      await kc.logout({ redirectUri: `${origin}/login` });
      // → Keycloak xóa server-side session → redirect về /login
    } else {
      window.location.href = '/login';
    }
  },
};
```

---

### `rolePermissions.ts`

Map từ **Keycloak realm role** → **frontend permissions**. Đây là mapping UI-only — backend tự enforce.

JWT payload phải có claim `roles` (mảng string). Keycloak cần có **User Realm Role mapper** với `Token Claim Name: roles`.

```typescript
const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  admin:      ALL_PERMISSIONS,   // tất cả
  doctor:     ['patient:read', 'patient:write', 'dashboard:executive', 'dashboard:kpi',
               'lab:read', 'lab:critical', 'queue:read', 'reports:read'],
  nurse:      ['patient:read', 'queue:read', 'queue:manage', 'dashboard:kpi', 'lab:read'],
  operator:   ['patient:read', 'queue:read', 'queue:manage', 'dashboard:kpi',
               'dashboard:executive', 'reports:read'],
  pharmacist: ['pharmacy:read', 'pharmacy:dispense', 'patient:read'],
};

// Resolve: lấy union permissions của tất cả roles user có
export function resolvePermissions(roles: string[]): Set<PermissionKey>
```

Nếu user có nhiều roles → permissions là **union** của tất cả.

---

### `AppProviders.tsx` — vòng đời auth

```typescript
// Effect 1: Init Keycloak on mount
useEffect(() => {
  const kc = getKeycloak();
  initKeycloak().then((authenticated) => {
    if (authenticated && kc) {
      useAuthStore.getState().setAuthFromKeycloak(kc);
    }
    setIsRehydrated(true);  // cho phép render children
  });

  // Token expiry handler
  if (kc) {
    kc.onTokenExpired = () => {
      kc.updateToken(60)   // refresh nếu còn < 60 giây
        .then((refreshed) => {
          if (refreshed && kc.token) useAuthStore.getState().setAuthFromKeycloak(kc);
        })
        .catch(() => useAuthStore.getState().clearAuth());
    };
  }
}, []);

// Effect 2: Connect/disconnect SignalR theo auth state
useEffect(() => {
  if (isAuthenticated && accessToken) {
    initRealtimeBridge();
    socketManager.connect(accessToken);
  } else {
    socketManager.disconnect();
  }
}, [isAuthenticated, accessToken]);

// Effect 3: Redirect về /login khi session hết
useEffect(() => {
  if (!isRehydrated) return;
  if (prevIsAuthenticated.current === true && !isAuthenticated) {
    queryClient.clear();
    window.location.href = '/login';
  }
  prevIsAuthenticated.current = isAuthenticated;
}, [isAuthenticated, isRehydrated]);
```

**isRehydrated gate:** Trong khi Keycloak chưa init xong, render `<Spin>` toàn màn hình (tránh flash nội dung chưa auth).

---

### `middleware.ts` (Next.js Edge Middleware)

```typescript
// Chạy trước mọi request, không phải auth flow thực sự — chỉ là UX guard

const PUBLIC_PATHS = new Set(['/login', '/unauthorized']);

export function middleware(request: NextRequest): NextResponse {
  const token = request.cookies.get('auth_token')?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const isAuthenticated = !!payload && !isTokenExpired(payload);  // check exp

  if (pathname === '/login') {
    if (isAuthenticated) return redirect('/executive');  // đã login → bỏ qua trang login
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  if (!isAuthenticated) {
    // Lưu trang muốn vào, sau login sẽ redirect về đây
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Matcher: tất cả route trừ _next, api, favicon
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
};
```

**Lưu ý:** Middleware chỉ đọc cookie — không gọi Keycloak, không verify chữ ký JWT. Enforcement thật sự là backend.

---

### `httpClient.ts` — 401 auto-refresh

```typescript
instance.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

instance.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    const kc = getKeycloak();
    if (kc?.authenticated) {
      try {
        await kc.updateToken(30);   // refresh nếu sắp hết hạn (< 30s)
        if (kc.token) {
          useAuthStore.getState().setAuthFromKeycloak(kc);
          originalRequest.headers.Authorization = `Bearer ${kc.token}`;
          return instance(originalRequest);  // retry request
        }
      } catch {
        useAuthStore.getState().clearAuth();
        kc.login({ redirectUri: window.location.href });
      }
    }
    // Không có session → redirect login
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
  }
  // ... normalize errors
});
```

---

## 4. Hệ thống permissions

### Tất cả permissions hiện có

```typescript
PERMISSIONS = {
  PATIENT:    { READ: 'patient:read',    WRITE: 'patient:write',  DELETE: 'patient:delete' },
  BILLING:    { READ: 'billing:read',    WRITE: 'billing:write' },
  DASHBOARD:  { EXECUTIVE: 'dashboard:executive', KPI: 'dashboard:kpi' },
  LABORATORY: { READ: 'lab:read',        WRITE: 'lab:write',      CRITICAL: 'lab:critical' },
  PHARMACY:   { READ: 'pharmacy:read',   DISPENSE: 'pharmacy:dispense' },
  QUEUE:      { READ: 'queue:read',      MANAGE: 'queue:manage' },
  REPORTS:    { READ: 'reports:read',    EXPORT: 'reports:export' },
}
```

### Dùng permissions trong component/hook

```tsx
// 1. Gate component (ẩn hoàn toàn nếu không có quyền)
import { Gate } from '@/core/permissions/Gate';
<Gate permission="patient:read">
  <PatientList />
</Gate>
<Gate permission="patient:write" fallback={<span>Không có quyền</span>}>
  <EditButton />
</Gate>

// 2. Hook (điều kiện render/logic)
import { usePermission } from '@/core/permissions/usePermission';
const canWrite = usePermission('patient:write');

// 3. Store (imperative, ngoài component)
import useAuthStore from '@/core/auth/authStore';
const allowed = useAuthStore.getState().hasPermission('dashboard:executive');
```

### Thêm permission mới

**Bước 1** — `src/core/permissions/constants.ts`:
```typescript
SURGERY: {
  READ: 'surgery:read',
  SCHEDULE: 'surgery:schedule',
},
```

**Bước 2** — `src/core/auth/rolePermissions.ts`:
```typescript
doctor: [
  ...existingPerms,
  PERMISSIONS.SURGERY.READ,
],
```

**Bước 3** — dùng trong code:
```tsx
<Gate permission="surgery:read">...</Gate>
```

**Bước 4** — backend: tạo permission trong Keycloak + gán cho role qua Admin API.

---

## 5. Cấu hình Keycloak (từ đầu)

### Bước 1 — Tạo Realm

Vào Keycloak Admin UI → Create Realm → Name: `hdos`

### Bước 2 — Tạo Client `hdos-frontend`

| Field | Value |
|---|---|
| Client ID | `hdos-frontend` |
| Client authentication | **OFF** (public client) |
| Standard flow | ON (Authorization Code) |
| Valid redirect URIs | `http://localhost:3000/*` và `http://192.168.100.60:4000/*` |
| Web origins | `+` (hoặc liệt kê cụ thể) |

### Bước 3 — Thêm Mappers vào Client Scope

Vào: `hdos-frontend` → Client scopes → `hdos-frontend-dedicated` → Add mapper

**Mapper 1 — Audience** (để backend validate `aud` claim):
| Field | Value |
|---|---|
| Type | Audience |
| Name | `hdos-backend-aud` |
| Included Client Audience | `hdos-backend` |
| Add to access token | ON |

**Mapper 2 — Realm Roles** (để frontend đọc `roles` claim):
| Field | Value |
|---|---|
| Type | User Realm Role |
| Name | `realm-roles` |
| Token Claim Name | `roles` |
| Add to access token | ON |
| Add to userinfo | ON |

> **Bắt buộc:** Nếu thiếu Mapper 2 → JWT không có claim `roles` → `resolvePermissions([])` → permissions rỗng → mọi `<Gate>` đều ẩn.

### Bước 4 — Tạo Realm Roles

Tạo các role: `admin`, `doctor`, `nurse`, `operator`, `pharmacist`

### Bước 5 — Tạo User và gán Role

Realm → Users → Create user → Credentials (set password) → Role Mappings → Assign role

---

## 6. Biến môi trường

| Biến | Mô tả | Giá trị mặc định (fallback) |
|---|---|---|
| `NEXT_PUBLIC_KEYCLOAK_URL` | URL Keycloak server (không có trailing slash) | `http://192.168.100.60:8080` |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | Tên realm | `hdos` |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | Client ID | `hdos-frontend` |

File `.env.local` (dev):
```env
NEXT_PUBLIC_KEYCLOAK_URL=http://192.168.100.60:8080
NEXT_PUBLIC_KEYCLOAK_REALM=hdos
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=hdos-frontend
```

File `/opt/foxai/.env.production` (server — không commit git):
```env
NEXT_PUBLIC_KEYCLOAK_URL=https://keycloak.your-domain.com
NEXT_PUBLIC_KEYCLOAK_REALM=hdos
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=hdos-frontend
```

---

## 7. Token lifecycle

```
Keycloak issue JWT
    │ access_token (short-lived, default 5 phút)
    │ refresh_token (longer-lived, default 30 phút)
    ▼
kc.init() → lưu token trong Keycloak JS internal state (sessionStorage)
authStore → copy token vào memory + cookie
    │
    ├── kc.onTokenExpired (fired ~1 phút trước exp)
    │       └── kc.updateToken(60) → nếu refresh thành công → setAuthFromKeycloak
    │
    ├── API trả 401
    │       └── httpClient retry → kc.updateToken(30) → nếu ok → retry request
    │
    └── Refresh token hết hạn / bị revoke
            └── kc.updateToken fail → clearAuth() → redirect /login
```

**PKCE (S256):** Dùng khi `window.crypto.subtle` available (HTTPS). Trên HTTP (dev local) thì bỏ qua PKCE — vẫn hoạt động nhưng kém bảo mật hơn.

---

## 8. Troubleshooting

| Triệu chứng | Nguyên nhân | Fix |
|---|---|---|
| Loop redirect `/login` không dừng | `redirectUri` chưa có trong Valid Redirect URIs | Thêm `http://localhost:3000/*` vào client config Keycloak |
| `permissions` Set rỗng sau đăng nhập | Thiếu User Realm Role mapper | Thêm mapper `Token Claim Name: roles` vào client scope |
| `403` dù đã đăng nhập | User chưa có role, hoặc backend không nhận permission | Gán role cho user trong Keycloak; kiểm tra backend AuthService |
| `401` ngay sau khi đăng nhập | `aud` claim thiếu `hdos-backend` | Thêm Audience mapper vào client scope |
| Silent SSO không hoạt động | File `silent-check-sso.html` thiếu hoặc Web Origins sai | File ở `public/silent-check-sso.html`; Keycloak Web Origins = `+` |
| Màn hình trắng khi reload | Keycloak chưa chạy hoặc URL sai | Kiểm tra `NEXT_PUBLIC_KEYCLOAK_URL` và Keycloak service |
| Cookie không set | HTTPS mismatch | Dev dùng HTTP → cookie không có `Secure` flag → bình thường |
| `isRehydrated` không bao giờ true | `initKeycloak()` bị reject | Xem console lỗi từ Keycloak JS (CORS, URL sai, realm sai) |

---

## 9. Những gì KHÔNG làm

- **Không** tự generate hay verify JWT — Keycloak JS làm hết
- **Không** lưu refresh token ở frontend — Keycloak JS quản lý trong sessionStorage
- **Không** call Keycloak Admin API từ frontend — chỉ dùng Keycloak JS SDK
- **Không** dùng `kc.hasRealmRole()` — codebase dùng `resolvePermissions` + `authStore.hasPermission()`
- **Không** enforce permission ở frontend là đủ — backend phải luôn validate token và permission độc lập
- **Không** thêm biến môi trường non-`NEXT_PUBLIC_` cho auth — tất cả Keycloak config phải public vì chạy ở browser
