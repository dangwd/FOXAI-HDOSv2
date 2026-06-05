import type { DesignerWidget } from "../_lib/types";

const LINE_PTS  = [28, 60, 42, 78, 35, 90, 52, 65, 70, 48, 88, 72];
const BAR_VALS  = [60, 90, 45, 75, 50, 80];
const PIE_SLICES: [number, string][] = [[35, "#059669"], [25, "#10b981"], [20, "#3b82f6"], [20, "#f59e0b"]];

function pieSlice(cx: number, cy: number, r: number, start: number, pct: number) {
  const a0 = (start - 90) * (Math.PI / 180);
  const a1 = (start + pct * 3.6 - 90) * (Math.PI / 180);
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const large = pct > 50 ? 1 : 0;
  return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large},1 ${x1},${y1} Z`;
}

const PIE_PATHS = (() => {
  let angle = 0;
  return PIE_SLICES.map(([pct, col]) => {
    const d = pieSlice(50, 50, 38, angle, pct);
    angle += pct * 3.6;
    return { d, col };
  });
})();

export function WidgetPreview({ widget }: { widget: DesignerWidget }) {
  const c = widget.color || "#059669";

  if (widget.type === "kpi") {
    return (
      <div className="flex flex-col h-full px-3 py-2 justify-between">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-[#484f58] truncate">
            {widget.title || "KPI"}
          </span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: c + "20", color: c }}
          >
            ▲ +12.4%
          </span>
        </div>
        {/* Value */}
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: c }}>
            1,284
          </span>
          <span className="text-[10px] text-gray-400 dark:text-[#484f58] mb-0.5">units</span>
        </div>
        {/* Mini sparkline */}
        <svg width="100%" height="18" viewBox="0 0 100 18" preserveAspectRatio="none" className="opacity-50">
          <polyline
            points="0,14 16,8 32,11 48,4 64,9 80,2 100,6"
            fill="none"
            stroke={c}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (widget.type === "line") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="opacity-80">
        <polygon
          points={`${LINE_PTS[0]},100 ${LINE_PTS.join(",")} ${LINE_PTS[LINE_PTS.length - 2]},100`}
          fill={c}
          opacity="0.12"
        />
        <polyline
          points={LINE_PTS.join(",")}
          fill="none"
          stroke={c}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (widget.type === "bar") {
    const w = 100 / (BAR_VALS.length * 2 - 1);
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="opacity-80">
        {BAR_VALS.map((v, i) => (
          <rect
            key={i}
            x={i * 2 * w}
            y={100 - v}
            width={w}
            height={v}
            fill={c}
            rx="1.5"
            opacity={0.5 + 0.08 * i}
          />
        ))}
      </svg>
    );
  }

  if (widget.type === "pie") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        {PIE_PATHS.map(({ d, col }, i) => (
          <path key={i} d={d} fill={col} opacity="0.85" />
        ))}
        <circle cx="50" cy="50" r="22" fill="white" className="dark:fill-[#161b22]" />
      </svg>
    );
  }

  if (widget.type === "table") {
    return (
      <div className="p-2 h-full overflow-hidden flex flex-col gap-1">
        <div className="h-[16px] rounded-md bg-gray-100 dark:bg-[#1f2937]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-1.5">
            <div className="h-[11px] flex-1 rounded bg-gray-50 dark:bg-[#0a0f1a]" />
            <div className="h-[11px] w-10 rounded bg-gray-50 dark:bg-[#0a0f1a]" />
            <div className="h-[11px] w-12 rounded bg-gray-50 dark:bg-[#0a0f1a]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-3 h-full overflow-hidden flex flex-col justify-center gap-1.5">
      {[100, 80, 92, 68, 85].map((w, i) => (
        <div
          key={i}
          className="h-[7px] rounded-full bg-gray-100 dark:bg-[#1f2937]"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}
