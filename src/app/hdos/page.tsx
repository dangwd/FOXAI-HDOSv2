"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ModuleRenderer }  from "@/components/ModuleRenderer";
import { getAdminToken } from "@/infrastructure/http/httpForProvider";
import type { ModuleLayout } from "@/infrastructure/http/adminApi";

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

type PageState =
  | { kind: "loading" }
  | { kind: "module"; layout: ModuleLayout }
  | { kind: "error"; message: string };

function HdosContent({ moduleId }: { moduleId: string }) {
  const [state, setState] = useState<PageState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = await getAdminToken();
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const modRes = await fetch(`/api/v1/modules/${moduleId}/layout`, { headers: authHeaders });
      if (!cancelled && modRes.ok) {
        const layout = (await modRes.json()) as ModuleLayout;
        if (!cancelled) setState({ kind: "module", layout });
        return;
      }

      if (!cancelled) setState({ kind: "error", message: `Màn hình chưa được cấu hình: ${moduleId}` });
    }

    load().catch(() => {
      if (!cancelled) setState({ kind: "error", message: "Không thể tải dữ liệu màn hình." });
    });

    return () => { cancelled = true; };
  }, [moduleId]);

  if (state.kind === "loading") return <PageSkeleton />;

  if (state.kind === "error") {
    return (
      <div className="p-8 text-gray-400 dark:text-[#484f58] text-sm">
        <code className="text-red-400">{state.message}</code>
      </div>
    );
  }

  return <ModuleRenderer layout={state.layout} />;
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
