"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { Splitter } from "antd";

import { useAdminData } from "./_hooks/useAdminData";
import { useDesignerState } from "./_hooks/useDesignerState";

import { CanvasArea } from "./_components/CanvasArea";
import { ModuleListSidebar } from "./_components/ModuleListSidebar";
import { PageSkeleton } from "./_components/PageSkeleton";
import { RightSidebar } from "./_components/RightSidebar";

// ─── Inner (needs useSearchParams inside Suspense) ────────────────────────────

function DashboardDesignerInner() {
  const { modules, catalog, loading } = useAdminData();
  const searchParams = useSearchParams();

  const slugParam   = searchParams.get("slug") ?? "";
  const screenParam = searchParams.get("screen") ?? "";
  const [_selectedSlug, setSelectedSlug] = useState<string>(
    screenParam ? `${slugParam}/${screenParam}` : slugParam,
  );

  const selectedSlug = useMemo(
    () => _selectedSlug || modules[0]?.slug || "",
    [_selectedSlug, modules],
  );

  const selectedModule = useMemo(
    () => modules.find((m) => m.slug === selectedSlug),
    [modules, selectedSlug],
  );

  const designer = useDesignerState(selectedSlug);

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex h-full overflow-hidden">
      <ModuleListSidebar
        modules={modules}
        selectedSlug={selectedSlug}
        onSelect={setSelectedSlug}
      />
      <Splitter style={{ flex: 1, minWidth: 0, height: "100%", overflow: "hidden" }}>
        <Splitter.Panel min={320} style={{ overflow: "hidden" }}>
          <CanvasArea
            selectedSlug={selectedSlug}
            selectedModule={selectedModule}
            designer={designer}
            catalog={catalog}
          />
        </Splitter.Panel>
        <Splitter.Panel defaultSize={288} min={220} max={560} style={{ overflow: "hidden" }}>
          <RightSidebar
            designer={designer}
            catalog={catalog}
            selectedSlug={selectedSlug}
          />
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardDesignerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardDesignerInner />
    </Suspense>
  );
}
