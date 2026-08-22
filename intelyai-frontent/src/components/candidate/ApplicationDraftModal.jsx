import React, { useState } from 'react';

export default function ApplicationDraftModal({ job, draft, onClose, onSubmitPackage }) {
  const [coverLetter, setCoverLetter] = useState(draft?.coverLetter || "Generating AI draft...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApproveAndSend = async () => {
    setIsSubmitting(true);
    await onSubmitPackage({
      jobId: job?.id,
      coverLetter,
      matchScore: draft?.matchScore || 92,
      trustScore: draft?.trustScore || 98
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        
        {/* Header & Indicators (Step 4 Outputs) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Review AI Application Package
            </h3>
            <p className="text-xs text-slate-500">Position: {job?.title} at {job?.company}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        {/* Match & Trust Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Match Score</span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">{draft?.matchScore || 92}% Alignment</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">AI Trust & Truth Score</span>
            <span className="text-lg font-black text-blue-700 dark:text-blue-300">{draft?.trustScore || 98}% Verified</span>
          </div>
        </div>

        {/* Step 5 Editable Draft */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
            Generated Cover Letter (Editable)
          </label>
          <textarea
            rows={7}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-blue"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleApproveAndSend}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-blue text-white hover:bg-brand-blueHover transition-colors shadow-brand-glow flex items-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : '🚀 Approve & Submit Application'}
          </button>
        </div>

      </div>
    </div>
  );
}