import React from 'react';

export default function SkillGapAnalysis({ profile }) {
  // ✅ Dynamically reads profile.skills parsed directly from the CV
  const verifiedSkills = profile?.skills || [];
  const missingSkills = profile?.missingSkills || [];

  if (!profile?.cvUrl) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-center space-y-3">
        <span className="text-4xl">📄</span>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Active CV Uploaded
        </h4>
        <p className="text-xs text-slate-500 dark:text-dark-muted max-w-sm mx-auto">
          Upload a resume above to extract your verified skills and perform skill gap analysis.
        </p>
      </div>
    );
  }

  // ✅ Empty state when CV is uploaded but contains no recognizable skills
  if (verifiedSkills.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-center space-y-3">
        <span className="text-4xl">🔍</span>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Skills Detected in Active CV
        </h4>
        <p className="text-xs text-slate-500 dark:text-dark-muted max-w-sm mx-auto">
          Scanned active CV (<strong>{profile.cvFileName || 'Uploaded Resume'}</strong>), but no matching technical skills were found in the document.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted">
            Skill Gap Analysis & Recommendations
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-cyan/20 dark:text-brand-cyan">
            CV File: {profile.cvFileName || 'Uploaded Resume'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Extracted {verifiedSkills.length} verified skill(s) strictly from your active CV.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verified Strengths */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span>✓ Verified Strengths ({verifiedSkills.length})</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {verifiedSkills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                ✓ {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic Gaps for Target Jobs */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <span>⚠️ Gaps for Target Jobs ({missingSkills.length})</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                >
                  ⚠️ {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No missing skills detected for open positions!</span>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      {missingSkills.length > 0 && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start gap-3">
          <span className="text-lg">💡</span>
          <div>
            <h5 className="text-xs font-bold text-brand-blue dark:text-brand-cyan uppercase tracking-wider">
              AI Recommendation
            </h5>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
              Completing a module in <strong className="text-slate-900 dark:text-white font-bold">{missingSkills[0]}</strong> can boost your match score for active job listings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}