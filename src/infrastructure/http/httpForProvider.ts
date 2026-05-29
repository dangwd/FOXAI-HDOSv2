import Keycloak from "keycloak-js";
import axios from "axios";

// ─── Separate Keycloak instance for admin/provider API ────────────────────────
// Hoàn toàn tách biệt với keycloakClient.ts (client HDOS frontend).
// Đọc env NEXT_PUBLIC_ADMIN_* — không dùng chung NEXT_PUBLIC_KEYCLOAK_* của client.

let _kc: Keycloak | null = null;
let _initPromise: Promise<boolean> | null = null;

function getAdminKc(): Keycloak {
  if (typeof window === "undefined") throw new Error("SSR");
  if (!_kc) {
    _kc = new Keycloak({
      url:      process.env.NEXT_PUBLIC_ADMIN_KC_URL    ?? "http://localhost:8180",
      realm:    process.env.NEXT_PUBLIC_ADMIN_KC_REALM  ?? "hdos",
      clientId: process.env.NEXT_PUBLIC_ADMIN_KC_CLIENT ?? "hdos-web",
    });
  }
  return _kc;
}

async function ensureAdminToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const kc = getAdminKc();

  // init once — check-sso để không redirect nếu chưa có session
  if (!_initPromise) {
    _initPromise = kc
      .init({
        onLoad:                    "check-sso",
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        checkLoginIframe:          false,
        pkceMethod:                "S256",
      })
      .catch(() => false);
  }

  await _initPromise;

  // chưa login → redirect sang Keycloak admin login
  if (!kc.authenticated) {
    await kc.login({ redirectUri: window.location.href });
    return null;
  }

  // refresh nếu còn dưới 30s
  try {
    await kc.updateToken(30);
  } catch {
    await kc.login({ redirectUri: window.location.href });
    return null;
  }

  return kc.token ?? null;
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const ADMIN_BASE = (process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:17080")
  .replace(/\/+$/, "");

const httpProvider = axios.create({
  baseURL: `${ADMIN_BASE}/api/v1`,
  timeout: 15_000,
});

httpProvider.interceptors.request.use(async (config) => {
  const token = await ensureAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpProvider.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await getAdminKc().updateToken(-1);
      } catch {
        getAdminKc().login({ redirectUri: window.location.href });
      }
    }
    return Promise.reject(error);
  },
);

export default httpProvider;
