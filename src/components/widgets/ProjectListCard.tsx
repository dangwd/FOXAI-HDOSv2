"use client";

interface ProjectItem {
  name: string;
  color: string;
  taskCount?: number;
  dueDate?: string;
}

interface ProjectListCardProps {
  title?: string;
  projects?: ProjectItem[];
  onAddNew?: () => void;
  loading?: boolean;
}

const DEFAULT_PROJECTS: ProjectItem[] = [
  { name: "Phát triển API Endpoints", color: "#F59E0B", taskCount: 8 },
  { name: "Tổ chức quy trình", color: "#3B82F6", taskCount: 5 },
  { name: "Xây dựng Dashboard", color: "#10B981", taskCount: 12 },
  { name: "Tối ưu hiệu năng", color: "#8B5CF6", taskCount: 3 },
  { name: "Kiểm tra đa trình duyệt", color: "#EF4444", taskCount: 6 },
];

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function ProjectListCard({
  title = "Dự án",
  projects = DEFAULT_PROJECTS,
  loading = false,
}: ProjectListCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl p-4 border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={`${SK} h-3 w-20`} />
          <div className={`${SK} h-6 w-14 rounded-lg`} />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 mb-3">
            <div className={`${SK} w-2 h-2 rounded-full`} />
            <div className={`${SK} h-3 flex-1`} />
            <div className={`${SK} h-3 w-6`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0">
          {title}
        </p>
        <button className="flex items-center gap-1 text-[11px] font-medium text-[#2D7D32] hover:text-[#388E3C] border border-[#2D7D32]/30 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-0.5 rounded-lg transition-colors">
          <span className="text-base leading-none">+</span> Mới
        </button>
      </div>

      <ul className="flex-1 space-y-2.5">
        {projects.map((project, i) => (
          <li
            key={i}
            className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors cursor-pointer group"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <span className="flex-1 text-[12px] text-gray-700 dark:text-[#c9d1d9] group-hover:text-gray-900 dark:group-hover:text-white truncate leading-snug">
              {project.name}
            </span>
            {project.taskCount != null && (
              <span className="text-[11px] font-medium text-gray-400 dark:text-[#8b949e] shrink-0">
                {project.taskCount}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
