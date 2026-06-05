"use client";

import { KpiCard } from "@/components/widgets/KpiCard";
import { ChartBar } from "@/components/widgets/ChartBar";
import { ChartPie } from "@/components/widgets/ChartPie";
import { ReminderCard } from "@/components/widgets/ReminderCard";
import { ProjectListCard } from "@/components/widgets/ProjectListCard";
import { TeamCollaborationCard } from "@/components/widgets/TeamCollaborationCard";
import { TimeTrackerCard } from "@/components/widgets/TimeTrackerCard";

const analyticsData = [
  { label: "T1", value: 4, active: 4, completed: 3, pending: 2 },
  { label: "T2", value: 6, active: 6, completed: 4, pending: 1 },
  { label: "T3", value: 5, active: 5, completed: 7, pending: 3 },
  { label: "T4", value: 8, active: 8, completed: 5, pending: 2 },
  { label: "T5", value: 7, active: 7, completed: 6, pending: 4 },
  { label: "T6", value: 9, active: 9, completed: 8, pending: 2 },
];

const progressData = [
  { label: "Hoàn thành", value: 41 },
  { label: "Đang thực hiện", value: 35 },
  { label: "Chờ xử lý", value: 24 },
];

export default function DashboardHome() {
  return (
    <div className="p-6 space-y-5 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#e6edf3] m-0 leading-tight">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0 mt-1">
            Lập kế hoạch, ưu tiên và hoàn thành công việc với sự dễ dàng.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#2D7D32] hover:bg-[#388E3C] text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Thêm dự án
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#0f172a] hover:bg-gray-50 dark:hover:bg-[#1f2937] text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl border border-gray-100 dark:border-[#1f2937] transition-colors shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Nhập dữ liệu
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          title="Tổng dự án"
          value={24}
          trend={{ isUp: true, label: "Tăng so với tháng trước" }}
        />
        <KpiCard
          title="Đã hoàn thành"
          value={10}
          trend={{ isUp: true, label: "Tăng so với tháng trước" }}
        />
        <KpiCard
          title="Đang thực hiện"
          value={12}
          trend={{ isUp: true, label: "Tăng so với tháng trước" }}
        />
        <KpiCard
          title="Chờ xử lý"
          value={2}
          hint="Đang thảo luận"
          hintColor="#6B7280"
        />
      </div>

      {/* Analytics + Reminder + Projects */}
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: 220 }}>
        <div className="col-span-5">
          <ChartBar
            title="Phân tích dự án"
            height={188}
            data={analyticsData}
            series={[
              { key: "active", color: "#2D7D32", name: "Đang làm" },
              { key: "completed", color: "#86EFAC", name: "Hoàn thành" },
              { key: "pending", color: "#D1FAE5", name: "Chờ" },
            ]}
            legend
          />
        </div>
        <div className="col-span-4">
          <ReminderCard
            title="Nhắc nhở"
            reminders={[
              {
                title: "Họp giao ban sáng",
                timeRange: "08:00 SA - 09:00 SA",
                actionLabel: "Tham gia ngay",
              },
            ]}
          />
        </div>
        <div className="col-span-3">
          <ProjectListCard />
        </div>
      </div>

      {/* Team + Progress + Timer */}
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: 220 }}>
        <div className="col-span-5">
          <TeamCollaborationCard />
        </div>
        <div className="col-span-4">
          <ChartPie
            title="Tiến độ dự án"
            height={188}
            data={progressData}
            variant="donut"
            colors={["#2D7D32", "#1565C0", "#9E9E9E"]}
            legend
          />
        </div>
        <div className="col-span-3">
          <TimeTrackerCard />
        </div>
      </div>
    </div>
  );
}
