"use client";

type BulletStatus = "active" | "pending" | "done" | "critical";

interface BulletItem {
  text: string;
  status?: BulletStatus;
  badge?: string | number;
}

interface FooterAction {
  label: string;
  variant?: "link" | "default";
  color?: string;
}

interface BulletListProps {
  title?: string;
  headerAction?: string;
  items: BulletItem[];
  footerActions?: FooterAction[];
  loading?: boolean;
}

const STATUS_COLOR: Record<BulletStatus, string> = {
  active: "#52c41a",
  pending: "#faad14",
  done: "#059669",
  critical: "#ff4d4f",
};

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function BulletList({ title, headerAction, items, footerActions, loading = false }: BulletListProps) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full flex flex-col">
      {title && (
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0">
            {title}
          </p>
          {headerAction && (
            <button className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer">
              {headerAction}
            </button>
          )}
        </div>
      )}
      <ul className="flex-1 space-y-2 m-0 px-4 pb-3 list-none overflow-y-auto" style={{ maxHeight: 360 }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className={`${SK} w-2 h-2 rounded-full shrink-0`} />
                <div className={`${SK} h-2.5 flex-1`} />
                <div className={`${SK} h-4 w-8 rounded shrink-0`} />
              </li>
            ))
          : items.map((item, i) => {
              const dotColor = STATUS_COLOR[item.status ?? "pending"];
              return (
                <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700 dark:text-[#c9d1d9]">
                  <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
                  <span className="flex-1 leading-snug">{item.text}</span>
                  {item.badge != null && (
                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: dotColor + '22', color: dotColor }}>
                      {item.badge}
                    </span>
                  )}
                </li>
              );
            })}
      </ul>
      {footerActions && footerActions.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-100 dark:border-[#30363d]">
          {footerActions.map((action, i) => {
            if (action.variant === 'link') {
              return (
                <button key={i} className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer">
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
