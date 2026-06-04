"use client";

export function Toggle({
  on,
  onChange,
  size = "md",
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  size?: "sm" | "md";
}) {
  const track = size === "sm" ? "h-4 w-7"   : "h-5 w-9";
  const thumb = size === "sm" ? "h-3 w-3"   : "h-3.5 w-3.5";
  const on_x  = size === "sm" ? "translate-x-3.5" : "translate-x-4.5";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1
        ${track} ${on ? "bg-emerald-600" : "bg-gray-300 dark:bg-[#30363d]"}`}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow-sm transition-transform duration-200
          ${thumb} ${on ? on_x : "translate-x-0.5"}`}
      />
    </button>
  );
}
