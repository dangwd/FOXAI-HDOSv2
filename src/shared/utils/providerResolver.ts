// Resolve URL từ DynamicFormService Provider Catalog (doc 52).
// Dùng cho EmbedSduiPageWidget để không hardcode URL trong FE.
// Cache TTL ~5 phút — đủ để tránh spam API mà không stale quá lâu.

import httpClient from "@/infrastructure/http/httpClient";
import type { FormsProviderDto, FormsOperationDto } from "@/infrastructure/http/adminApi";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  ts:    number;
}

const providerCache: Record<string, CacheEntry<FormsProviderDto>> = {};
const operationCache: Record<string, CacheEntry<FormsOperationDto>> = {};

function fresh<T>(entry: CacheEntry<T> | undefined): T | null {
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
  return entry.value;
}

async function getProvider(providerCode: string): Promise<FormsProviderDto> {
  const cached = fresh(providerCache[providerCode]);
  if (cached) return cached;

  const r = await httpClient.get<{ success?: boolean; data?: FormsProviderDto } | FormsProviderDto>(
    `/forms/admin/providers/${encodeURIComponent(providerCode)}`,
  );
  const body = r.data;
  const value = (body !== null && typeof body === "object" && "success" in body)
    ? (body as { data: FormsProviderDto }).data
    : body as FormsProviderDto;
  providerCache[providerCode] = { value, ts: Date.now() };
  return value;
}

async function getOperation(providerCode: string, operationKey: string): Promise<FormsOperationDto> {
  const cacheKey = `${providerCode}::${operationKey}`;
  const cached = fresh(operationCache[cacheKey]);
  if (cached) return cached;

  const r = await httpClient.get<{ success?: boolean; data?: FormsOperationDto[] } | FormsOperationDto[]>(
    `/forms/admin/providers/${encodeURIComponent(providerCode)}/operations`,
  );
  const body = r.data;
  const ops: FormsOperationDto[] = Array.isArray(body)
    ? body
    : (body !== null && typeof body === "object" && "data" in body)
      ? ((body as { data: FormsOperationDto[] }).data ?? [])
      : [];

  const op = ops.find((o) => o.operationKey === operationKey);
  if (!op) throw new Error(`Operation '${operationKey}' not found for provider '${providerCode}'`);

  operationCache[cacheKey] = { value: op, ts: Date.now() };
  return op;
}

/**
 * Resolve full URL cho 1 Provider/Operation từ catalog.
 * Thay {param} placeholders trong pattern bằng giá trị từ `params`.
 */
export async function resolveProviderUrl(
  providerCode: string,
  operationKey: string,
  params: Record<string, string>,
): Promise<string> {
  const [provider, operation] = await Promise.all([
    getProvider(providerCode),
    getOperation(providerCode, operationKey),
  ]);

  let path = operation.pattern;
  for (const [k, v] of Object.entries(params)) {
    path = path.replace(`{${k}}`, encodeURIComponent(v));
  }

  return `${provider.baseUrl}${path}`;
}

/** Xóa cache thủ công (vd sau khi admin cập nhật provider/operation). */
export function clearProviderCache(providerCode?: string): void {
  if (providerCode) {
    delete providerCache[providerCode];
    for (const k of Object.keys(operationCache)) {
      if (k.startsWith(`${providerCode}::`)) delete operationCache[k];
    }
  } else {
    for (const k of Object.keys(providerCache))  delete providerCache[k];
    for (const k of Object.keys(operationCache)) delete operationCache[k];
  }
}
