"use client";

// Hook quản lý CRUD + triggerSync cho ViewBinding (doc 44).
// Pattern: mirror của useSourceProfiles — load on mount, optimistic delete, message feedback.

import { useCallback, useEffect, useMemo, useState } from "react";
import { App } from "antd";
import { adminApi } from "@/infrastructure/http/adminApi";
import type { ViewBinding, ViewBindingFormValues } from "../_lib/types";

export function useViewBindings() {
  const { message } = App.useApp();

  const [bindings, setBindings] = useState<ViewBinding[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [syncing,  setSyncing]  = useState<string | null>(null); // id đang sync
  const [error,    setError]    = useState<string | null>(null);
  const [search,   setSearch]   = useState("");

  // ── Load ──────────────────────────────────────────────────────────────────

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listViewBindings();
      setBindings(data ?? []);
    } catch {
      setError("Không thể tải danh sách ViewBindings");
      message.error("Không thể tải danh sách ViewBindings");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    let active = true;
    adminApi.listViewBindings()
      .then((data) => { if (active) { setBindings(data ?? []); setLoading(false); } })
      .catch(() => {
        if (active) {
          setError("Không thể tải danh sách ViewBindings");
          message.error("Không thể tải danh sách ViewBindings");
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [message]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bindings;
    return bindings.filter(
      (b) =>
        b.viewName.toLowerCase().includes(q) ||
        b.sourceSystem.toLowerCase().includes(q) ||
        b.recordType.toLowerCase().includes(q),
    );
  }, [bindings, search]);

  // ── Create ────────────────────────────────────────────────────────────────

  async function create(values: ViewBindingFormValues): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const created = await adminApi.createViewBinding(values);
      setBindings((prev) => [created, ...prev]);
      message.success(`Đã tạo binding cho "${values.viewName}"`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg =
        status === 409
          ? "ViewBinding với view này đã tồn tại"
          : "Không thể tạo ViewBinding";
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async function update(id: string, values: ViewBindingFormValues): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateViewBinding(id, {
        businessKeyColumn:   values.businessKeyColumn,
        updatedAtColumn:     values.updatedAtColumn,
        pollIntervalSeconds: values.pollIntervalSeconds,
      });
      setBindings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      message.success("Đã cập nhật ViewBinding");
    } catch {
      const msg = "Không thể cập nhật ViewBinding";
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete (optimistic) ───────────────────────────────────────────────────

  async function remove(id: string): Promise<void> {
    const target = bindings.find((b) => b.id === id);
    if (!target) return;
    setBindings((prev) => prev.filter((b) => b.id !== id));
    try {
      await adminApi.deleteViewBinding(id);
      message.success(`Đã xóa binding "${target.viewName}"`);
    } catch {
      setBindings((prev) => [target, ...prev]);
      message.error("Xóa thất bại, vui lòng thử lại");
    }
  }

  // ── Trigger sync thủ công ─────────────────────────────────────────────────

  async function triggerSync(id: string): Promise<void> {
    const target = bindings.find((b) => b.id === id);
    if (!target) return;
    setSyncing(id);
    try {
      await adminApi.triggerViewBindingSync(id);
      message.success(`Đã gửi lệnh sync cho "${target.viewName}"`);
    } catch {
      message.error("Không thể trigger sync, kiểm tra lại LakehouseService");
    } finally {
      setSyncing(null);
    }
  }

  return {
    bindings,
    filtered,
    loading,
    saving,
    syncing,
    error,
    search,
    setSearch,
    create,
    update,
    remove,
    triggerSync,
    reload,
  };
}
