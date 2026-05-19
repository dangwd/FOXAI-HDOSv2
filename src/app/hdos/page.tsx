"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Spin } from "antd";
import { ScreenRenderer } from "@/components/ScreenRenderer";
import type { ScreenConfig } from "@/types/screen";

function HdosContent() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module") ?? "dashboard";

  const [screen, setScreen] = useState<ScreenConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/screen/${moduleId}`)
      .then((res) => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then((data) => { if (data) setScreen(data); })
      .finally(() => setLoading(false));
  }, [moduleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (notFound || !screen) {
    return (
      <div className="p-8 text-gray-400 text-sm">
        Màn hình chưa được cấu hình: <code className="text-red-400">{moduleId}</code>
      </div>
    );
  }

  return <ScreenRenderer config={screen} />;
}

export default function HdosPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Spin size="large" /></div>}>
      <HdosContent />
    </Suspense>
  );
}
