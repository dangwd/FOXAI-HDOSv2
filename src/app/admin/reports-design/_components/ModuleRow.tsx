import type { AdminModule } from "@/infrastructure/http/adminApi";
import { ICON_REGISTRY } from "../../modules/_lib/icons";
import { LayoutDashboard } from "lucide-react";

export function ModuleRow({
  module,
  active,
  onClick,
}: {
  module: AdminModule;
  active: boolean;
  onClick: () => void;
}) {
  const LucideComp = module.icon ? ICON_REGISTRY[module.icon] : null;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
        ${active
          ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-medium text-xs"
          : "text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#1f2937] hover:text-gray-900 dark:hover:text-[#e6edf3] text-xs"
        }`}
    >
      <span className="shrink-0 w-5 h-5 flex items-center justify-center opacity-60">
        {LucideComp
          ? <LucideComp size={14} />
          : <LayoutDashboard size={13} />
        }
      </span>
      <span className="flex-1 truncate">{module.label}</span>
      {!module.isActive && (
        <span className="shrink-0 text-[9px] text-gray-300 dark:text-[#30363d]">draft</span>
      )}
    </button>
  );
}
