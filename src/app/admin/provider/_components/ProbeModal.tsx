"use client";

import { useState } from "react";
import { Modal, Button, Space, Tag } from "antd";
import { Loader2, CheckCircle2, XCircle, Wifi, Zap } from "lucide-react";
import type { Provider, ProbeResult } from "../_lib/types";
import { providerColor } from "../_lib/constants";

type StepStatus = "idle" | "running" | "ok" | "error";

interface Step {
  key: keyof Pick<ProbeResult, "tlsHandshake" | "jwtAccepted" | "welcomeReceived">;
  label: string;
  desc: string;
}

const STEPS: Step[] = [
  { key: "tlsHandshake",    label: "TLS Handshake",  desc: "Kết nối TCP/TLS đến provider-bridge:5400" },
  { key: "jwtAccepted",     label: "JWT Accepted",   desc: "Xác thực Bearer token với bridge"          },
  { key: "welcomeReceived", label: "gRPC Welcome",   desc: "Nhận Welcome message — session active"     },
];

function StepRow({ step, status, error }: { step: Step; status: StepStatus; error?: string }) {
  const borderColor =
    status === "ok"      ? "#b7eb8f" :
    status === "error"   ? "#ffccc7" :
    status === "running" ? "#d3adf7" :
    undefined;

  const bg =
    status === "ok"      ? "rgba(82,196,26,.08)"   :
    status === "error"   ? "rgba(255,77,79,.08)"    :
    status === "running" ? "rgba(114,46,209,.07)"   :
    undefined;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors"
      style={{ borderColor: borderColor ?? "#d9d9d9", background: bg }}
    >
      <div className="mt-0.5 shrink-0">
        {status === "running" && <Loader2 size={16} className="animate-spin text-emerald-600" />}
        {status === "ok"      && <CheckCircle2 size={16} />}
        {status === "error"   && <XCircle size={16} />}
        {status === "idle"    && <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-[#1f2937]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold m-0 leading-tight ${
          status === "ok"    ? "text-emerald-700 dark:text-emerald-400" :
          status === "error" ? "text-red-600 dark:text-red-400" :
                               "text-gray-700 dark:text-[#e6edf3]"
        }`}>
          {step.label}
          {status === "ok"    && " ✓"}
          {status === "error" && " ✗"}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">
          {status === "error" ? (error ?? "Lỗi không xác định") : step.desc}
        </p>
      </div>
    </div>
  );
}

async function simulateProbe(
  onStep: (idx: number, status: StepStatus) => void,
): Promise<ProbeResult> {
  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  for (let i = 0; i < STEPS.length; i++) {
    onStep(i, "running");
    await delay(400 + Math.random() * 300);
    onStep(i, "ok");
  }
  return {
    tlsHandshake: true, jwtAccepted: true, welcomeReceived: true,
    latencyMs: Math.floor(8 + Math.random() * 20),
    sessionId: `0191${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 6)}`,
    errorDetail: null,
  };
}

export function ProbeModal({
  provider,
  onClose,
}: {
  provider: Provider;
  onClose:  () => void;
}) {
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(["idle", "idle", "idle"]);
  const [result, setResult] = useState<ProbeResult | null>(null);
  const [running, setRunning] = useState(false);
  const color = providerColor(provider.providerId);
  const initials = provider.providerId.split("-").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  const allDone = stepStatuses.every((s) => s === "ok");

  async function runProbe() {
    setRunning(true);
    setResult(null);
    setStepStatuses(["idle", "idle", "idle"]);
    const res = await simulateProbe((idx, status) => {
      setStepStatuses((prev) => { const next = [...prev]; next[idx] = status; return next; });
    });
    setResult(res);
    setRunning(false);
  }

  const title = (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
        style={{ background: color }}
      >
        {initials}
      </div>
      <div>
        <div className="text-sm font-bold">Probe gRPC Connection</div>
        <div className="text-[11px] font-normal text-gray-400">{provider.providerId}</div>
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Wifi size={14} className="text-gray-400" />
        <span className="text-[11px] text-gray-400">
          {allDone ? "Kết nối thành công" : running ? "Đang kiểm tra..." : "Sẵn sàng probe"}
        </span>
      </div>
      <Space>
        <Button onClick={onClose}>Đóng</Button>
        <Button
          type="primary"
          loading={running}
          onClick={runProbe}
          icon={!running ? <Zap size={14} /> : undefined}
        >
          {running ? "Đang probe..." : "Chạy Probe"}
        </Button>
      </Space>
    </div>
  );

  return (
    <Modal
      open
      onCancel={onClose}
      title={title}
      footer={footer}
      width={480}
    >
      <div className="space-y-2 mt-2">
        {STEPS.map((step, i) => (
          <StepRow key={step.key} step={step} status={stepStatuses[i] ?? "idle"} />
        ))}
      </div>

      {result && allDone && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0a0f1a] border border-gray-100 dark:border-[#1f2937] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500">Latency</span>
            <Tag color="success" style={{ fontWeight: 700 }}>{result.latencyMs} ms</Tag>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-semibold text-gray-500 shrink-0">Session ID</span>
            <code className="text-[10px] text-gray-600 dark:text-[#e6edf3] text-right break-all">{result.sessionId}</code>
          </div>
        </div>
      )}
    </Modal>
  );
}
