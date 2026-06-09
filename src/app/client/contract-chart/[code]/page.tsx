"use client";

// Trang generic cho DataContract chart — GET /lakehouse/contracts/{code}/chart (doc 53/54).
// Hỗ trợ chọn source (demo/sql/staging) và filter date.
// JSON shape trả về giống Path A/B → SduiPageRenderer render không đổi.

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
        <div className={`${SK} h-8 w-32`} />
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

export default function ContractChartPage() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();

  // Source & date từ query string hoặc mặc định demo/hôm nay
  const [source, setSource] = useState(searchParams.get("source") ?? "demo");
  const [date,   setDate]   = useState(
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10),
  );

  const [page,    setPage]    = useState<SduiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await adminApi.fetchContractChart(code, { source, date });
      setPage(data);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Không thể tải chart";
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [code, source, date]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Auto-refresh khi live = true
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!page?.live) return;
    timerRef.current = setInterval(() => void load(true), LIVE_REFRESH_MS);
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
          onClick={() => void load()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-[#30363d] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1f2937] transition-colors text-gray-600 dark:text-[#c9d1d9]"
        >
          <RefreshCw size={12} />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden flex flex-col">
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-0 shrink-0 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#8b949e]">
          Nguồn:
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
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
            onChange={(e) => setDate(e.target.value)}
            className="text-xs border border-gray-200 dark:border-[#30363d] rounded px-2 py-1 bg-white dark:bg-[#161b22] text-gray-700 dark:text-[#c9d1d9]"
          />
        </label>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-gray-200 dark:border-[#30363d] rounded hover:bg-gray-50 dark:hover:bg-[#1f2937] transition-colors text-gray-600 dark:text-[#c9d1d9]"
        >
          <RefreshCw size={11} />
          Làm mới
        </button>

        {/* Live badge */}
        {page?.live && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 dark:text-emerald-400">
            <Spin size="small" indicator={<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />} />
            Tự động làm mới mỗi {LIVE_REFRESH_MS / 1000}s
          </span>
        )}
      </div>

      {/* Chart */}
      {page && (
        <div className="flex-1 overflow-hidden">
          <SduiPageRenderer page={page} />
        </div>
      )}
    </div>
  );
}
