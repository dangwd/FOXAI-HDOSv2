"use client";

import { useEffect, useState } from "react";
import { Select } from "antd";
import { adminApi } from "@/infrastructure/http/adminApi";
import type { OperationEntry, ProviderInfo } from "@/infrastructure/http/adminApi";

export function ProviderOperationSelect({
  value,
  onChange,
}: {
  value:    string;
  onChange: (v: string) => void;
}) {
  const [providers,  setProviders]  = useState<ProviderInfo[]>([]);
  const [operations, setOperations] = useState<OperationEntry[]>([]);
  const [selProv,    setSelProv]    = useState<string | null>(null);

  useEffect(() => {
    adminApi.listProviders().then(setProviders).catch(() => {});
    adminApi.listOperations().then(setOperations).catch(() => {});
  }, []);

  // When value changes externally (switching widget), detect provider
  useEffect(() => {
    async function sync() {
      if (!value) { setSelProv(null); return; }
      const op = operations.find((o) => o.pattern === value);
      if (op) setSelProv(op.providerId || null);
    }
    sync();
  }, [value, operations]);

  const filteredOps = selProv
    ? operations.filter((o) => o.providerId === selProv)
    : operations;

  return (
    <div className="space-y-1.5">
      <Select
        size="small"
        value={selProv ?? undefined}
        onChange={(v) => { setSelProv(v ?? null); onChange(""); }}
        allowClear
        placeholder="Chọn provider..."
        style={{ width: "100%" }}
        showSearch
        optionFilterProp="label"
        options={providers.map((p) => ({ value: p.id, label: p.name }))}
      />
      <Select
        size="small"
        value={value || undefined}
        onChange={(v) => onChange(v ?? "")}
        allowClear
        placeholder="Chọn operation..."
        style={{ width: "100%" }}
        showSearch
        optionFilterProp="label"
        disabled={!selProv}
        options={filteredOps.map((o) => ({ value: o.pattern, label: o.pattern }))}
      />
    </div>
  );
}
