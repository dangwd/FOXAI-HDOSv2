"use client";

type BulletStatus = "active" | "pending" | "done" | "critical";

interface BulletItem {
  text: string;
  status?: BulletStatus;
  badge?: string | number;
}

interface BulletListProps {
  title?: string;
  items: BulletItem[];
}

const STATUS_COLOR: Record<BulletStatus, string> = {
  active: "#52c41a",
  pending: "#faad14",
  done: "#1677ff",
  critical: "#ff4d4f",
};

export function BulletList({ title, items }: BulletListProps) {
  return (
    <div className="rounded-lg p-4 border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] h-full">
      {title && (
        <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-3">
          {title}
        </p>
      )}
      <ul className="space-y-2 m-0 p-0 list-none overflow-y-auto" style={{ maxHeight: 480 }}>
        {items.map((item, i) => {
          const dotColor = STATUS_COLOR[item.status ?? "pending"];
          return (
            <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700 dark:text-[#c9d1d9]">
              <span
                className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                style={{ background: dotColor }}
              />
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
    </div>
  );
}
