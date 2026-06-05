"use client";

import { useState, useEffect, useRef } from "react";

interface TimeTrackerCardProps {
  initialSeconds?: number;
  label?: string;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function TimeTrackerCard({
  initialSeconds = 0,
  label = "Time Tracker",
}: TimeTrackerCardProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const handleReset = () => {
    setRunning(false);
    setSeconds(0);
  };

  return (
    <div className="rounded-xl bg-[#1B3A12] h-full flex flex-col items-center justify-between p-5 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full bg-[#2A5A20]/40 pointer-events-none" />
      <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-[#2A5A20]/30 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p className="text-[12px] font-semibold text-green-200/70 uppercase tracking-wider m-0">
            {label}
          </p>
        </div>
      </div>

      {/* Timer display */}
      <div className="relative z-10 text-center">
        <p className="text-4xl font-bold text-white tabular-nums tracking-widest m-0 leading-none">
          {formatTime(seconds)}
        </p>
        <p className="text-[10px] text-green-300/40 m-0 mt-2 uppercase tracking-wider">
          {running ? "đang chạy" : seconds === 0 ? "sẵn sàng" : "đã dừng"}
        </p>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center gap-3">
        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-9 h-9 rounded-full bg-[#2A5A20] hover:bg-[#3A7A30] flex items-center justify-center text-green-200 transition-colors"
          title="Đặt lại"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={() => setRunning((r) => !r)}
          className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-[#1B3A12] transition-colors shadow-lg"
          title={running ? "Tạm dừng" : "Bắt đầu"}
        >
          {running ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Lap / placeholder */}
        <button
          className="w-9 h-9 rounded-full bg-[#2A5A20] hover:bg-[#3A7A30] flex items-center justify-center text-green-200 transition-colors"
          title="Vòng"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
