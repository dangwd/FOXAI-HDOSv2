"use client";

interface ProgressItem {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  secondaryColor?: string;
  suffix?: string;
}

interface ProgressListProps {
  title?: string;
  items: ProgressItem[];
  maxValue?: number;
}

export function ProgressList({ title, items, maxValue = 100 }: ProgressListProps) {
  return (
    <div className="rounded-lg p-4 border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] h-full">
      {title && (
        <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-3">
          {title}
        </p>
      )}
      <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 480 }}>
        {items.map((item, i) => {
          const primary = Math.min((item.value / maxValue) * 100, 100);
          const secondary = item.secondaryValue != null
            ? Math.min((item.secondaryValue / maxValue) * 100, 100)
            : null;
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-40 shrink-0 text-gray-600 dark:text-[#8b949e] truncate text-[11px]">
                {item.label}
              </span>
              <div className="flex-1 flex flex-col gap-0.5">
                <div className="h-2 rounded-sm bg-gray-100 dark:bg-[#30363d] overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all"
                    style={{ width: `${primary}%`, background: item.color ?? '#52c41a' }}
                  />
                </div>
                {secondary != null && (
                  <div className="h-1.5 rounded-sm bg-gray-100 dark:bg-[#30363d] overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all"
                      style={{ width: `${secondary}%`, background: item.secondaryColor ?? '#faad14' }}
                    />
                  </div>
                )}
              </div>
              <div className="w-20 shrink-0 text-right text-gray-500 dark:text-[#8b949e] text-[10px] tabular-nums">
                {item.value}{item.suffix ?? '%'}
                {item.secondaryValue != null && (
                  <span className="ml-1">{item.secondaryValue}{item.suffix ?? '%'}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
