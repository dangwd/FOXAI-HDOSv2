"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScreenRenderer } from "@/components/ScreenRenderer";
import type { ScreenConfig } from "@/types/screen";

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

function PageSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className={`${SK} h-7 w-48`} />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${SK} h-24`} />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => <div key={i} className={`${SK} h-52`} />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className={`${SK} h-40`} />)}
      </div>
    </div>
  );
}

function HdosContent({ moduleId }: { moduleId: string }) {
  const [screen, setScreen] = useState<ScreenConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/screen/${moduleId}`)
      .then((res) => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then((data) => { if (data) setScreen(data); })
      .finally(() => setLoading(false));
  }, [moduleId]);

  if (loading) return <PageSkeleton />;

  if (notFound || !screen) {
    return (
      <div className="p-8 text-gray-400 text-sm">
        Màn hình chưa được cấu hình: <code className="text-red-400">{moduleId}</code>
      </div>
    );
  }

  return <ScreenRenderer config={screen} />;
}

function HdosPageContent() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module") ?? "dashboard";

  return <HdosContent key={moduleId} moduleId={moduleId} />;
}

export default function HdosPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HdosPageContent />
    </Suspense>
  );
}
