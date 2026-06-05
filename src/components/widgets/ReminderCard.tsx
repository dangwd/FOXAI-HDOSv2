"use client";

interface Reminder {
  title: string;
  timeRange: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ReminderCardProps {
  title?: string;
  reminders?: Reminder[];
  loading?: boolean;
}

const DEFAULT_REMINDERS: Reminder[] = [
  {
    title: "Họp giao ban khoa",
    timeRange: "08:00 SA - 09:00 SA",
    actionLabel: "Tham gia",
  },
];

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function ReminderCard({
  title = "Nhắc nhở",
  reminders = DEFAULT_REMINDERS,
  loading = false,
}: ReminderCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl p-4 border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full">
        <div className={`${SK} h-3 w-24 mb-4`} />
        <div className={`${SK} h-4 w-40 mb-2`} />
        <div className={`${SK} h-3 w-32 mb-4`} />
        <div className={`${SK} h-8 w-28 rounded-lg`} />
      </div>
    );
  }

  const reminder = reminders[0];

  return (
    <div className="rounded-2xl p-4 border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0">
          {title}
        </p>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </div>

      {reminder ? (
        <div className="flex-1 flex flex-col justify-between">
          <div className="bg-gray-50 dark:bg-[#0a0f1a] rounded-xl p-3 mb-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3] m-0 mb-1 leading-snug">
              {reminder.title}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-[#8b949e]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{reminder.timeRange}</span>
            </div>
          </div>

          {reminder.actionLabel && (
            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2D7D32] hover:bg-[#388E3C] text-white text-sm font-medium rounded-xl transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {reminder.actionLabel}
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-[#484f58]">
          Không có lịch nhắc
        </div>
      )}
    </div>
  );
}
