import Keycloak from 'keycloak-js';

let instance: Keycloak | null = null;
let initPromise: Promise<boolean> | null = null;

export function getKeycloak(): Keycloak | null {
  if (typeof window === 'undefined') return null;
  if (!instance) {
    instance = new Keycloak({
      url:      process.env.NEXT_PUBLIC_KEYCLOAK_URL       ?? 'http://192.168.100.60:8080',
      realm:    process.env.NEXT_PUBLIC_KEYCLOAK_REALM     ?? 'hdos',
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'hdos-frontend',
    });
  }
  return instance;
}

export function initKeycloak(): Promise<boolean> {
  const kc = getKeycloak();
  if (!kc) return Promise.resolve(false);
  if (initPromise) return initPromise;

  const pkceMethod = window.crypto?.subtle ? 'S256' : undefined;

  initPromise = kc
    .init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      checkLoginIframe: false,
      ...(pkceMethod ? { pkceMethod } : {}),
    })
    .catch(() => false);

  return initPromise!;
}
