"use client";

interface StatItem {
  label: string;
  value: number | string;
  color?: string;
}

interface StatsSummaryProps {
  title?: string;
  subtitle?: string;
  items: StatItem[];
  loading?: boolean;
}

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function StatsSummary({ title, subtitle, items, loading = false }: StatsSummaryProps) {
  const count = loading ? 4 : items.length;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full flex flex-col">
      {title && (
        <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0 px-4 pt-3 pb-1 shrink-0">
          {title}
        </p>
      )}
      <div className="flex-1 flex items-center gap-0 divide-x divide-gray-200 dark:divide-[#30363d] px-4 py-2">
        {loading
          ? Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center px-3 gap-1.5">
                <div className={`${SK} h-7 w-12`} />
                <div className={`${SK} h-2 w-14`} />
              </div>
            ))
          : items.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center px-3">
                <span className="text-2xl font-bold tabular-nums leading-tight"
                  style={{ color: item.color ?? "#374151" }}>
                  {item.value}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-[#8b949e] text-center mt-0.5 leading-tight">
                  {item.label}
                </span>
              </div>
            ))}
      </div>
      {subtitle && (
        <p className="text-[10px] text-gray-400 dark:text-[#6e7681] px-4 pb-2.5 m-0 shrink-0 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
