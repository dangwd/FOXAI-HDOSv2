"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App } from "antd";
import { adminApi } from "@/infrastructure/http/adminApi";
import { rowsToMappings } from "../_lib/types";
import type { ProfileFormValues, SourceProfile } from "../_lib/types";

export function useSourceProfiles() {
  const { message } = App.useApp();

  const [profiles,     setProfiles]     = useState<SourceProfile[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [search,       setSearch]       = useState("");
  const [systemFilter, setSystemFilter] = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listSourceProfiles();
      setProfiles(data ?? []);
    } catch {
      setError("Không thể tải danh sách Source Profiles");
      message.error("Không thể tải danh sách Source Profiles");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    let active = true;
    adminApi.listSourceProfiles()
      .then((data) => { if (active) { setProfiles(data ?? []); setLoading(false); } })
      .catch(() => {
        if (active) {
          setError("Không thể tải danh sách Source Profiles");
          message.error("Không thể tải danh sách Source Profiles");
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [message]);

  // ── Derived lists ─────────────────────────────────────────────────────────

  const allSystems = useMemo(
    () => [...new Set(profiles.map((p) => p.sourceSystem))].sort(),
    [profiles],
  );

  const filtered = useMemo(() => {
    let list = profiles;
    if (systemFilter) list = list.filter((p) => p.sourceSystem === systemFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.sourceSystem.toLowerCase().includes(q) ||
          p.recordType.toLowerCase().includes(q) ||
          p.displayName.toLowerCase().includes(q) ||
          p.businessKeyField.toLowerCase().includes(q),
      );
    }
    return list;
  }, [profiles, systemFilter, search]);

  // ── Create ────────────────────────────────────────────────────────────────

  async function create(values: ProfileFormValues): Promise<void> {
    const mappings = rowsToMappings(values.mappings);
    setSaving(true);
    setError(null);
    try {
      const created = await adminApi.createSourceProfile({ ...values, mappings });
      setProfiles((prev) => [created, ...prev]);
      message.success(`Đã tạo "${values.displayName}"`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg =
        status === 409
          ? "Cặp (sourceSystem, recordType) đã tồn tại"
          : "Không thể tạo source profile";
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async function update(id: string, values: ProfileFormValues): Promise<void> {
    const mappings = rowsToMappings(values.mappings);
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateSourceProfile(id, {
        displayName:      values.displayName,
        businessKeyField: values.businessKeyField,
        mappings,
      });
      setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)));
      message.success("Đã cập nhật source profile");
    } catch {
      const msg = "Không thể cập nhật source profile";
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function remove(id: string): Promise<void> {
    const target = profiles.find((p) => p.id === id);
    if (!target) return;
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    try {
      await adminApi.deleteSourceProfile(id);
      message.success(`Đã xóa "${target.displayName}"`);
    } catch {
      setProfiles((prev) => [target, ...prev]);
      message.error("Xóa thất bại, vui lòng thử lại");
    }
  }

  return {
    profiles,
    filtered,
    allSystems,
    loading,
    saving,
    error,
    search,
    setSearch,
    systemFilter,
    setSystemFilter,
    create,
    update,
    remove,
    reload,
  };
}
