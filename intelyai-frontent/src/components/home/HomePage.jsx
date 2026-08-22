import React, { useState } from 'react';
import Logo from '../Logo';
import AuthModal from '../auth/AuthModal';

export default function HomePage({ darkMode, setDarkMode, onNavigateToPortal }) {
  // Popup state: { isOpen: boolean, mode: 'login' | 'signup' }
  const [authPopup, setAuthPopup] = useState({ isOpen: false, mode: 'login' });

  const openPopup = (mode) => setAuthPopup({ isOpen: true, mode });
  const closePopup = () => setAuthPopup({ isOpen: false, mode: 'login' });

  // ✅ Fixes the parameter signature: AuthModal passes (user, role)
  const handleAuthSuccess = (user, role) => {
    closePopup();
    // Safely extract string role (e.g., 'candidate', 'recruiter', or 'admin')
    const targetRole = typeof role === 'string' ? role : (user?.role || 'candidate');
    onNavigateToPortal(targetRole);
  };

  return (
    <div className="min-h-screen bg-bright-bg dark:bg-dark-bg text-bright-text dark:text-dark-text transition-colors duration-200">
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <Logo showText={true} />

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-brand-blue dark:hover:text-brand-cyan">Features</a>
            <a href="#compliance" className="hover:text-brand-blue dark:hover:text-brand-cyan">Compliance</a>
          </nav>

          {/* Action Buttons: Log In & Sign Up */}
          <div className="flex items-center gap-3">
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl bg-slate-100 dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-sm"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Log In Trigger */}
            <button
              onClick={() => openPopup('login')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-surface transition-colors"
            >
              Log In
            </button>

            {/* Sign Up Trigger */}
            <button
              onClick={() => openPopup('signup')}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-blue to-brand-cyan hover:opacity-95 shadow-brand-glow transition-all"
            >
              Sign Up Free
            </button>

          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="py-20 lg:py-28 text-center space-y-8 bg-blue-green-glow">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
            Accelerate Your Career with <span className="text-gradient-brand">Intelligent AI Matching</span>
          </h1>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => openPopup('signup')}
              className="px-8 py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-green to-emerald-600 shadow-green-glow transition-all"
            >
              Sign Up as Candidate →
            </button>
          </div>
        </div>
      </section>

      {/* AUTH POPUP MODAL */}
      <AuthModal
        isOpen={authPopup.isOpen}
        mode={authPopup.mode}
        onClose={closePopup}
        onSuccess={handleAuthSuccess}
      />

    </div>
  );
}