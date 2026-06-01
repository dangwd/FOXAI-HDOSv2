"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input, InputNumber, Select } from "antd";
import { Loader2, Wifi } from "lucide-react";
import httpProvider from "@/infrastructure/http/httpForProvider";
import useAuthStore from "@/core/auth/authStore";
import { poolSubscribe } from "@/core/sse/ssePool";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority      = "Low" | "Normal" | "High";
type RequestStatus = "Queued" | "Processing" | "Completed" | "Failed" | "Cancelled";

const TERMINAL: RequestStatus[] = ["Completed", "Failed", "Cancelled"];

interface RequestResult {
  requestId:  string;
  status:     RequestStatus;
  operation:  string;
  data?:      unknown;
  error?:     string;
}

interface LogEntry {
  id:        string;
  type:      "Submitted" | "RequestCompleted" | "RequestFailed" | "WidgetStale";
  payload:   unknown;
  ts:        Date;
  isCurrent: boolean;
}

interface RequestCompletedEvent {
  requestId:    string;
  status:       string;
  operation:    string;
  payloadJson?: string;
  error?:       { code?: string; message?: string };
  elapsedMs?:   number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SAMPLE_PARAMS: Record<string, string> = {
  "report.dashboard.summary":    "{}",
  "report.sales.trend":          JSON.stringify({ fromDate: "2025-01-01", toDate: "2025-12-31", groupBy: "day" }, null, 2),
  "report.regional.performance": JSON.stringify({ period: "today" }, null, 2),
  "report.inventory.status":     "{}",
  "report.channel.comparison":   "{}",
  "report.top.performers":       "{}",
  "report.product.detail":       JSON.stringify({ productName: "" }, null, 2),
  "metadata.dashboards.upsert":  JSON.stringify({ Definition: { dashboardCode: "my-dashboard", title: "My Dashboard", widgets: [] } }, null, 2),
};

const SAMPLES = Object.keys(SAMPLE_PARAMS);

const STATUS_PROGRESS: Partial<Record<RequestStatus, number>> = {
  Queued:     20,
  Processing: 60,
  Completed:  100,
  Failed:     100,
  Cancelled:  100,
};

const LOG_META = {
  Submitted: {
    badge:       "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    cardCurrent: "border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30",
    cardOther:   "border-gray-100 bg-white dark:border-[#30363d] dark:bg-[#0d1117]",
  },
  RequestCompleted: {
    badge:       "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    cardCurrent: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
    cardOther:   "border-gray-100 bg-gray-50 dark:border-[#30363d] dark:bg-[#161b22]",
  },
  RequestFailed: {
    badge:       "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    cardCurrent: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
    cardOther:   "border-red-100 bg-red-50 dark:border-red-900 dark:bg-red-950/20",
  },
  WidgetStale: {
    badge:       "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    cardCurrent: "border-yellow-100 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30",
    cardOther:   "border-yellow-100 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20",
  },
} satisfies Record<LogEntry["type"], { badge: string; cardCurrent: string; cardOther: string }>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJwtClaim(token: string | null, claim: string): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as Record<string, unknown>;
    return (payload[claim] as string) ?? null;
  } catch { return null; }
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

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-gray-400 dark:text-[#484f58] uppercase tracking-widest m-0 mb-2.5">
      {children}
    </p>
  );
}

function ProgressBar({ status, requestId }: { status: RequestStatus | null; requestId: string | null }) {
  if (!status && !requestId) return null;
  const pct    = STATUS_PROGRESS[status ?? "Queued"] ?? 20;
  const done   = status === "Completed";
  const failed = status === "Failed";
  const live   = !TERMINAL.includes(status ?? "Queued");
  const color  = done ? "bg-green-500" : failed ? "bg-red-500" : "bg-violet-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#21262d] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color} ${live ? "animate-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {requestId && (
        <span className="text-[10px] font-mono text-gray-400 dark:text-[#484f58] shrink-0">
          {requestId.slice(0, 8)}…
        </span>
      )}
    </div>
  );
}

function StatusBadge({ result, polling }: { result: RequestResult; polling: boolean }) {
  const { status, error } = result;
  const colors: Partial<Record<string, string>> = {
    Completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    Failed:    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    Cancelled: "bg-gray-100 text-gray-600 dark:bg-[#21262d] dark:text-[#8b949e]",
  };
  const color = colors[status] ?? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
        {polling && <Loader2 size={10} className="animate-spin" />}
        {status}
        {polling && <span className="font-normal opacity-70 ml-0.5">polling…</span>}
      </span>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}

function LogCard({ entry }: { entry: LogEntry }) {
  const m = LOG_META[entry.type];
  const card = entry.isCurrent ? m.cardCurrent : m.cardOther;
  return (
    <div className={`rounded-xl border p-3 space-y-1.5 ${card}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.badge}`}>
          {entry.type}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-[#484f58] tabular-nums">
          {entry.ts.toLocaleTimeString()}
        </span>
        {entry.isCurrent && (
          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">● CURRENT</span>
        )}
      </div>
      <pre className="text-[10px] font-mono text-gray-600 dark:text-[#8b949e] max-h-40 overflow-auto break-all whitespace-pre-wrap m-0">
        {JSON.stringify(entry.payload, null, 2)}
      </pre>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConsolePage() {
  // form state
  const [operation,   setOperation]   = useState("");
  const [paramsText,  setParamsText]  = useState("{}");
  const [priority,    setPriority]    = useState<Priority>("Normal");
  const [cacheSecs,   setCacheSecs]   = useState(60);
  const [paramsError, setParamsError] = useState<string | null>(null);

  // request state
  const [requestId,   setRequestId]   = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pushed,      setPushed]      = useState<RequestResult | null>(null);
  const [polled,      setPolled]      = useState<RequestResult | null>(null);
  const [isPolling,   setIsPolling]   = useState(false);

  // log state
  const [entries, setEntries] = useState<LogEntry[]>([]);

  // stable refs for async closures
  const requestIdRef   = useRef<string | null>(null);
  const pushedRef      = useRef<RequestResult | null>(null);
  const operationRef   = useRef<string>("");
  const pollingRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef      = useRef<HTMLDivElement>(null);

  // auth
  const accessToken = useAuthStore((s) => s.accessToken);
  const user        = useAuthStore((s) => s.user);

  // derived
  const result        = pushed ?? polled ?? null;
  const isTerminal    = !!result && TERMINAL.includes(result.status);
  const isRunning     = submitting || (!!requestId && !isTerminal);
  const displayStatus = result?.status ?? (requestId ? "Queued" as RequestStatus : null);

  const sseUrl = accessToken
    ? `${process.env.NEXT_PUBLIC_SSE_URL ?? "/notifications/sse"}?access_token=${encodeURIComponent(accessToken)}`
    : null;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const appendLog = useCallback((entry: Omit<LogEntry, "id">) => {
    setEntries((prev) => [...prev.slice(-299), { ...entry, id: uid() }]);
  }, []);

  // auto-scroll to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  // ── SSE subscriptions (always-on) ────────────────────────────────────────────

  useEffect(() => {
    if (!sseUrl) return;

    function handleRequestEvent(type: "RequestCompleted" | "RequestFailed") {
      return (data: unknown) => {
        const ev      = data as RequestCompletedEvent;
        const isCur   = ev.requestId === requestIdRef.current;
        appendLog({ type, payload: data, ts: new Date(), isCurrent: isCur });
        if (isCur) {
          const r = mapPushToResult(ev);
          pushedRef.current = r;
          setPushed(r);
        }
      };
    }

    const unsubC = poolSubscribe(sseUrl, "RequestCompleted", handleRequestEvent("RequestCompleted"), () => {});
    const unsubF = poolSubscribe(sseUrl, "RequestFailed",    handleRequestEvent("RequestFailed"),    () => {});
    const unsubS = poolSubscribe(sseUrl, "WidgetStale", (data) => {
      appendLog({ type: "WidgetStale", payload: data, ts: new Date(), isCurrent: false });
    }, () => {});

    return () => { unsubC(); unsubF(); unsubS(); };
  }, [sseUrl, appendLog]);

  // ── Polling fallback ──────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!requestId) return;

    const tick = async () => {
      if (pushedRef.current) { stopPolling(); return; }
      try {
        setIsPolling(true);
        const res = await httpProvider.get<{ status: string; data?: unknown; error?: string }>(
          `/requests/${requestId}/result`,
        );
        const d = res.data;
        const r: RequestResult = {
          requestId,
          status:    d.status as RequestStatus,
          operation: operationRef.current,
          data:      d.data,
          error:     d.error,
        };
        setPolled(r);
        if (TERMINAL.includes(r.status)) stopPolling();
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          setPolled({ requestId, status: "Cancelled", operation: operationRef.current });
        }
        stopPolling();
      }
    };

    pollingRef.current = setInterval(tick, 3_000);
    return stopPolling;
  }, [requestId, stopPolling]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  function pickOperation(op: string) {
    setOperation(op);
    operationRef.current = op;
    if (SAMPLE_PARAMS[op] !== undefined) setParamsText(SAMPLE_PARAMS[op]);
  }

  async function submitRequest() {
    let params: unknown;
    try {
      params = JSON.parse(paramsText);
    } catch (e: unknown) {
      setParamsError(`JSON không hợp lệ: ${(e as Error).message}`);
      return;
    }
    setParamsError(null);
    setSubmitError(null);

    const newId   = uid();
    const userId  = user?.id ?? "admin";
    const tenantId = parseJwtClaim(accessToken, "tenant_id") ?? userId;

    // reset previous run
    setSubmitting(true);
    setRequestId(null);
    setPushed(null);
    setPolled(null);
    pushedRef.current    = null;
    requestIdRef.current = null;
    operationRef.current = operation;
    stopPolling();

    try {
      await httpProvider.post("/requests", {
        requestId: newId,
        operation,
        params,
        tenantId,
        userId,
        options: { priority, cacheSeconds: cacheSecs, timeoutMs: null },
      });

      requestIdRef.current = newId;
      setRequestId(newId);
      appendLog({
        type:      "Submitted",
        payload:   { requestId: newId, operation, params, tenantId, userId },
        ts:        new Date(),
        isCurrent: true,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Gửi yêu cầu thất bại";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const btnLabel = submitting
    ? "Đang gửi…"
    : requestId && !isTerminal
      ? "Đang xử lý…"
      : "Gửi yêu cầu";

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 h-full flex flex-col">

      {/* Header */}
      <div className="mb-5 shrink-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] m-0">Test Console</h1>
        <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0 mt-0.5">
          Gửi operation request thủ công và theo dõi kết quả theo thời gian thực.
        </p>
      </div>

      {/* 2-column grid */}
      <div className="flex-1 min-h-0 grid xl:grid-cols-[1fr_400px] gap-5">

        {/* ── Cột trái ── */}
        <div className="flex flex-col gap-4 overflow-y-auto min-h-0 pr-0.5">

          {/* Quick-pick */}
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 shrink-0">
            <SectionLabel>Chọn nhanh</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLES.map((op) => (
                <button
                  key={op}
                  onClick={() => pickOperation(op)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                    operation === op
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-gray-50 dark:bg-[#161b22] text-gray-600 dark:text-[#8b949e] border-gray-200 dark:border-[#30363d] hover:border-violet-400 dark:hover:border-violet-600"
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 space-y-4 shrink-0">
            <SectionLabel>Form yêu cầu</SectionLabel>

            {/* Operation */}
            <div>
              <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">
                Operation
              </label>
              <Input
                value={operation}
                onChange={(e) => {
                  const v = e.target.value;
                  setOperation(v);
                  operationRef.current = v;
                  if (SAMPLE_PARAMS[v] !== undefined) setParamsText(SAMPLE_PARAMS[v]);
                }}
                placeholder="report.dashboard.summary"
                className="font-mono"
              />
            </div>

            {/* Params */}
            <div>
              <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">
                Params (JSON)
              </label>
              <Input.TextArea
                value={paramsText}
                onChange={(e) => { setParamsText(e.target.value); setParamsError(null); }}
                rows={7}
                className="font-mono"
                style={{ resize: "none" }}
              />
              {paramsError && (
                <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 m-0">{paramsError}</p>
              )}
            </div>

            {/* Priority + Cache */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">
                  Priority
                </label>
                <Select
                  value={priority}
                  onChange={(v) => setPriority(v as Priority)}
                  options={[
                    { value: "Low",    label: "Low"    },
                    { value: "Normal", label: "Normal" },
                    { value: "High",   label: "High"   },
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">
                  Cache (giây)
                </label>
                <InputNumber
                  value={cacheSecs}
                  onChange={(v) => setCacheSecs(v ?? 0)}
                  min={0}
                  max={3600}
                  className="w-full"
                />
              </div>
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5">
                <p className="text-[12px] text-red-600 dark:text-red-400 m-0">{submitError}</p>
              </div>
            )}

            <Button
              type="primary"
              block
              loading={isRunning}
              disabled={isRunning || !operation.trim()}
              onClick={submitRequest}
            >
              {btnLabel}
            </Button>
          </div>

          {/* Result area */}
          {(requestId || result) && (
            <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 space-y-4 shrink-0">
              <SectionLabel>Kết quả</SectionLabel>

              <ProgressBar status={displayStatus} requestId={requestId} />

              {result && (
                <>
                  <StatusBadge result={result} polling={isPolling} />

                  {result.data != null && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-[#484f58] uppercase tracking-widest mb-1.5 m-0">
                        Data
                      </p>
                      <pre className="text-[11px] font-mono bg-gray-50 dark:bg-[#161b22] border border-gray-100 dark:border-[#21262d] rounded-xl p-3 max-h-72 overflow-auto break-all whitespace-pre-wrap m-0">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Cột phải — Event log ── */}
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-xl flex flex-col min-h-0">

          {/* Log header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-[#30363d] flex items-center gap-2.5 shrink-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] m-0 leading-tight">
                Luồng sự kiện SSE
              </p>
              <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0">
                RequestCompleted · RequestFailed · WidgetStale
              </p>
            </div>
            <button
              onClick={() => setEntries([])}
              className="text-[11px] text-gray-400 dark:text-[#484f58] hover:text-gray-600 dark:hover:text-[#8b949e] transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-[#21262d] shrink-0"
            >
              Xóa log
            </button>
          </div>

          {/* Log body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                <Wifi size={32} className="text-gray-200 dark:text-[#21262d]" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-500 dark:text-[#8b949e] m-0">
                    Chờ sự kiện SSE…
                  </p>
                  <p className="text-xs text-gray-400 dark:text-[#484f58] m-0 mt-1 max-w-[220px]">
                    Gửi một yêu cầu hoặc chờ provider push dữ liệu.
                  </p>
                </div>
              </div>
            ) : (
              entries.map((e) => <LogCard key={e.id} entry={e} />)
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
