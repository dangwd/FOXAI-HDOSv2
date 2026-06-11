"use client";

// Widget nhúng SduiPage từ DataContract / Lakehouse chart endpoint (doc 52).
// Resolve URL qua Provider Catalog — không hardcode baseUrl.
// Depth limit: nếu inner page chứa embed_sdui_page nữa → render bình thường
// nhưng không nên nest >2 tầng (cảnh báo trong console).

import { useEffect, useRef, useState } from "react";
import { resolveProviderUrl } from "@/shared/utils/providerResolver";
import type { SduiPage } from "@/types/sdui";
import type { EmbedSduiPageProps } from "@/types/sdui";
import useAuthStore from "@/core/auth/authStore";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://192.168.100.60:8443").replace(/\/+$/, "");

// Lazy import SduiPageRenderer để tránh circular dependency tại module-load time.
// EmbedSduiPage → SduiPageRenderer → EmbedSduiPage (runtime recursion, OK)
import dynamic from "next/dynamic";
const SduiPageRenderer = dynamic(
  () => import("@/components/sdui/SduiPageRenderer").then((m) => ({ default: m.SduiPageRenderer })),
  { ssr: false, loading: () => <LoadingState /> },
);

function LoadingState() {
  return (
    <div className="flex items-center justify-center p-8 text-sm text-gray-400 dark:text-[#8b949e]">
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      Đang tải chart...
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p className="text-sm text-red-600 dark:text-red-400 mb-2">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 underline"
      >
        Thử lại
      </button>
    </div>
  );
}

export function EmbedSduiPageWidget({
  providerCode,
  operationKey,
  params,
  queryParams,
  height,
}: EmbedSduiPageProps) {
  const [page,    setPage]    = useState<SduiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const cancelRef = useRef(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  async function load() {
    cancelRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const resolvedUrl = await resolveProviderUrl(providerCode, operationKey, params);
      // Provider catalog stores Docker-internal baseUrl — strip host, re-apply nginx BASE
      const pathOnly = resolvedUrl.replace(/^https?:\/\/[^/]+/, "");
      const qs = new URLSearchParams(
        Object.fromEntries(
          Object.entries(queryParams ?? {}).filter(([, v]) => v !== undefined),
        ) as Record<string, string>,
      ).toString();
      const url = `${BASE}${pathOnly}${qs ? `?${qs}` : ""}`;

      const r = await fetch(url, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const json = await r.json() as { success?: boolean; data?: SduiPage; errorMessage?: string };

      if (cancelRef.current) return;
      if (json.success === false) {
        setError(json.errorMessage ?? "Server trả lỗi");
      } else {
        setPage(json.data ?? (json as unknown as SduiPage));
      }
    } catch (e: unknown) {
      if (!cancelRef.current) {
        setError((e as { message?: string })?.message ?? "Fetch thất bại");
      }
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    return () => { cancelRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerCode, operationKey, JSON.stringify(params), JSON.stringify(queryParams)]);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={load} />;
  if (!page)   return null;

  return (
    <div style={{ minHeight: height ?? 400, overflow: "hidden" }}>
      <SduiPageRenderer page={page} />
    </div>
  );
}
