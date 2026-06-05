"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi } from "@/infrastructure/http/adminApi";
import { FormScreenRenderer } from "@/components/FormScreenRenderer";
import { ModuleRenderer } from "@/components/ModuleRenderer";
import useAuthStore from "@/core/auth/authStore";
import DashboardHome from "@/app/client/DashboardHome";
import type {
  FormScreen,
  ModuleLayout,
  ScreenLayout,
} from "@/infrastructure/http/adminApi";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

function PageSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className={`${SK} h-7 w-48`} />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${SK} h-24`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={`${SK} h-52`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`${SK} h-40`} />
        ))}
      </div>
    </div>
  );
}

// ─── Module kind detection ────────────────────────────────────────────────────

type ModuleKind =
  | { kind: "loading" }
  | { kind: "old"; layout: ModuleLayout }
  | { kind: "forms"; screens: FormScreen[] }
  | { kind: "error"; message: string };

// ─── Main content ─────────────────────────────────────────────────────────────

function HdosContent({
  moduleId,
  screenCode,
  onScreenChange,
}: {
  moduleId: string;
  screenCode: string | null;
  onScreenChange: (code: string) => void;
}) {
  const [moduleState, setModuleState] = useState<ModuleKind>({ kind: "loading" });
  const [screenLayout, setScreenLayout] = useState<ScreenLayout | null>(null);
  const [screenLoading, setScreenLoading] = useState(false);

  // Probe: DynamicFormService first, then fall back to old admin layout
  useEffect(() => {
    let cancelled = false;

    async function probe() {
      setModuleState({ kind: "loading" });
      setScreenLayout(null);

      // 1. Try DynamicFormService
      try {
        const all = await adminApi.listFormScreens(moduleId);
        const published = all
          .filter((s) => s.status === "Published")
          .sort((a, b) => a.sortOrder - b.sortOrder);

        if (!cancelled && published.length > 0) {
          setModuleState({ kind: "forms", screens: published });
          return;
        }
      } catch {
        // not a forms module — fall through
      }

      if (cancelled) return;

      // 2. Fallback: old admin module layout
      try {
        const token = useAuthStore.getState().accessToken;
        const authHeaders: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};
        const res = await fetch(`/api/v1/modules/${moduleId}/layout`, {
          headers: authHeaders,
        });
        if (!cancelled && res.ok) {
          const layout = (await res.json()) as ModuleLayout;
          if (!cancelled) setModuleState({ kind: "old", layout });
          return;
        }
      } catch {}

      if (!cancelled) {
        setModuleState({
          kind: "error",
          message: `Màn hình chưa được cấu hình: ${moduleId}`,
        });
      }
    }

    probe().catch(() => {
      if (!cancelled)
        setModuleState({
          kind: "error",
          message: "Không thể tải dữ liệu màn hình.",
        });
    });

    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  // Resolve active screen code for forms modules
  const formsScreens =
    moduleState.kind === "forms" ? moduleState.screens : null;
  const activeScreenCode = formsScreens
    ? (screenCode ?? formsScreens[0]?.code ?? null)
    : null;

  // Load screen layout when active screen changes
  useEffect(() => {
    if (!activeScreenCode) return;

    let cancelled = false;

    async function load() {
      setScreenLoading(true);
      setScreenLayout(null);
      try {
        const layout = await adminApi.getScreenLayout(moduleId, activeScreenCode!);
        if (!cancelled) setScreenLayout(layout);
      } catch {
        if (!cancelled) setScreenLayout(null);
      } finally {
        if (!cancelled) setScreenLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [moduleId, activeScreenCode]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (moduleState.kind === "loading") return <PageSkeleton />;

  if (moduleState.kind === "error") {
    return (
      <div className="p-8 text-gray-400 dark:text-[#484f58] text-sm">
        <code className="text-red-400">{moduleState.message}</code>
      </div>
    );
  }

  if (moduleState.kind === "old") {
    return <ModuleRenderer layout={moduleState.layout} />;
  }

  // ── Forms module ──────────────────────────────────────────────────────────

  const { screens } = moduleState;
  const activeScreen =
    screens.find((s) => s.code === activeScreenCode) ?? screens[0] ?? null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Screen navigation tabs */}
      {screens.length > 1 && (
        <div className="bg-white dark:bg-[#0a0f1a] border-b border-gray-100 dark:border-[#1f2937] flex items-end px-4 shrink-0 overflow-x-auto">
          {screens.map((s) => {
            const active = s.code === activeScreenCode;
            return (
              <button
                key={s.code}
                onClick={() => onScreenChange(s.code)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-gray-500 dark:text-[#8b949e] hover:text-gray-800 dark:hover:text-[#e6edf3] hover:border-gray-200 dark:hover:border-[#374151]"
                }`}
              >
                {s.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Screen header */}
      {activeScreen && (
        <div className="px-5 py-3 border-b border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] shrink-0">
          <h1 className="text-base font-bold text-gray-900 dark:text-[#e6edf3] m-0 leading-tight">
            {activeScreen.title}
          </h1>
          {activeScreen.description && (
            <p className="text-[11px] text-gray-500 dark:text-[#8b949e] m-0 mt-0.5">
              {activeScreen.description}
            </p>
          )}
        </div>
      )}

      {/* Screen content */}
      <div className="flex-1 overflow-hidden">
        {screenLoading ? (
          <PageSkeleton />
        ) : screenLayout ? (
          <FormScreenRenderer layout={screenLayout} />
        ) : (
          <div className="flex items-center justify-center h-64 text-sm text-gray-400 dark:text-[#484f58]">
            {screens.length === 0
              ? "Module này chưa có màn hình nào được xuất bản."
              : "Không tải được layout màn hình."}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

function HdosPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const moduleId = searchParams.get("module") ?? "dashboard";
  const screenCode = searchParams.get("screen");

  const handleScreenChange = useCallback(
    (code: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("screen", code);
      router.push(`/client?${params.toString()}`);
    },
    [router, searchParams],
  );

  if (moduleId === "dashboard") {
    return <DashboardHome />;
  }

  return (
    <HdosContent
      key={moduleId}
      moduleId={moduleId}
      screenCode={screenCode}
      onScreenChange={handleScreenChange}
    />
  );
}

export default function HdosPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HdosPageContent />
    </Suspense>
  );
}
