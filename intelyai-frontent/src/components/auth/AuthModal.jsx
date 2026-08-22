import React, { useState, useEffect } from 'react';

export default function AuthModal({ isOpen, mode: initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [selectedRole, setSelectedRole] = useState('candidate');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form & mode whenever modal opens or mode changes
  useEffect(() => {
    setMode(initialMode);
    setError('');
    setFormData({ name: '', email: '', password: '' });
  }, [initialMode, isOpen]);

  // Pre-fill email placeholder depending on role choice
  useEffect(() => {
    if (mode === 'login' && !formData.email) {
      if (selectedRole === 'candidate') setFormData((prev) => ({ ...prev, email: 'candidate@intelyhire.dev' }));
      if (selectedRole === 'recruiter') setFormData((prev) => ({ ...prev, email: 'recruiter@intelyhire.dev' }));
      if (selectedRole === 'admin') setFormData((prev) => ({ ...prev, email: 'admin@intelyhire.dev' }));
    }
  }, [selectedRole, mode]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        // --- SIGN UP WORKFLOW ---
        // 1. Check if user already exists
        let existingUsers = [];
        try {
          const res = await fetch(`http://localhost:5000/users?email=${encodeURIComponent(formData.email)}`);
          if (res.ok) existingUsers = await res.json();
        } catch (err) {
          // Server offline fallback
        }

        if (existingUsers.length > 0) {
          setError('An account with this email already exists. Please log in instead.');
          setLoading(false);
          return;
        }

        // 2. Construct New User Record
        const newUser = {
          id: `usr_${selectedRole}_${Date.now()}`,
          email: formData.email.toLowerCase(),
          name: formData.name || 'New Member',
          role: selectedRole,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          createdAt: new Date().toISOString()
        };

        // 3. Persist User to JSON-Server
        try {
          await fetch('http://localhost:5000/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
          });

          // 4. Create corresponding Candidate Profile if registering as candidate
          if (selectedRole === 'candidate') {
            const newProfile = {
              id: `prof_${Date.now()}`,
              userId: newUser.id,
              fullName: newUser.name,
              email: newUser.email,
              headline: 'Aspiring AI & Software Specialist',
              bio: 'Welcome to IntelyHire career engine!',
              location: 'Nairobi, Kenya',
              careerScore: 65,
              readinessLevel: 'Getting Started',
              skills: ['JavaScript', 'HTML/CSS'],
              skillAnalysis: [
                { name: 'JavaScript', level: 60, status: 'Moderate' },
                { name: 'React', level: 40, status: 'Gap Identified' }
              ]
            };

            await fetch('http://localhost:5000/candidate_profiles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newProfile)
            });
          }
        } catch (err) {
          console.warn('API server offline. Logged in with local state session.');
        }

        onSuccess(newUser, selectedRole);

      } else {
        // --- LOG IN WORKFLOW ---
        let matchedUser = null;

        try {
          const res = await fetch(`http://localhost:5000/users?email=${encodeURIComponent(formData.email.toLowerCase())}`);
          if (res.ok) {
            const users = await res.json();
            matchedUser = users.find((u) => u.email.toLowerCase() === formData.email.toLowerCase());
          }
        } catch (err) {
          // Server offline
        }

        // Fallback demo user if server is offline or mock user is used
        if (!matchedUser) {
          matchedUser = {
            id: `usr_${selectedRole}_1`,
            email: formData.email,
            name: formData.email.split('@')[0],
            role: selectedRole
          };
        }

        // Validate user role match
        if (matchedUser.role && matchedUser.role !== selectedRole) {
          setError(`Account found, but registered as a '${matchedUser.role}'. Please select the '${matchedUser.role}' portal tab above.`);
          setLoading(false);
          return;
        }

        onSuccess(matchedUser, selectedRole);
      }
    } catch (err) {
      setError('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-2xl p-6 space-y-5 relative animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-bg text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors font-bold text-sm"
        >
          ✕
        </button>

        {/* Tab Switcher: Log In vs Sign Up */}
        <div className="flex border-b border-slate-200 dark:border-dark-border pb-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 pb-2.5 text-sm font-bold transition-all border-b-2 ${
              mode === 'login'
                ? 'border-brand-blue text-brand-blue dark:border-brand-cyan dark:text-brand-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 pb-2.5 text-sm font-bold transition-all border-b-2 ${
              mode === 'signup'
                ? 'border-brand-blue text-brand-blue dark:border-brand-cyan dark:text-brand-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Sign Up Free
          </button>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {mode === 'login' ? 'Welcome Back 👋' : 'Create Your Account 🚀'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-dark-muted">
            {mode === 'login'
              ? 'Enter your credentials to access your portal'
              : 'Join the AI-powered career OS & job engine'}
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium text-center">
            {error}
          </div>
        )}

        {/* Portal Role Switcher */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 text-center">
            Select Account Portal Role
          </label>
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-dark-bg flex gap-1 border border-slate-200 dark:border-dark-border">
            {['candidate', 'recruiter', 'admin'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => { setSelectedRole(role); setError(''); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  selectedRole === role
                    ? 'bg-white dark:bg-dark-surface text-brand-blue dark:text-brand-cyan shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Mercer"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder={`${selectedRole}@intelyhire.dev`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-blue to-brand-cyan hover:opacity-95 shadow-brand-glow transition-all mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'login' ? (
              `Log In as ${selectedRole}`
            ) : (
              `Create ${selectedRole} Account`
            )}
          </button>
        </form>

        {/* Footer Prompt */}
        <div className="text-center text-xs text-slate-500 dark:text-dark-muted pt-2 border-t border-slate-100 dark:border-dark-border">
          {mode === 'login' ? (
            <p>
              New to IntelyHire?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className="font-bold text-brand-blue dark:text-brand-cyan hover:underline"
              >
                Sign Up Free
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="font-bold text-brand-blue dark:text-brand-cyan hover:underline"
              >
                Log In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}