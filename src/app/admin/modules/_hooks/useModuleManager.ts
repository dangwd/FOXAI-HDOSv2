"use client";

import { useState, useEffect, useMemo } from "react";
import { App } from "antd";
import { adminApi } from "@/infrastructure/http/adminApi";
import type { FormsModule } from "@/infrastructure/http/adminApi";
import type { ModuleForm } from "../_lib/types";

export function useModuleManager() {
  const { message } = App.useApp();
  const [modules,   setModules]   = useState<FormsModule[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search,    setSearch]    = useState("");
  const [tick,      setTick]      = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await adminApi.listFormsModules();
        setModules(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(msg);
        console.error("[ModuleManager] load failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [tick]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q),
    );
  }, [modules, search]);

  async function create(form: ModuleForm): Promise<void> {
    if (!form.code.trim() || !form.name.trim()) {
      throw new Error("Thiếu thông tin bắt buộc: code, tên");
    }
    await adminApi.createFormsModule({
      code:        form.code.trim(),
      name:        form.name.trim(),
      description: form.description.trim() || undefined,
    });
    setTick((t) => t + 1);
    message.success("Tạo module thành công");
  }

  return { modules, filtered, loading, loadError, search, setSearch, create };
}
