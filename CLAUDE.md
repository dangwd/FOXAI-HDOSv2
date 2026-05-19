# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Dev server (sets NODE_TLS_REJECT_UNAUTHORIZED=0 for self-signed certs)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit

# Docker
docker compose --profile dev up    # Dev with hot reload on port 5173
docker compose --profile prod up   # Production build on port 4000
```

There are no automated tests in this project.

## Architecture: Server-Driven UI

The entire frontend is a **backend-controlled layout renderer** — the backend defines what goes on each screen via JSON `ScreenConfig`. The frontend has no hardcoded screens or layouts; it only provides a component registry.

```
User navigates ?module=foo
  → GET /api/screen/foo       (returns ScreenConfig JSON)
  → ScreenRenderer reads config
  → REGISTRY[comp.type] resolves component
  → Component rendered with props and data from config
```

**In development**, screen configs are hardcoded in `src/app/api/screen/[id]/route.ts`. In production, the backend provides them dynamically.

The backend can discover available components and their prop schemas via `GET /api/manifest` (served from `src/app/api/manifest/route.ts` + `src/components/registry/index.ts`).

### Adding a new widget

1. Create `src/components/widgets/MyWidget.tsx` — accept `signalR?: SignalRConfig` if you want live data support
2. Register in `src/components/registry/index.ts` — add to both `REGISTRY` (component) and `MANIFEST` (prop schema)
3. The backend can now reference `"type": "MyWidget"` in any `ScreenConfig`

### ScreenConfig shape (`src/types/screen.ts`)

```ts
ScreenConfig → rows: RowConfig[]
RowConfig    → components: ComponentConfig[]
ComponentConfig → { type, props, span?, signalR? }
```

Grid is Ant Design 24-column. Components without `span` share remaining space equally. `ScreenRenderer` passes all `props` plus `signalR` and `loading` directly to the component.

## Authentication (Keycloak OIDC)

- `src/core/auth/keycloakClient.ts` — singleton Keycloak instance (`getKeycloak()`)
- `src/core/providers/AppProviders.tsx` — initializes Keycloak on mount, handles token refresh and session expiry
- `src/core/auth/authStore.ts` (Zustand) — `accessToken`, `user`, `permissions`, `isAuthenticated`
- `src/core/auth/rolePermissions.ts` — maps Keycloak roles → `Set<PermissionKey>`
- `middleware.ts` — redirects unauthenticated users to `/login` based on the `auth_token` cookie

Auth flow: Keycloak OIDC → `AppProviders.kc.init()` → token stored in Zustand + `auth_token` cookie → `isAuthenticated = true`.

Token refresh is automatic: `kc.updateToken(30)` on 401 via Axios interceptor; `kc.onTokenExpired` forces logout on session expiry.

## HTTP Client

`src/infrastructure/http/httpClient.ts` — Axios instance that:
- Attaches `Authorization: Bearer {token}` on every request
- Intercepts 401 → attempts `kc.updateToken()` → retries once → redirects to `/login` on failure

## Real-Time: SSE + SignalR

**System notifications (SSE)** — `src/core/signalr/useNotificationHub.ts`:
- Connects `EventSource` to `/notifications/sse?access_token=<token>`
- Receives `event: notification` events, pushes to `notificationStore`, shows Ant Design toast
- `EventSource` reconnects automatically; token passed as query param (browser `EventSource` doesn't support custom headers)
- `NotificationHubProvider` is mounted at the root HDOS layout

**Widget live data (SignalR)** — `src/core/signalr/useSignalR.ts`:
- Each widget can receive `signalR: { hubUrl, methodName }` from `ScreenConfig`
- Manages `HubConnection` lifecycle, auto-reconnect enabled
- Returns `{ data, status }` — widget should use `liveData ?? staticData` pattern

## Production HTTPS Proxy (`server-https.js`)

Wraps the Next.js standalone build (port 4001) behind an HTTPS server (port 4000):
- `/notifications/sse*` → proxied **directly to backend** (bypasses Next.js to prevent SSE buffering)
- Everything else → proxied to internal Next.js
- WebSocket upgrades → internal Next.js (for HMR in dev)
- Reads TLS certs from `CERTS_DIR` (`/app/certs/key.pem` + `cert.pem`)
- `NEXT_PUBLIC_API_URL` drives the backend host/port parsed at startup

## State Management (Zustand)

- `menuStore` — menu groups/items fetched from `/api/menu`
- `notificationStore` — notification items (max 50), `unreadCount`
- `themeStore` — dark/light mode

## Key Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (also used in `next.config.ts` rewrites) |
| `NEXT_PUBLIC_SSE_URL` | SSE endpoint override (dev: full URL; prod: defaults to `/notifications/sse`) |
| `NEXT_PUBLIC_KEYCLOAK_URL` | Keycloak server URL |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | Keycloak realm name |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | Keycloak client ID |

`next.config.ts` rewrites `/notifications/:path*` → backend, so relative SSE paths work in dev via Next.js. In production, `server-https.js` intercepts `/notifications/sse` before Next.js sees it.

## Styling

Tailwind CSS 4 + Ant Design 6. Use `cn()` (`src/shared/utils/cn.ts` = clsx + tailwind-merge) for conditional classes. Dark mode uses Tailwind `dark:` variants. Ant Design components inherit theme automatically.

## Docs

`docs/` contains detailed guides: `auth-briefing.md`, `deploy-briefing.md`, `cicd.md`, `docker.md`, `SIGNALR.md`, `ui-libraries.md`.
