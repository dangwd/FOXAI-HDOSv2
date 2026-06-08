"use client";

// Renderer cho SduiPage từ GET /dm/pages/{code} (DataMatchingService, doc 48).
// Tái sử dụng widget components sẵn có; không duplicate logic render.

import type {
  SduiPage,
  SduiRow,
  SduiComponent,
  KpiCardProps,
  ProgressListProps,
  AlertListProps,
  FlowPipelineProps,
  ChartPieProps,
  ChartPieDataPoint,
} from "@/types/sdui";
import { KpiCard }      from "@/components/widgets/KpiCard";
import { ProgressList } from "@/components/widgets/ProgressList";
import { AlertList }    from "@/components/widgets/AlertList";
import { FlowPipeline } from "@/components/widgets/FlowPipeline";
import { ChartPie }     from "@/components/widgets/ChartPie";

// ─── Per-component adapters ───────────────────────────────────────────────────
// doc 48 props → existing widget props (shape ~compatible, just handle null→undefined)

function RenderKpiCard({ props }: { props: KpiCardProps }) {
  return (
    <KpiCard
      title={props.title}
      value={props.value}
      accent={props.accent ?? undefined}
      hint={props.hint ?? undefined}
      hintColor={props.hintColor ?? undefined}
      className="h-full"
    />
  );
}

function RenderProgressList({ props }: { props: ProgressListProps }) {
  return (
    <ProgressList
      title={props.title}
      headerAction={props.headerAction ?? undefined}
      maxValue={props.maxValue}
      items={props.items.map((item) => ({
        label:          item.label,
        value:          item.value,
        secondaryValue: item.secondaryValue ?? undefined,
        color:          item.color ?? undefined,
      }))}
      footerActions={
        props.footerActions
          ? props.footerActions.map((a) => ({ label: a.label, variant: a.variant as "link" | "default" | undefined }))
          : undefined
      }
    />
  );
}

function RenderAlertList({ props }: { props: AlertListProps }) {
  return (
    <div
      style={props.maxHeight ? { maxHeight: props.maxHeight, overflow: "hidden" } : undefined}
      className="h-full"
    >
      <AlertList
        title={props.title}
        realtimeBadge={props.realtimeBadge}
        totalCount={props.totalCount}
        items={props.items}
      />
    </div>
  );
}

function RenderFlowPipeline({ props }: { props: FlowPipelineProps }) {
  return (
    <FlowPipeline
      title={props.title}
      footer={props.footer ?? undefined}
      stages={props.stages.map((s) => ({
        label: s.label,
        value: s.value,
        color: s.color ?? undefined,
      }))}
    />
  );
}

function RenderChartPie({ props }: { props: ChartPieProps }) {
  // Cast to ChartDataPoint — shape compatible (label + value + index signature)
  const data = props.data as (ChartPieDataPoint & Record<string, string | number>)[];
  return (
    <ChartPie
      title={props.title}
      height={props.height ?? undefined}
      variant={props.variant ?? "pie"}
      legend={props.legend}
      data={data}
      colors={props.colors ?? undefined}
    />
  );
}

// ─── Component switcher ───────────────────────────────────────────────────────

function ComponentRenderer({ component }: { component: SduiComponent }) {
  switch (component.type) {
    case "KpiCard":      return <RenderKpiCard      props={component.props} />;
    case "ProgressList": return <RenderProgressList props={component.props} />;
    case "AlertList":    return <RenderAlertList    props={component.props} />;
    case "FlowPipeline": return <RenderFlowPipeline props={component.props} />;
    case "ChartPie":     return <RenderChartPie     props={component.props} />;
    default: {
      const _exhaustive: never = component;
      void _exhaustive;
      return null;
    }
  }
}

// ─── Row grid (24-col) ────────────────────────────────────────────────────────

function RowGrid({ row }: { row: SduiRow }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
        gap: "1rem",
      }}
    >
      {row.components.map((c, i) => (
        <div key={i} style={{ gridColumn: `span ${c.span ?? 24}` }}>
          <ComponentRenderer component={c} />
        </div>
      ))}
    </div>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────

function PageHeader({ page }: { page: SduiPage }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#e6edf3] m-0 leading-tight flex items-center gap-3">
          {page.title}
          {page.badge && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold flex items-center gap-1.5">
              {page.live && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
              {page.badge}
            </span>
          )}
        </h1>
        {page.subtitle && (
          <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0 mt-1">{page.subtitle}</p>
        )}
      </div>

      {page.actions.length > 0 && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {page.actions.map((a) => (
            <button
              key={a.label}
              style={a.color ? { backgroundColor: a.color, borderColor: a.color } : undefined}
              className={
                a.variant === "primary"
                  ? "px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                  : a.variant === "danger"
                    ? "px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    : "px-3 py-1.5 border border-gray-200 dark:border-[#30363d] text-gray-700 dark:text-[#c9d1d9] hover:bg-gray-50 dark:hover:bg-[#1f2937] text-sm font-medium rounded-lg transition-colors"
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SduiPageRenderer({ page }: { page: SduiPage }) {
  return (
    <div className="p-6 space-y-4 overflow-auto h-full">
      <PageHeader page={page} />
      {page.rows.map((row, i) => (
        <RowGrid key={i} row={row} />
      ))}
      {page.generatedAt && (
        <p className="text-[11px] text-gray-400 dark:text-[#484f58] text-right m-0 pt-2">
          Dữ liệu tại:{" "}
          {new Date(page.generatedAt).toLocaleString("vi-VN")}
        </p>
      )}
    </div>
  );
}
