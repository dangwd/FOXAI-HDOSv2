'use client';
import useAuthStore from '@/core/auth/authStore';
import { authService } from '@/core/auth/authService';

export default function TopBar() {
  const user = useAuthStore((s) => s.user);

  const avatarLetter = user?.name?.charAt(0).toUpperCase()
    ?? user?.email?.charAt(0).toUpperCase()
    ?? 'U';

  return (
    <header className="h-14 flex-shrink-0 bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d] flex items-center px-5 gap-4">
      {/* Search input — full width */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-[#8b949e]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm bệnh nhân, module, chức năng..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-[#21262d] border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-[#161b22] outline-none text-gray-700 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#8b949e] transition-colors"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Bell with orange badge */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
            5
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-[#30363d]" />

        {/* Avatar + name + role */}
        <div className="relative group">
          <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors cursor-pointer select-none">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {avatarLetter}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 dark:text-[#e6edf3] leading-tight m-0">
                {user?.name ?? 'Người dùng'}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-[#8b949e] leading-tight m-0">
                Admin
              </p>
            </div>
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-lg py-1 z-50 hidden group-focus-within:block group-hover:block">
            {user && (
              <div className="px-3 py-2 border-b border-gray-100 dark:border-[#30363d]">
                <p className="text-xs font-medium text-gray-800 dark:text-[#e6edf3] truncate m-0">{user.name ?? user.email}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#8b949e] truncate m-0">{user.email}</p>
              </div>
            )}
            <button
              onClick={() => authService.logout()}
              className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
