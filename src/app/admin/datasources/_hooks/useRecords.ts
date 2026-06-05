"use client";

import { useState } from "react";
import { App } from "antd";
import { adminApi } from "@/infrastructure/http/adminApi";
import type { DmRecordDto, DmRecordsQuery } from "@/infrastructure/http/adminApi";

export function useRecords() {
  const { message } = App.useApp();

  const [records,  setRecords]  = useState<DmRecordDto[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(params: DmRecordsQuery) {
    setLoading(true);
    try {
      const data = await adminApi.getDmRecords(params);
      setRecords(data ?? []);
      setSearched(true);
    } catch {
      message.error("Không thể tải danh sách records");
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setRecords([]);
    setSearched(false);
  }

  return { records, loading, searched, search, clear };
}
