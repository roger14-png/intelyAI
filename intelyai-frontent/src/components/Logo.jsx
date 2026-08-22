import React from 'react';

export default function Logo({ showText = true }) {
  return (
    <div className="flex items-center gap-2 select-none shrink-0 cursor-pointer">
      {/* Icon Badge - Fixed 28px square */}
      <div className="w-7 h-7 rounded-lg bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm flex items-center justify-center p-1 shrink-0">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="iBlue" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0066FF" />
              <stop offset="1" stopColor="#00C2FF" />
            </linearGradient>
            <linearGradient id="hGreen" x1="32" y1="32" x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00D25B" />
              <stop offset="1" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* 'i' dot & stem */}
          <circle cx="8" cy="7" r="2.5" fill="url(#iBlue)" />
          <rect x="6" y="12" width="4" height="13" rx="2" fill="url(#iBlue)" />

          {/* 'H' left & right stem */}
          <path d="M16 12V25M16 18H22M22 25V14" stroke="url(#hGreen)" strokeWidth="3.5" strokeLinecap="round" />
          
          {/* Arrow head */}
          <path d="M19 15L22 10L25 15Z" fill="url(#hGreen)" />

          {/* Bottom Swoosh */}
          <path d="M4 22C4 29 18 30 27 18" stroke="url(#iBlue)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Intely<span className="text-gradient-green">Hire</span>
          </span>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-brand-cyan uppercase">
            OS
          </span>
        </div>
      )}
    </div>
  );
}