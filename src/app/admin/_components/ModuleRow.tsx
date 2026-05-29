import type { AdminModule } from "@/infrastructure/http/adminApi";
import { ICON_REGISTRY } from "../modules/_lib/icons";

export function ModuleRow({
  module,
  active,
  onClick,
}: {
  module: AdminModule;
  active: boolean;
  onClick: () => void;
}) {
  const LucideComp = ICON_REGISTRY[module.icon];
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
        ${active
          ? "bg-blue-50 dark:bg-[#1f6feb22] border border-blue-300 dark:border-[#1f6feb66] text-blue-700 dark:text-[#e6edf3] font-medium text-xs"
          : "text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-[#e6edf3] text-xs"
        }`}
    >
      <span className="shrink-0 w-5 h-5 flex items-center justify-center">
        {LucideComp
          ? <LucideComp size={14} />
          : <span className="text-[11px] font-bold leading-none">{module.icon?.slice(0, 2) || "?"}</span>
        }
      </span>
      <span className="flex-1 truncate">{module.label}</span>
    </button>
  );
}
