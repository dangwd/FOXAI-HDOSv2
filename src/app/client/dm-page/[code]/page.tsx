"use client";

// Trang render SDUI page từ GET /dm/pages/{code} (DataMatchingService, doc 48).
// Hỗ trợ auto-refresh 30s khi page.live === true.

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Spin } from "antd";
import { RefreshCw } from "lucide-react";
import { adminApi } from "@/infrastructure/http/adminApi";
import { SduiPageRenderer } from "@/components/sdui/SduiPageRenderer";
import type { SduiPage } from "@/types/sdui";

const LIVE_REFRESH_MS = 30_000;

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

function PageSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className={`${SK} h-8 w-64`} />
        <div className={`${SK} h-8 w-24`} />
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem" }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${SK} h-28`} />
        ))}
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1rem" }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${SK} h-52`} />
        ))}
      </div>
    </div>
  );
}

export default function DmPageView() {
  const { code } = useParams<{ code: string }>();
  const [page,    setPage]    = useState<SduiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await adminApi.fetchDmPage(code);
      setPage(data);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Không thể tải trang";
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [code]);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh khi live=true
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!page?.live) return;
    timerRef.current = setInterval(() => load(true), LIVE_REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [page?.live, load]);

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        <button
          onClick={() => load()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-[#30363d] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1f2937] transition-colors text-gray-600 dark:text-[#c9d1d9]"
        >
          <RefreshCw size={12} />
          Thử lại
        </button>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="relative h-full overflow-hidden">
      {/* Live refresh indicator */}
      {page.live && (
        <div className="absolute top-3 right-6 z-10">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 dark:text-emerald-400">
            <Spin size="small" indicator={<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />} />
            Tự động làm mới mỗi {LIVE_REFRESH_MS / 1000}s
          </span>
        </div>
      )}
      <SduiPageRenderer page={page} />
    </div>
  );
}
