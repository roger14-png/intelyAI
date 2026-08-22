import React, { useState } from 'react';

export default function ApplicationReviewCenter({ draft, onApprove, onReject }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    emailSubject: draft?.emailSubject || '',
    emailBody: draft?.emailBody || '',
    coverLetter: draft?.coverLetter || '',
  });

  if (!draft) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border">
        <p className="text-slate-500 dark:text-dark-muted font-medium">
          No pending application package drafts. Select a job from the board to generate a draft.
        </p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveAndApprove = () => {
    onApprove({ ...draft, ...formData });
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-lg overflow-hidden transition-all duration-300">
      
      {/* Header Banner */}
      <div className="p-6 bg-slate-50 dark:bg-dark-bg/50 border-b border-slate-200 dark:border-dark-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-brand-cyan">
              Human Review Required
            </span>
            <span className="text-xs text-slate-500 dark:text-dark-muted">Draft ID: #{draft.id}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Application Package Draft
          </h2>
        </div>

        {/* Match & Trust Indicators */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-center">
            <span className="block text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Match Score</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{draft.matchScore}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-center">
            <span className="block text-[10px] uppercase font-bold text-brand-blue dark:text-brand-cyan">Job Trust</span>
            <span className="text-lg font-black text-brand-blue dark:text-brand-cyan">{draft.trustScore}%</span>
          </div>
        </div>
      </div>

      {/* Form / Content Area */}
      <div className="p-6 space-y-6">
        
        {/* Email Subject */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Recruiter Email Subject
          </label>
          <input
            type="text"
            name="emailSubject"
            value={formData.emailSubject}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-80"
          />
        </div>

        {/* Email Body */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Email Outreach Body
          </label>
          <textarea
            rows={4}
            name="emailBody"
            value={formData.emailBody}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-80 resize-y"
          />
        </div>

        {/* AI Cover Letter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Generated Cover Letter Content
          </label>
          <textarea
            rows={4}
            name="coverLetter"
            value={formData.coverLetter}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-80 resize-y"
          />
        </div>

      </div>

      {/* Footer Controls */}
      <div className="p-6 bg-slate-50 dark:bg-dark-bg/50 border-t border-slate-200 dark:border-dark-border flex flex-wrap items-center justify-between gap-4">
        
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-300 dark:border-dark-border hover:bg-slate-200 dark:hover:bg-dark-border transition-colors text-slate-700 dark:text-slate-300"
        >
          {isEditing ? 'Lock Editing' : '✏️ Edit Text Fields'}
        </button>

        <div className="flex items-center gap-3">
          {/* Reject Button */}
          <button
            type="button"
            onClick={() => onReject(draft.id)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 hover:bg-red-100 transition-colors"
          >
            Discard Draft
          </button>

          {/* Approve & Send Button (Brand Green Glow) */}
          <button
            type="button"
            onClick={handleSaveAndApprove}
            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-brand-green to-emerald-600 hover:opacity-95 shadow-green-glow transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Approve & Send
          </button>
        </div>

      </div>

    </div>
  );
}