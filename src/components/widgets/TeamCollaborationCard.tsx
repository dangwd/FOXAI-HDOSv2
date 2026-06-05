"use client";

type MemberStatus = "Completed" | "In Progress" | "Pending";

interface TeamMember {
  name: string;
  initials: string;
  avatarColor: string;
  task: string;
  status: MemberStatus;
}

interface TeamCollaborationCardProps {
  title?: string;
  members?: TeamMember[];
  loading?: boolean;
}

const STATUS_STYLES: Record<MemberStatus, string> = {
  Completed:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Pending:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const STATUS_LABELS: Record<MemberStatus, string> = {
  Completed:   "Hoàn thành",
  "In Progress": "Đang làm",
  Pending:     "Chờ xử lý",
};

const DEFAULT_MEMBERS: TeamMember[] = [
  { name: "Nguyễn Văn A", initials: "NA", avatarColor: "#4CAF50", task: "Phát triển API backend", status: "Completed" },
  { name: "Trần Thị B", initials: "TB", avatarColor: "#2196F3", task: "Tích hợp xác thực người dùng", status: "In Progress" },
  { name: "Lê Văn C", initials: "LC", avatarColor: "#9C27B0", task: "Thiết kế giao diện tìm kiếm", status: "Pending" },
  { name: "Phạm Thị D", initials: "PD", avatarColor: "#FF9800", task: "Kiểm thử giao diện trang chủ", status: "In Progress" },
];

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function TeamCollaborationCard({
  title = "Cộng tác nhóm",
  members = DEFAULT_MEMBERS,
  loading = false,
}: TeamCollaborationCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl p-4 border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full">
        <div className={`${SK} h-3 w-28 mb-4`} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className={`${SK} w-8 h-8 rounded-full`} />
            <div className="flex-1 space-y-1.5">
              <div className={`${SK} h-3 w-24`} />
              <div className={`${SK} h-2.5 w-36`} />
            </div>
            <div className={`${SK} h-5 w-16 rounded-full`} />
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
          <span className="text-base leading-none">+</span> Thêm
        </button>
      </div>

      <ul className="flex-1 divide-y divide-gray-100 dark:divide-[#21262d]">
        {members.map((m, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{ backgroundColor: m.avatarColor }}
            >
              {m.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-gray-800 dark:text-[#e6edf3] m-0 leading-tight truncate">
                {m.name}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-[#8b949e] m-0 mt-0.5 truncate">
                {m.task}
              </p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[m.status]}`}>
              {STATUS_LABELS[m.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
