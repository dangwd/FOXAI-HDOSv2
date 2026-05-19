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
}

function severityBadgeClass(severity?: AlertItem["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
    case "warning":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400";
    case "info":
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
  }
}

export function AlertList({ title = "Cảnh báo", totalCount, items }: AlertListProps) {
  return (
    <div className="h-full flex flex-col rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#30363d] flex-shrink-0">
        <span className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3]">{title}</span>
        {totalCount !== undefined && (
          <span className="text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded-full">
            {totalCount} cảnh báo
          </span>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-[#30363d]">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#161b22] transition-colors">
            {/* Code badge */}
            <span
              className={`mt-0.5 flex-shrink-0 inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none min-w-[2rem] ${severityBadgeClass(item.severity)}`}
            >
              {item.code}
            </span>

            {/* Middle content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-[#e6edf3] leading-tight m-0 truncate">
                {item.text}
              </p>
              {item.patient && (
                <p className="text-[10px] text-gray-500 dark:text-[#8b949e] leading-tight m-0 truncate">
                  {item.patient}
                </p>
              )}
              {item.dept && (
                <p className="text-[10px] text-gray-400 dark:text-[#6e7681] leading-tight m-0 truncate">
                  {item.dept}
                </p>
              )}
            </div>

            {/* Time */}
            <span className="flex-shrink-0 text-[10px] text-gray-400 dark:text-[#6e7681] whitespace-nowrap mt-0.5">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
