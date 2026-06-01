"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "antd";
import { Loader2, RefreshCw, Wifi } from "lucide-react";
import httpProvider, { getAdminToken } from "@/infrastructure/http/httpForProvider";
import { poolSubscribe } from "@/core/sse/ssePool";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventKind    = "startup" | "push" | "refreshing" | "done" | "error";
type RequestStatus = "Queued" | "Processing" | "Completed" | "Failed" | "Cancelled";
type SseStatus     = "connected" | "reconnecting" | "disconnected" | null;

const TERMINAL: RequestStatus[] = ["Completed", "Failed", "Cancelled"];

interface DashboardSummary {
  totalRevenue: number;
  totalUnits:   number;
  topRegion:    string;
  topProduct:   string;
  alerts:       string[];
}

interface RegionPerformanceRow {
  name:           string;
  revenue:        number;
  units:          number;
  target:         number;
  achievementPct: number;
}

interface RegionalPerformance {
  regions: RegionPerformanceRow[];
}

interface TimelineEntry {
  id:       string;
  ts:       Date;
  kind:     EventKind;
  headline: string;
  detail?:  string;
}

interface RequestResult {
  requestId: string;
  status:    RequestStatus;
  operation: string;
  data?:     unknown;
  error?:    string;
}

interface RequestCompletedEvent {
  requestId:    string;
  status:       string;
  operation:    string;
  payloadJson?: string;
  error?:       { code?: string; message?: string };
  elapsedMs?:   number;
}

interface WidgetStaleEvent {
  channel:    string;
  reason?:    string;
  updatedAt?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUMMARY_OP     = "report.dashboard.summary";
const REGIONS_OP     = "report.regional.performance";
const WIDGET_CHANNEL = "widget:main-dashboard:main-dashboard";

const KIND_META: Record<EventKind, { dot: string; label: string }> = {
  startup:    { dot: "bg-gray-400",               label: "Khởi động"  },
  push:       { dot: "bg-indigo-500",             label: "Excel push" },
  refreshing: { dot: "bg-amber-400 animate-pulse", label: "Làm mới…"  },
  done:       { dot: "bg-green-500",              label: "Đã cập nhật" },
  error:      { dot: "bg-red-500",               label: "Lỗi"         },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJwtClaim(token: string | null, claim: string): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as Record<string, unknown>;
    return (payload[claim] as string) ?? null;
  } catch { return null; }
}

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function fmt(n: number): string {
  return n.toLocaleString("vi-VN");
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("vi-VN", { hour12: false });
}

function fmtElapsed(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

type Delta = "up" | "down" | null;
function numDelta(next: number, prev: number): Delta {
  if (next > prev) return "up";
  if (next < prev) return "down";
  return null;
}

function mapPushToResult(ev: RequestCompletedEvent): RequestResult {
  if (ev.status === "done") {
    let data: unknown;
    if (ev.payloadJson) { try { data = JSON.parse(ev.payloadJson); } catch { /* skip */ } }
    return { requestId: ev.requestId, status: "Completed", operation: ev.operation, data };
  }
  if (ev.status === "cancelled") {
    return { requestId: ev.requestId, status: "Cancelled", operation: ev.operation };
  }
  return { requestId: ev.requestId, status: "Failed", operation: ev.operation, error: ev.error?.message ?? ev.status };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DeltaArrow({ delta }: { delta: Delta }) {
  if (!delta) return null;
  return (
    <span className={delta === "up" ? "text-green-500 text-xs" : "text-red-500 text-xs"}>
      {delta === "up" ? "↑" : "↓"}
    </span>
  );
}

function TimelineCard({ entry }: { entry: TimelineEntry }) {
  const { dot, label } = KIND_META[entry.kind];
  return (
    <div className="flex gap-2.5 group">
      <div className="flex flex-col items-center pt-1">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
        <div className="flex-1 w-px bg-gray-100 dark:bg-[#21262d] mt-1 min-h-[12px]" />
      </div>
      <div className="flex-1 pb-3 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-gray-600 dark:text-[#c9d1d9]">{label}</span>
          <span className="text-[10px] text-gray-400 dark:text-[#484f58] tabular-nums font-mono ml-auto shrink-0">
            {fmtTime(entry.ts)}
          </span>
        </div>
        <p className="text-[12px] text-gray-700 dark:text-[#c9d1d9] m-0 mt-0.5 leading-snug">{entry.headline}</p>
        {entry.detail && (
          <p className="text-[11px] font-mono text-gray-400 dark:text-[#484f58] m-0 mt-0.5 break-all leading-snug">
            {entry.detail}
          </p>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-100 dark:border-[#21262d] p-4 animate-pulse">
      <div className="h-2.5 w-20 bg-gray-100 dark:bg-[#21262d] rounded mb-3" />
      <div className="h-7 w-28 bg-gray-100 dark:bg-[#21262d] rounded mb-2" />
      <div className="h-2.5 w-12 bg-gray-100 dark:bg-[#21262d] rounded" />
    </div>
  );
}

function KpiCard({
  label, value, unit, delta, prevValue, warning,
}: {
  label:      string;
  value:      React.ReactNode;
  unit?:      string;
  delta?:     Delta;
  prevValue?: string;
  warning?:   string;
}) {
  return (
    <div className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-100 dark:border-[#21262d] p-4">
      <p className="text-[10px] font-bold text-gray-400 dark:text-[#484f58] uppercase tracking-widest m-0 mb-2">
        {label}
      </p>
      <div className="flex items-end gap-1.5">
        <span className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] tabular-nums leading-none">
          {value}
        </span>
        <DeltaArrow delta={delta ?? null} />
      </div>
      {unit && (
        <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0 mt-1">{unit}</p>
      )}
      {prevValue && (
        <p className="text-[11px] text-indigo-500 dark:text-indigo-400 m-0 mt-1">← {prevValue}</p>
      )}
      {warning && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 m-0 mt-1">{warning}</p>
      )}
    </div>
  );
}

function RegionProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color   = clamped >= 80 ? "bg-green-500" : clamped >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="w-20 h-1.5 bg-gray-100 dark:bg-[#21262d] rounded-full overflow-hidden shrink-0">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DataSyncMonitor() {
  // ── Auth — dùng admin KC token (httpForProvider), không phải main auth store ──
  const [sseUrl, setSseUrl] = useState<string | null>(null);
  useLayoutEffect(() => {
    getAdminToken().then((token) => {
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_SSE_URL ?? "/notifications/sse";
      setSseUrl(`${base}?access_token=${encodeURIComponent(token)}`);
    });
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [summary,     setSummary]     = useState<DashboardSummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<DashboardSummary | null>(null);
  const [regions,     setRegions]     = useState<RegionPerformanceRow[]>([]);
  const [prevRegions, setPrevRegions] = useState<RegionPerformanceRow[]>([]);

  // ── Refresh state ─────────────────────────────────────────────────────────
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [pushCount,     setPushCount]     = useState(0);

  // ── Request tracking ──────────────────────────────────────────────────────
  const [summaryReqId, setSummaryReqId] = useState<string | null>(null);
  const [regionsReqId, setRegionsReqId] = useState<string | null>(null);

  // ── SSE ───────────────────────────────────────────────────────────────────
  const [sseStatus, setSseStatus] = useState<SseStatus>(null);
  const sseOpen = sseStatus === "connected";

  // ── Timeline ──────────────────────────────────────────────────────────────
  const [timeline, setTimeline] = useState<TimelineEntry[]>(() => [
    { id: uid(), ts: new Date(), kind: "startup", headline: "Trang khởi động — chờ SSE và dữ liệu ban đầu" },
  ]);
  const tlEndRef = useRef<HTMLDivElement>(null);

  // ── Stable refs ───────────────────────────────────────────────────────────
  const isRefreshingRef    = useRef(false);
  const pendingCountRef    = useRef(0);
  const summaryReqIdRef    = useRef<string | null>(null);
  const regionsReqIdRef    = useRef<string | null>(null);
  const summaryPushRef     = useRef<RequestResult | null>(null);  // SSE delivered?
  const regionsPushRef     = useRef<RequestResult | null>(null);
  const prevSummaryRef2    = useRef<DashboardSummary | null>(null);
  const prevRegionsMapRef  = useRef<Record<string, RegionPerformanceRow>>({});
  const summaryPollingRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const regionsPollingRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseOpenRef         = useRef(false);
  const refreshRef         = useRef<() => Promise<void>>(() => Promise.resolve());

  // Keep sseOpenRef in sync
  useLayoutEffect(() => { sseOpenRef.current = sseOpen; }, [sseOpen]);

  // ── Timeline helpers ──────────────────────────────────────────────────────

  const addEntry = useCallback((kind: EventKind, headline: string, detail?: string) => {
    setTimeline((prev) => [
      ...prev.slice(-99),
      { id: uid(), ts: new Date(), kind, headline, detail },
    ]);
  }, []);

  useEffect(() => {
    tlEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  // ── Stop polling helpers ──────────────────────────────────────────────────

  const stopSummaryPolling = useCallback(() => {
    if (summaryPollingRef.current) { clearInterval(summaryPollingRef.current); summaryPollingRef.current = null; }
  }, []);

  const stopRegionsPolling = useCallback(() => {
    if (regionsPollingRef.current) { clearInterval(regionsPollingRef.current); regionsPollingRef.current = null; }
  }, []);

  // ── Mark one request as complete ─────────────────────────────────────────

  const markDoneIfComplete = useCallback(() => {
    pendingCountRef.current -= 1;
    if (pendingCountRef.current <= 0) {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
      setLastRefreshAt(new Date());
    }
  }, []);

  // ── refresh() ─────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    pendingCountRef.current = 2;

    stopSummaryPolling();
    stopRegionsPolling();
    summaryPushRef.current = null;
    regionsPushRef.current = null;

    const rawToken = await getAdminToken();
    const userId   = parseJwtClaim(rawToken, "sub") ?? "anonymous";
    const tenantId = parseJwtClaim(rawToken, "tenant_id") ?? userId;

    const summaryId = uid();
    const regionsId = uid();
    summaryReqIdRef.current = summaryId;
    regionsReqIdRef.current = regionsId;

    const makeBody = (requestId: string, operation: string, params: Record<string, unknown>) => ({
      requestId, operation, params, tenantId, userId,
      options: { priority: "High" },
    });

    try {
      await Promise.all([
        httpProvider.post("/requests", makeBody(summaryId, SUMMARY_OP, {})),
        httpProvider.post("/requests", makeBody(regionsId, REGIONS_OP, { period: "today" })),
      ]);
      setSummaryReqId(summaryId);
      setRegionsReqId(regionsId);
      addEntry(
        "refreshing",
        "Đang lấy dữ liệu mới…",
        sseOpenRef.current ? "Chờ SSE push" : "SSE chưa kết nối — dùng HTTP polling (3s)",
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err as Error)?.message ?? "Lỗi không xác định";
      addEntry("error", "Gửi yêu cầu thất bại", msg);
      pendingCountRef.current = 0;
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [addEntry, stopSummaryPolling, stopRegionsPolling]);

  // Keep refreshRef in sync so SSE handler always calls the latest version
  useLayoutEffect(() => { refreshRef.current = refresh; }, [refresh]);

  // ── Mount ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    refreshRef.current();
  }, []);

  // ── SSE subscriptions (always-on) ─────────────────────────────────────────

  useEffect(() => {
    if (!sseUrl) return;

    // WidgetStale → auto-refresh
    const unsubWidget = poolSubscribe(
      sseUrl,
      "WidgetStale",
      (raw) => {
        const ev = raw as WidgetStaleEvent;
        if (ev.channel !== WIDGET_CHANNEL) return;
        const detail = [ev.reason, ev.updatedAt].filter(Boolean).join(" · ") || "datasource.updated";
        setPushCount((c) => c + 1);
        addEntry("push", "Excel-provider đẩy dữ liệu mới", detail);
        refreshRef.current();
      },
      (status) => setSseStatus(status),
    );

    // RequestCompleted
    const unsubC = poolSubscribe(sseUrl, "RequestCompleted", (raw) => {
      const ev  = raw as RequestCompletedEvent;
      const res = mapPushToResult(ev);
      const elapsed = ev.elapsedMs !== undefined ? ` · ${fmtElapsed(ev.elapsedMs)}` : "";

      if (ev.requestId === summaryReqIdRef.current) {
        const data = res.data as DashboardSummary | undefined;
        if (data) {
          setPrevSummary(prevSummaryRef2.current);
          prevSummaryRef2.current = data;
          setSummary(data);
        }
        summaryPushRef.current = res;
        addEntry(
          res.status === "Completed" ? "done" : "error",
          res.status === "Completed" ? "Tổng quan cập nhật" : "Báo cáo tổng quan thất bại",
          res.status === "Completed" ? `SSE push${elapsed}` : (res.error ?? ev.status),
        );
        markDoneIfComplete();
        stopSummaryPolling();
      }

      if (ev.requestId === regionsReqIdRef.current) {
        const data = (res.data as RegionalPerformance | undefined)?.regions;
        if (data) {
          const prevMap = prevRegionsMapRef.current;
          setPrevRegions(Object.values(prevMap));
          const newMap: Record<string, RegionPerformanceRow> = {};
          data.forEach((r) => { newMap[r.name] = r; });
          prevRegionsMapRef.current = newMap;
          setRegions(data);
        }
        regionsPushRef.current = res;
        addEntry(
          res.status === "Completed" ? "done" : "error",
          res.status === "Completed" ? "Dữ liệu khu vực cập nhật" : "Dữ liệu khu vực thất bại",
          res.status === "Completed" ? `SSE push${elapsed}` : (res.error ?? ev.status),
        );
        markDoneIfComplete();
        stopRegionsPolling();
      }
    }, () => {});

    // RequestFailed
    const unsubF = poolSubscribe(sseUrl, "RequestFailed", (raw) => {
      const ev = raw as RequestCompletedEvent;
      if (ev.requestId === summaryReqIdRef.current) {
        summaryPushRef.current = mapPushToResult(ev);
        addEntry("error", "Báo cáo tổng quan thất bại", ev.error?.message ?? ev.status);
        markDoneIfComplete();
        stopSummaryPolling();
      }
      if (ev.requestId === regionsReqIdRef.current) {
        regionsPushRef.current = mapPushToResult(ev);
        addEntry("error", "Dữ liệu khu vực thất bại", ev.error?.message ?? ev.status);
        markDoneIfComplete();
        stopRegionsPolling();
      }
    }, () => {});

    return () => { unsubWidget(); unsubC(); unsubF(); };
  }, [sseUrl, addEntry, markDoneIfComplete, stopSummaryPolling, stopRegionsPolling]);

  // ── Polling fallback — summary ─────────────────────────────────────────────

  useEffect(() => {
    if (!summaryReqId) return;
    const startedAt = Date.now();

    const tick = async () => {
      if (summaryPushRef.current) { stopSummaryPolling(); return; }
      try {
        const res = await httpProvider.get<{ status: string; data?: unknown; error?: string }>(
          `/requests/${summaryReqId}/result`,
        );
        const d = res.data;
        if (!TERMINAL.includes(d.status as RequestStatus)) return;
        if (d.status === "Completed" && d.data) {
          const data = d.data as DashboardSummary;
          setPrevSummary(prevSummaryRef2.current);
          prevSummaryRef2.current = data;
          setSummary(data);
        }
        summaryPushRef.current = { requestId: summaryReqId, status: d.status as RequestStatus, operation: SUMMARY_OP };
        const elapsed = fmtElapsed(Date.now() - startedAt);
        addEntry(
          d.status === "Completed" ? "done" : "error",
          d.status === "Completed" ? "Tổng quan cập nhật" : "Báo cáo tổng quan thất bại",
          d.status === "Completed" ? `HTTP poll · ${elapsed}` : (d.error ?? d.status),
        );
        markDoneIfComplete();
        stopSummaryPolling();
      } catch (err: unknown) {
        const is404 = (err as { response?: { status?: number } })?.response?.status === 404;
        summaryPushRef.current = { requestId: summaryReqId, status: "Cancelled", operation: SUMMARY_OP };
        if (!is404) addEntry("error", "Lỗi polling tổng quan", (err as Error)?.message);
        markDoneIfComplete();
        stopSummaryPolling();
      }
    };

    summaryPollingRef.current = setInterval(tick, 3_000);
    return stopSummaryPolling;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryReqId]);

  // ── Polling fallback — regions ─────────────────────────────────────────────

  useEffect(() => {
    if (!regionsReqId) return;
    const startedAt = Date.now();

    const tick = async () => {
      if (regionsPushRef.current) { stopRegionsPolling(); return; }
      try {
        const res = await httpProvider.get<{ status: string; data?: unknown; error?: string }>(
          `/requests/${regionsReqId}/result`,
        );
        const d = res.data;
        if (!TERMINAL.includes(d.status as RequestStatus)) return;
        if (d.status === "Completed" && d.data) {
          const regData = ((d.data as RegionalPerformance).regions) ?? [];
          const prevMap = prevRegionsMapRef.current;
          setPrevRegions(Object.values(prevMap));
          const newMap: Record<string, RegionPerformanceRow> = {};
          regData.forEach((r: RegionPerformanceRow) => { newMap[r.name] = r; });
          prevRegionsMapRef.current = newMap;
          setRegions(regData);
        }
        regionsPushRef.current = { requestId: regionsReqId, status: d.status as RequestStatus, operation: REGIONS_OP };
        const elapsed = fmtElapsed(Date.now() - startedAt);
        addEntry(
          d.status === "Completed" ? "done" : "error",
          d.status === "Completed" ? "Dữ liệu khu vực cập nhật" : "Dữ liệu khu vực thất bại",
          d.status === "Completed" ? `HTTP poll · ${elapsed}` : (d.error ?? d.status),
        );
        markDoneIfComplete();
        stopRegionsPolling();
      } catch (err: unknown) {
        const is404 = (err as { response?: { status?: number } })?.response?.status === 404;
        regionsPushRef.current = { requestId: regionsReqId, status: "Cancelled", operation: REGIONS_OP };
        if (!is404) addEntry("error", "Lỗi polling khu vực", (err as Error)?.message);
        markDoneIfComplete();
        stopRegionsPolling();
      }
    };

    regionsPollingRef.current = setInterval(tick, 3_000);
    return stopRegionsPolling;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionsReqId]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const hasSummary  = !!summary;
  const hasRegions  = regions.length > 0;
  const hasAny      = hasSummary || hasRegions;
  const showDelta   = !!prevSummary || prevRegions.length > 0;
  const pollingMode = sseOpen ? "tắt" : "bật (3 s)";

  const sseBadge = (() => {
    if (sseStatus === null)            return { label: "Chưa khởi tạo",  cls: "bg-gray-100 text-gray-600 dark:bg-[#21262d] dark:text-[#8b949e]" };
    if (sseStatus === "reconnecting")  return { label: "Đang kết nối…",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    if (sseStatus === "connected")     return { label: "Đã kết nối ✓",   cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    return                                    { label: "Đã đóng ✗",      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  })();

  const diagMsg = (() => {
    if (sseStatus === "reconnecting") return "EventSource đang thử kết nối tới /sse/events — kiểm tra gateway và request-api đã deploy chưa.";
    if (sseStatus === "disconnected") return "EventSource bị đóng — có thể lỗi 401/404/502. Mở DevTools → Network → filter \"eventsource\" để xem chi tiết.";
    return "sseClient chưa được khởi tạo.";
  })();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-4 border-b border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117]">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] m-0 leading-tight">
              Theo dõi đồng bộ dữ liệu
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0 mt-0.5">
              Dữ liệu từ excel-provider tự động cập nhật qua SSE khi có thay đổi
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* SSE badge */}
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${sseBadge.cls}`}>
              <Wifi size={12} className={sseOpen ? "text-green-500" : "text-amber-500"} />
              {sseBadge.label}
            </span>

            {/* Push counter */}
            {pushCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                {pushCount} push nhận được
              </span>
            )}

            {/* Refresh button */}
            <Button
              size="small"
              icon={<RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />}
              onClick={() => refresh()}
              disabled={isRefreshing}
            >
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* ── SSE Diagnostic Bar ── */}
      {!sseOpen && (
        <div className="shrink-0 px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2.5">
            <span className="text-amber-600 dark:text-amber-400 text-sm shrink-0 mt-px">⚠</span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 m-0">
                SSE chưa kết nối — polling HTTP mỗi 3 giây làm fallback
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 m-0">{diagMsg}</p>
              <code className="block text-xs font-mono bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 px-3 py-1.5 rounded mt-1.5">
                docker compose build request-api gateway &amp;&amp; docker compose up -d request-api gateway
              </code>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 grid grid-cols-[290px_1fr] overflow-hidden">

        {/* ── Left: Timeline ── */}
        <div className="flex flex-col border-r border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] overflow-hidden">
          {/* Panel header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#21262d]">
            <span className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3]">Lịch sử sự kiện</span>
            {timeline.length > 0 && (
              <button
                onClick={() => setTimeline([])}
                className="text-[11px] text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Timeline scroll area */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {timeline.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-[#484f58] text-center py-8">Chưa có sự kiện</p>
            ) : (
              <>
                {timeline.map((e) => <TimelineCard key={e.id} entry={e} />)}
                <div ref={tlEndRef} />
              </>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-2.5 border-t border-gray-100 dark:border-[#21262d] bg-gray-50/60 dark:bg-[#010409]/40">
            <p className="text-[11px] font-mono text-indigo-500 dark:text-indigo-400 m-0 truncate">
              📡 {WIDGET_CHANNEL}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">
              Push: {pushCount} · Polling: {pollingMode}
            </p>
          </div>
        </div>

        {/* ── Right: Data ── */}
        <div className="overflow-y-auto p-6 space-y-6">

          {/* Refresh status line */}
          <div className="h-5 flex items-center">
            {!hasAny && !isRefreshing && (
              <span className="text-xs text-gray-400 dark:text-[#484f58]">Đang tải dữ liệu lần đầu…</span>
            )}
            {hasAny && lastRefreshAt && !isRefreshing && (
              <span className="text-xs text-gray-400 dark:text-[#484f58]">
                Cập nhật lúc: <span className="font-mono tabular-nums">{fmtTime(lastRefreshAt)}</span>
              </span>
            )}
            {isRefreshing && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 animate-pulse">
                <Loader2 size={11} className="animate-spin" />
                Đang làm mới…
              </span>
            )}
          </div>

          {/* Section 1 — KPI Cards */}
          <section>
            <p className="text-[10px] font-bold text-gray-400 dark:text-[#484f58] uppercase tracking-widest m-0 mb-3">
              TỔNG QUAN DASHBOARD
            </p>
            {!hasSummary ? (
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <KpiCard
                  label="DOANH THU"
                  value={fmt(summary!.totalRevenue)}
                  unit="VNĐ"
                  delta={prevSummary ? numDelta(summary!.totalRevenue, prevSummary.totalRevenue) : undefined}
                />
                <KpiCard
                  label="SỐ LƯỢNG"
                  value={fmt(summary!.totalUnits)}
                  delta={prevSummary ? numDelta(summary!.totalUnits, prevSummary.totalUnits) : undefined}
                />
                <KpiCard
                  label="TOP KHU VỰC"
                  value={summary!.topRegion}
                  prevValue={
                    prevSummary && prevSummary.topRegion !== summary!.topRegion
                      ? prevSummary.topRegion
                      : undefined
                  }
                />
                <KpiCard
                  label="TOP SẢN PHẨM"
                  value={
                    <span className="text-base font-bold truncate block leading-tight">
                      {summary!.topProduct}
                    </span>
                  }
                  warning={summary!.alerts.length > 0 ? `⚠ ${summary!.alerts.length} cảnh báo` : undefined}
                />
              </div>
            )}
          </section>

          {/* Section 2 — Alerts */}
          {hasSummary && summary!.alerts.length > 0 && (
            <section>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest m-0 mb-2">
                CẢNH BÁO ({summary!.alerts.length})
              </p>
              <div className="space-y-2">
                {summary!.alerts.map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5"
                  >
                    <span className="text-amber-600 dark:text-amber-400 shrink-0 text-sm">⚠</span>
                    <p className="text-sm text-amber-800 dark:text-amber-300 m-0">{alert}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3 — Regional Performance */}
          <section>
            <p className="text-[10px] font-bold text-gray-400 dark:text-[#484f58] uppercase tracking-widest m-0 mb-3">
              HIỆU SUẤT THEO KHU VỰC (HÔM NAY)
            </p>

            {!hasRegions ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-11 rounded-xl bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#21262d] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#30363d]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="sticky top-0 bg-gray-50 dark:bg-[#0d1117]">
                      <th className="text-left text-xs font-semibold text-gray-500 dark:text-[#8b949e] px-4 py-2.5">
                        Khu vực
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-500 dark:text-[#8b949e] px-4 py-2.5">
                        Doanh thu
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-500 dark:text-[#8b949e] px-4 py-2.5">
                        SL
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-500 dark:text-[#8b949e] px-4 py-2.5">
                        Đạt mục tiêu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#21262d] bg-white dark:bg-[#161b22]">
                    {regions.map((row) => {
                      const prev   = prevRegions.find((p) => p.name === row.name) ?? null;
                      const pct    = Math.min(100, Math.max(0, row.achievementPct));
                      const pctCls = pct >= 80
                        ? "text-green-600 dark:text-green-400"
                        : pct >= 60
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400";
                      return (
                        <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-[#1c2128] transition-colors">
                          <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-[#e6edf3]">
                            {row.name}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-[#c9d1d9]">
                            <span className="inline-flex items-center justify-end gap-1">
                              {fmt(row.revenue)}
                              {prev && <DeltaArrow delta={numDelta(row.revenue, prev.revenue)} />}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-[#c9d1d9]">
                            <span className="inline-flex items-center justify-end gap-1">
                              {fmt(row.units)}
                              {prev && <DeltaArrow delta={numDelta(row.units, prev.units)} />}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-2">
                              <RegionProgressBar pct={pct} />
                              <span className={`w-10 text-right text-xs font-semibold tabular-nums ${pctCls}`}>
                                {pct.toFixed(0)}%
                              </span>
                              {prev && <DeltaArrow delta={numDelta(row.achievementPct, prev.achievementPct)} />}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Delta footnote */}
          {showDelta && (
            <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0">
              ↑↓ Thay đổi so với lần cập nhật trước
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
