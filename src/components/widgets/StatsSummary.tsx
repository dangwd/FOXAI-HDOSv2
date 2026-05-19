"use client";

interface StatItem {
  label: string;
  value: number | string;
  color?: string;
}

interface StatsSummaryProps {
  items: StatItem[];
  loading?: boolean;
}

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function StatsSummary({ items, loading = false }: StatsSummaryProps) {
  const count = loading ? 4 : items.length;
  return (
    <div className="rounded-lg px-6 py-3 border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] flex items-center gap-0 divide-x divide-gray-200 dark:divide-[#30363d]">
      {loading
        ? Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center px-4 first:pl-0 last:pr-0 gap-1.5">
              <div className={`${SK} h-7 w-12`} />
              <div className={`${SK} h-2 w-16`} />
            </div>
          ))
        : items.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center px-4 first:pl-0 last:pr-0">
              <span className="text-2xl font-bold tabular-nums" style={{ color: item.color ?? '#e6edf3' }}>
                {item.value}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-[#8b949e] text-center mt-0.5 leading-tight">
                {item.label}
              </span>
            </div>
          ))}
    </div>
  );
}
