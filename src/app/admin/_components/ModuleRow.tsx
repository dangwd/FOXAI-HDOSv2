import type { AdminModule } from "@/infrastructure/http/adminApi";

export function ModuleRow({
  module,
  active,
  onClick,
}: {
  module: AdminModule;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
        ${active
          ? "bg-blue-50 dark:bg-[#1f6feb22] border border-blue-300 dark:border-[#1f6feb66] text-blue-700 dark:text-[#e6edf3] font-medium text-xs"
          : "text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-[#e6edf3] text-xs"
        }`}
    >
      <span className="shrink-0 text-base leading-none w-5 text-center">{module.icon}</span>
      <span className="flex-1 truncate">{module.label}</span>
    </button>
  );
}
