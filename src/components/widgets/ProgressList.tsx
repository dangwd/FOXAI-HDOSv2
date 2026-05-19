"use client";

interface ProgressItem {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  secondaryColor?: string;
  suffix?: string;
}

interface FooterAction {
  label: string;
  variant?: "link" | "default";
  color?: string;
}

interface ProgressListProps {
  title?: string;
  headerAction?: string;
  items: ProgressItem[];
  maxValue?: number;
  footerActions?: FooterAction[];
}

export function ProgressList({ title, headerAction, items, maxValue = 100, footerActions }: ProgressListProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] h-full flex flex-col">
      {title && (
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0">
            {title}
          </p>
          {headerAction && (
            <button className="text-[10px] text-blue-500 hover:text-blue-400 transition-colors cursor-pointer">
              {headerAction}
            </button>
          )}
        </div>
      )}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-3" style={{ maxHeight: 480 }}>
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
      {footerActions && footerActions.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-100 dark:border-[#30363d]">
          {footerActions.map((action, i) => {
            if (action.variant === 'link') {
              return (
                <button key={i} className="text-xs text-blue-500 hover:text-blue-400 transition-colors cursor-pointer">
                  {action.label}
                </button>
              );
            }
            return (
              <button
                key={i}
                className="ml-auto text-xs px-3 py-1 rounded-md border border-gray-200 dark:border-[#30363d] text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors cursor-pointer"
                style={action.color ? { color: action.color, borderColor: action.color + '55' } : undefined}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
