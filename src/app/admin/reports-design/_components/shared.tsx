import type { ReactNode } from "react";

// ─── Icons ───────────────────────────────────────────────────────────────────

export function IconX({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function IconPencil({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function IconGrip() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className="text-gray-300 dark:text-[#484f58]">
      <circle cx="3" cy="2"  r="1.2" /><circle cx="7" cy="2"  r="1.2" />
      <circle cx="3" cy="6"  r="1.2" /><circle cx="7" cy="6"  r="1.2" />
      <circle cx="3" cy="10" r="1.2" /><circle cx="7" cy="10" r="1.2" />
    </svg>
  );
}

export function IconCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-gray-500 dark:text-[#484f58] uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
