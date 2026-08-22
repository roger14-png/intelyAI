import React from 'react';
import Logo from './Logo';

export default function Navbar({
  darkMode,
  setDarkMode,
  currentView,
  setCurrentView,
  currentUser,
  hasDraft,
  onOpenAuth,
  onLogout,
}) {
  
  // Helper to open a specific portal page in a NEW browser tab
  const openInNewTab = (role) => {
    const url = `${window.location.origin}${window.location.pathname}?role=${role}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-dark-bg/90 backdrop-blur-md border-b border-slate-200/80 dark:border-dark-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-start gap-4 sm:gap-6">
        
        {/* 1. Logo */}
        <Logo showText={true} />

        <div className="h-5 w-px bg-slate-200 dark:bg-dark-border hidden sm:block" />

        {/* 2. Active Portal Indicator */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300">
            Active: <span className="text-brand-blue dark:text-brand-cyan">{currentView}</span>
          </span>
        </div>

        {/* 3. Portal Switcher Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-surface p-1 rounded-xl border border-slate-200 dark:border-dark-border">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-1 hidden sm:inline">
            Open Tab ↗:
          </span>

          <button
            onClick={() => openInNewTab('candidate')}
            title="Open Candidate Portal in New Tab"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              currentView === 'candidate'
                ? 'bg-white dark:bg-dark-bg text-brand-blue dark:text-brand-cyan shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Candidate ↗
          </button>

          <button
            onClick={() => openInNewTab('recruiter')}
            title="Open Recruiter Portal in New Tab"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              currentView === 'recruiter'
                ? 'bg-white dark:bg-dark-bg text-brand-blue dark:text-brand-cyan shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Recruiter ↗
          </button>

          <button
            onClick={() => openInNewTab('admin')}
            title="Open Admin Portal in New Tab"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              currentView === 'admin'
                ? 'bg-white dark:bg-dark-bg text-brand-blue dark:text-brand-cyan shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Admin ↗
          </button>
        </div>

        {/* 4. Controls: Draft Indicator + Dark Mode + Auth Profile */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          
          {hasDraft && (
            <button
              onClick={() => setCurrentView('candidate-review')}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold animate-pulse hover:bg-amber-500/20 transition-colors"
            >
              <span>✍️ Draft Ready</span>
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Theme"
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-dark-surface text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-border hover:border-brand-blue transition-colors text-xs font-bold"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* AUTHENTICATED USER UI */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-dark-border">
              {currentUser.avatar && (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name || 'User avatar'}
                  className="w-7 h-7 rounded-full object-cover border border-brand-blue"
                />
              )}
              <div className="hidden sm:flex flex-col text-left">
                {/* ✅ RENDER STRING PROPERTY (.name or .email), NOT THE OBJECT */}
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {currentUser.name || currentUser.email}
                </span>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 leading-tight">
                  {currentUser.role || 'Member'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-dark-border text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-1"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-dark-border">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-surface transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-brand-blue text-white hover:bg-brand-blueHover shadow-brand-glow transition-all"
              >
                Sign Up
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}