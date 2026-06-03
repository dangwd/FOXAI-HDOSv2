import { CheckCircle, FileText, Layers, Table2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { OcrSchemaStats } from "@/infrastructure/http/ocrApi";

const CARDS = [
  {
    key:    "totalSchemas" as const,
    label:  "Tổng schema",
    icon:   <Layers size={15} />,
    color:  "text-blue-600 dark:text-blue-400",
    bg:     "bg-blue-50 dark:bg-blue-900/20",
    accent: "bg-blue-500",
  },
  {
    key:    "activeSchemas" as const,
    label:  "Đang hoạt động",
    icon:   <CheckCircle size={15} />,
    color:  "text-emerald-600 dark:text-emerald-400",
    bg:     "bg-emerald-50 dark:bg-emerald-900/20",
    accent: "bg-emerald-500",
  },
  {
    key:    "totalFields" as const,
    label:  "Tổng trường dữ liệu",
    icon:   <FileText size={15} />,
    color:  "text-violet-600 dark:text-violet-400",
    bg:     "bg-violet-50 dark:bg-violet-900/20",
    accent: "bg-violet-500",
  },
  {
    key:    "totalTables" as const,
    label:  "Tổng bảng dữ liệu",
    icon:   <Table2 size={15} />,
    color:  "text-orange-600 dark:text-orange-400",
    bg:     "bg-orange-50 dark:bg-orange-900/20",
    accent: "bg-orange-500",
  },
] as const;

export function StatsCards({ stats, loading }: { stats: OcrSchemaStats | null; loading: boolean }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {CARDS.map((c) => (
        <div
          key={c.key}
          className="relative bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-xl px-5 py-4 overflow-hidden"
        >
          <div className={cn("absolute inset-x-0 top-0 h-[2px] rounded-t-xl", c.accent)} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-[#8b949e] m-0 uppercase tracking-wider mb-2">
                {c.label}
              </p>
              {loading ? (
                <div className="h-8 w-14 animate-pulse bg-gray-200 dark:bg-[#30363d] rounded" />
              ) : (
                <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-[#e6edf3] m-0 leading-none">
                  {stats?.[c.key] ?? 0}
                </p>
              )}
            </div>
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-3 mt-0.5", c.bg, c.color)}>
              {c.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
