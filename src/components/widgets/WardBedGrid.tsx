"use client";

const BED_COLOR: Record<BedStatus, string> = {
  occupied: "bg-[#1677ff]",
  checkout: "bg-[#faad14]",
  cleaning: "bg-[#722ed1]",
  empty:    "bg-gray-200 dark:bg-[#30363d]",
};

type BedStatus = "occupied" | "checkout" | "cleaning" | "empty";

export interface WardRow {
  code: string;
  total: number;
  occupied: number;
  checkout?: number;
  cleaning?: number;
  bor: number;
}

interface WardBedGridProps {
  title?: string;
  wards: WardRow[];
  loading?: boolean;
}

function borColor(bor: number): string {
  if (bor >= 80) return "#ff4d4f";
  if (bor >= 60) return "#fa8c16";
  return "#52c41a";
}

const MAX_DISPLAY = 50;

export function WardBedGrid({ title, wards, loading }: WardBedGridProps) {
  if (loading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-[#30363d] rounded-lg h-64" />;
  }

  return (
    <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        {title && (
          <h3 className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] m-0">{title}</h3>
        )}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 ml-auto">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-gray-200 dark:bg-[#30363d] inline-block" />
            Trống
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#faad14] inline-block" />
            Cuối lý
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1677ff] inline-block" />
            Đang dùng
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#722ed1] inline-block" />
            Cuối sáng
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {wards.map((ward) => {
          const checkout = ward.checkout ?? 0;
          const cleaning = ward.cleaning ?? 0;
          const empty = Math.max(0, ward.total - ward.occupied - checkout - cleaning);

          const beds: BedStatus[] = [
            ...Array<BedStatus>(ward.occupied).fill("occupied"),
            ...Array<BedStatus>(checkout).fill("checkout"),
            ...Array<BedStatus>(cleaning).fill("cleaning"),
            ...Array<BedStatus>(empty).fill("empty"),
          ];

          const display = beds.slice(0, MAX_DISPLAY);
          const overflow = ward.total - display.length;

          return (
            <div key={ward.code} className="flex items-center gap-3 py-0.5">
              <span className="font-mono text-[11px] font-bold text-gray-500 dark:text-[#8b949e] w-12 shrink-0">
                {ward.code}
              </span>
              <div className="flex flex-wrap items-center gap-0.5 flex-1 min-w-0">
                {display.map((s, i) => (
                  <span key={i} className={`w-3 h-3 rounded-sm shrink-0 ${BED_COLOR[s]}`} />
                ))}
                {overflow > 0 && (
                  <span className="text-[10px] text-gray-400 dark:text-[#8b949e] ml-1">
                    +{overflow}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-400 dark:text-[#8b949e] whitespace-nowrap shrink-0">
                {ward.occupied}/{ward.total} giường
              </span>
              <span
                className="text-[11px] font-bold w-8 text-right shrink-0"
                style={{ color: borColor(ward.bor) }}
              >
                {ward.bor}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
