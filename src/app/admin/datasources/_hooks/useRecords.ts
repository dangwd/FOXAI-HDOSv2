"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { App } from "antd";
import { adminApi } from "@/infrastructure/http/adminApi";
import type { DmRecordsQuery } from "@/infrastructure/http/adminApi";

export function useRecords() {
  const { message } = App.useApp();
  const [params, setParams] = useState<DmRecordsQuery | null>(null);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["dm", "records", params],
    queryFn:  () => adminApi.getDmRecords(params!),
    enabled:  !!params,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (isError) message.error("Không thể tải danh sách records");
  }, [isError, message]);

  return {
    records:  data   ?? [],
    loading:  isFetching,
    searched: !!params,
    search:   (p: DmRecordsQuery) => setParams(p),
    clear:    () => setParams(null),
  };
}
