"use client";

// Canonical generic page cho DataContract chart — doc 57 §6.2.
// URL: /client/dashboards/{contract-code}?source=demo&date=2026-06-09&consumer=chart
//
// Nguyên tắc (doc 57):
//  - Page KHÔNG biết contract-code là gì — chỉ fetch + render generic.
//  - Filter UI append vào URL query string (không dùng internal state thuần).
//  - Loading → skeleton; Error → banner + retry; Empty rows → EmptyState (ở trong renderer).
//  - KHÔNG hard-code logic cho từng contract code.

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Spin } from "antd";
import { RefreshCw } from "lucide-react";
import httpClient from "@/infrastructure/http/httpClient";
import { SduiPageRenderer } from "@/components/sdui/SduiPageRenderer";
import type { SduiPage } from "@/types/sdui";

const LIVE_REFRESH_MS = 30_000;
const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

function PageSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className={`${SK} h-8 w-56`} />
        <div className={`${SK} h-8 w-28`} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem" }}>
        {[0, 1, 2, 3].map((i) => <div key={i} className={`${SK} h-28`} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1rem" }}>
        {[0, 1, 2].map((i) => <div key={i} className={`${SK} h-52`} />)}
      </div>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="m-6 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 flex items-start gap-3">
      <span className="text-red-500 dark:text-red-400 text-lg leading-none mt-0.5">⚠</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-700 dark:text-red-300 m-0">{message}</p>
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300"
        >
          <RefreshCw size={11} /> Thử lại
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { code }  = useParams<{ code: string }>();
  const search    = useSearchParams();
  const router    = useRouter();

  // Đọc filter từ URL — filter UI ghi vào URL, không state riêng (doc 57 §6.3)
  const source   = search.get("source")   ?? "demo";
  const consumer = search.get("consumer") ?? "chart";
  const date     = search.get("date")     ?? new Date().toISOString().slice(0, 10);

  const [page,    setPage]    = useState<SduiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      // Truyền toàn bộ query string từ URL vào BE (date, department, custom filters...)
      const qs = new URLSearchParams();
      search.forEach((v, k) => qs.set(k, v));
      if (!qs.has("source"))   qs.set("source", source);
      if (!qs.has("consumer")) qs.set("consumer", consumer);

      const res = await httpClient.get<{ success: boolean; data: SduiPage; errorMessage?: string }>(
        `/lakehouse/contracts/${encodeURIComponent(code)}/chart?${qs}`,
      );
      const body = res.data;
      if (body?.success === false) throw new Error(body.errorMessage ?? "Server trả lỗi");
      setPage(body.data ?? (body as unknown as SduiPage));
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Không thể tải dashboard";
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [code, search, source, consumer]);

  useEffect(() => { void load(); }, [load]);

  // Auto-refresh khi live = true
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!page?.live) return;
    timerRef.current = setInterval(() => void load(true), LIVE_REFRESH_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [page?.live, load]);

  function pushFilter(key: string, value: string) {
    const params = new URLSearchParams(search.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* Filter bar — doc 57 §6.3 */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-0 shrink-0 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#8b949e]">
          Nguồn:
          <select
            value={source}
            onChange={(e) => pushFilter("source", e.target.value)}
            className="text-xs border border-gray-200 dark:border-[#30363d] rounded px-2 py-1 bg-white dark:bg-[#161b22] text-gray-700 dark:text-[#c9d1d9]"
          >
            <option value="demo">demo (fake data)</option>
            <option value="sql">sql (raw lakehouse)</option>
            <option value="staging">staging (DataMatching)</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#8b949e]">
          Ngày:
          <input
            type="date"
            value={date}
            onChange={(e) => pushFilter("date", e.target.value)}
            className="text-xs border border-gray-200 dark:border-[#30363d] rounded px-2 py-1 bg-white dark:bg-[#161b22] text-gray-700 dark:text-[#c9d1d9]"
          />
        </label>

        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-gray-200 dark:border-[#30363d] rounded hover:bg-gray-50 dark:hover:bg-[#1f2937] transition-colors text-gray-600 dark:text-[#c9d1d9]"
        >
          <RefreshCw size={11} /> Làm mới
        </button>

        {page?.live && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 dark:text-emerald-400">
            <Spin size="small" indicator={<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />} />
            Tự động làm mới mỗi {LIVE_REFRESH_MS / 1000}s
          </span>
        )}
      </div>

      {/* Content */}
      {error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : page ? (
        <div className="flex-1 overflow-hidden">
          <SduiPageRenderer page={page} />
        </div>
      ) : null}
    </div>
  );
}
