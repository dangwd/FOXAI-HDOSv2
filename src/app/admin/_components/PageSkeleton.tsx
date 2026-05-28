export function PageSkeleton() {
  return (
    <div className="flex h-full animate-pulse overflow-hidden">
      <div className="w-56 shrink-0 border-r border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-3 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-gray-100 dark:bg-[#21262d]" />
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d]" />
        <div className="flex-1 p-5 bg-gray-50 dark:bg-[#010409] grid grid-cols-3 gap-4 content-start">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-gray-100 dark:bg-[#0d1117]" />
          ))}
        </div>
      </div>
      <div className="w-72 shrink-0 border-l border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-3 space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-[#21262d]" />
        ))}
      </div>
    </div>
  );
}
