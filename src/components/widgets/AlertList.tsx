"use client";

interface AlertItem {
  code: string;
  text: string;
  patient?: string;
  dept?: string;
  time: string;
  severity?: "critical" | "warning" | "info";
}

interface AlertListProps {
  title?: string;
  totalCount?: number;
  items: AlertItem[];
  loading?: boolean;
}

function severityBadgeClass(severity?: AlertItem["severity"]): string {
  switch (severity) {
    case "critical": return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
    case "warning":  return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400";
    default:         return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
  }
}

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function AlertList({ title = "Cảnh báo", totalCount, items, loading = false }: AlertListProps) {
  return (
    <div className="h-full flex flex-col rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#30363d] flex-shrink-0">
        <span className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3]">{title}</span>
        {loading ? (
          <div className={`${SK} h-4 w-16 rounded-full`} />
        ) : totalCount !== undefined ? (
          <span className="text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded-full">
            {totalCount} cảnh báo
          </span>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-[#30363d]">
        {loading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-start gap-3 px-4 py-3">
                <div className={`${SK} h-5 w-8 rounded-md mt-0.5 shrink-0`} />
                <div className="flex-1 space-y-1.5">
                  <div className={`${SK} h-2.5 w-full`} />
                  <div className={`${SK} h-2 w-2/3`} />
                </div>
                <div className={`${SK} h-2 w-10 shrink-0 mt-0.5`} />
              </div>
            ))
          : items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#161b22] transition-colors">
                <span className={`mt-0.5 flex-shrink-0 inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none min-w-[2rem] ${severityBadgeClass(item.severity)}`}>
                  {item.code}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-[#e6edf3] leading-tight m-0 truncate">{item.text}</p>
                  {item.patient && <p className="text-[10px] text-gray-500 dark:text-[#8b949e] leading-tight m-0 truncate">{item.patient}</p>}
                  {item.dept && <p className="text-[10px] text-gray-400 dark:text-[#6e7681] leading-tight m-0 truncate">{item.dept}</p>}
                </div>
                <span className="flex-shrink-0 text-[10px] text-gray-400 dark:text-[#6e7681] whitespace-nowrap mt-0.5">{item.time}</span>
              </div>
            ))}
      </div>
    </div>
  );
}
