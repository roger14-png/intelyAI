import React, { useState } from 'react';
import SkillGapAnalysis from './SkillGapAnalysis';
import CareerCoachModal from './CareerCoachModal';
import ApplicationDraftModal from './ApplicationDraftModal';

// Helper: Dynamically calculates skill match percentage and breakdown between CV & Job
export const getSkillMatchDetails = (requiredSkills = [], candidateSkills = []) => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { matchPercentage: 100, matchedSkills: [], missingSkills: [], totalRequired: 0 };
  }
  if (!candidateSkills || candidateSkills.length === 0) {
    return { matchPercentage: 0, matchedSkills: [], missingSkills: requiredSkills, totalRequired: requiredSkills.length };
  }

  const matchedSkills = [];
  const missingSkills = [];

  requiredSkills.forEach((reqSkill) => {
    const reqLower = reqSkill.toLowerCase().trim();
    const isMatched = candidateSkills.some((cSkill) => {
      const candLower = cSkill.toLowerCase().trim();
      return reqLower === candLower || reqLower.includes(candLower) || candLower.includes(reqLower);
    });

    if (isMatched) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  });

  const matchPercentage = Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    totalRequired: requiredSkills.length
  };
};

export default function CandidateDashboard({
  profile,
  jobs,
  applications,
  activeDraft,
  onUploadCv,
  onDeleteCv,
  onGenerateDraft,
  onSubmitApplication,
  onDeleteDataRequest
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [selectedJobForDraft, setSelectedJobForDraft] = useState(null);

  // Stats calculation
  const appliedCount = applications.filter((a) => a.status === 'applied').length;
  const interviewedCount = applications.filter((a) => a.status === 'interviewed').length;
  const offeredCount = applications.filter((a) => a.status === 'offered').length;

  // Handle CV Upload / Replace
  const handleCvFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCv(true);
    try {
      await onUploadCv(file);
    } finally {
      setIsUploadingCv(false);
    }
  };

// Handle Draft Request
const handleRequestDraft = (job, calculatedMatch) => {
  const updatedJob = { ...job, matchPercentage: calculatedMatch };
  setSelectedJobForDraft(updatedJob); // Sets the selected job to show modal
  onGenerateDraft(updatedJob);        // Generates draft data in App state
};
  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-dark-border gap-6 text-sm font-semibold overflow-x-auto pb-1">
        {[
          { id: 'overview', label: '📊 Overview & Readiness' },
          { id: 'jobs', label: '🎯 Smart Job Matches' },
          { id: 'pipeline', label: '🚀 Applications Pipeline' },
          { id: 'interviews', label: '📅 Interviews & Offers' },
          { id: 'settings', label: '⚙️ Settings & Privacy' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-brand-blue text-brand-blue dark:border-brand-cyan dark:text-brand-cyan'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- TAB 1: OVERVIEW & CAREER SCORE --- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Career Score & CV Manager Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted">
                  Career Readiness Score
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-green/20 text-brand-green dark:bg-brand-green/30">
                  {profile.readinessLevel || 'Ready'}
                </span>
              </div>

              {/* Gauge Progress Ring */}
              <div className="flex items-center justify-center my-6">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-dark-border"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-brand-green transition-all duration-1000 ease-out"
                      strokeDasharray={`${profile.careerScore || 0}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {profile.careerScore || 0}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">out of 100</span>
                  </div>
                </div>
              </div>

              {/* CV MANAGER CARD */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Active Resume / CV
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px] block">
                      {profile.cvFileName || (profile.cvUrl ? 'Active_Resume.pdf' : 'No CV Uploaded')}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      profile.cvUrl
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {profile.cvUrl ? '✓ Active' : '⚠️ Missing'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-dark-border">
                  {profile.cvUrl ? (
                    <>
                      <a
                        href={profile.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-brand-blue/10 text-brand-blue dark:bg-brand-cyan/20 dark:text-brand-cyan text-xs font-bold text-center hover:bg-brand-blue/20 transition-colors flex items-center justify-center gap-1"
                      >
                        👁️ View
                      </a>
                      <label className="flex-1 py-1.5 px-2 rounded-lg bg-slate-200 dark:bg-dark-surface text-slate-700 dark:text-slate-300 text-xs font-bold text-center hover:bg-slate-300 dark:hover:bg-dark-hover cursor-pointer transition-colors flex items-center justify-center gap-1">
                        {isUploadingCv ? 'Uploading...' : '🔄 Replace'}
                        <input type="file" accept=".pdf,.docx" onChange={handleCvFileChange} className="hidden" />
                      </label>
                      <button
                        onClick={onDeleteCv}
                        className="py-1.5 px-2.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        title="Delete active CV"
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <label className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-300 dark:border-dark-border text-xs text-slate-500 dark:text-slate-400 text-center hover:border-brand-blue cursor-pointer transition-colors block font-semibold">
                      {isUploadingCv ? 'Uploading & Vectorizing...' : '📄 Upload Resume / CV'}
                      <input type="file" accept=".pdf,.docx" onChange={handleCvFileChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCoachOpen(true)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-dark-hover text-brand-blue dark:text-brand-cyan font-bold text-xs uppercase tracking-wider hover:bg-brand-blue/10 transition-colors flex items-center justify-center gap-2"
            >
              💬 Ask IntelyAI Coach
            </button>
          </div>

          <div className="lg:col-span-2">
            <SkillGapAnalysis profile={profile} />
          </div>
        </div>
      )}

      {/* --- TAB 2: DYNAMIC SMART JOB MATCHES --- */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recommended Opportunities</h3>
              <p className="text-xs text-slate-500 dark:text-dark-muted">
                Match percentages are calculated directly from your active CV skills ({profile?.skills?.length || 0} verified).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => {
              // Dynamic skill match computation
              const { matchPercentage, matchedSkills, totalRequired } = getSkillMatchDetails(
                job.requiredSkills,
                profile?.skills
              );

              const hasCv = Boolean(profile?.cvUrl && profile?.skills?.length > 0);

              // Dynamic badge styling
              let badgeColorClass = 'bg-slate-100 text-slate-600 dark:bg-dark-bg dark:text-slate-400 border-slate-200';
              if (hasCv) {
                if (matchPercentage >= 75) {
                  badgeColorClass = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
                } else if (matchPercentage >= 40) {
                  badgeColorClass = 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
                } else {
                  badgeColorClass = 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
                }
              }

              return (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:border-brand-blue transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-blue dark:text-brand-cyan uppercase">
                        {job.company}
                      </span>
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${badgeColorClass}`}>
                        {hasCv ? `${matchPercentage}% Match` : '0% Match (No CV)'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{job.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-dark-muted line-clamp-2 mt-1.5">
                      {job.description}
                    </p>

                    {/* Skill Match Breakdown */}
                    <div className="mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Skill Match ({hasCv ? `${matchedSkills.length}/${totalRequired} Skills` : 'Upload CV to verify'})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.requiredSkills?.map((skill, idx) => {
                          const isSkillMatched = matchedSkills.includes(skill);
                          return (
                            <span
                              key={idx}
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1 transition-colors ${
                                isSkillMatched
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : 'bg-slate-100 text-slate-500 dark:bg-dark-bg dark:text-slate-400 border border-slate-200 dark:border-dark-border'
                              }`}
                            >
                              {isSkillMatched ? '✓' : '•'} {skill}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      ${job.salaryMin} - ${job.salaryMax} / mo
                    </span>
                    <button
                      onClick={() => handleRequestDraft(job, matchPercentage)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-blue text-white hover:bg-brand-blueHover transition-colors shadow-brand-glow"
                    >
                      Generate Application Package
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: APPLICATIONS PIPELINE --- */}
      {activeTab === 'pipeline' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border space-y-6">
          <h3 className="text-lg font-bold">Applications Progress Tracker</h3>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg">
              <span className="block text-2xl font-black text-brand-blue">{appliedCount}</span>
              <span className="text-xs text-slate-500 font-bold uppercase">Applied</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg">
              <span className="block text-2xl font-black text-amber-500">{interviewedCount}</span>
              <span className="text-xs text-slate-500 font-bold uppercase">Interviewing</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg">
              <span className="block text-2xl font-black text-brand-green">{offeredCount}</span>
              <span className="text-xs text-slate-500 font-bold uppercase">Offers</span>
            </div>
          </div>

          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg/60 flex items-center justify-between border border-slate-200 dark:border-dark-border"
              >
                <div>
                  <h5 className="text-sm font-bold">{app.jobTitle || `Application #${app.id}`}</h5>
                  <p className="text-xs text-slate-500">
                    Company: {app.companyName || 'N/A'} • Submitted:{' '}
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: INTERVIEWS --- */}
      {activeTab === 'interviews' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border space-y-4">
          <h3 className="text-lg font-bold">Scheduled Interview Sessions</h3>
          <div className="p-4 rounded-xl border border-brand-green/30 bg-brand-green/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-brand-green uppercase">Upcoming Technical Screening</span>
              <h4 className="text-base font-bold mt-0.5">Nexus AI Labs — Senior Frontend Role</h4>
              <p className="text-xs text-slate-500">Date: Tomorrow at 2:00 PM EAT (Google Meet)</p>
            </div>
            <button className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-green text-white hover:bg-emerald-600 transition-colors">
              Join Call
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 5: SETTINGS & PRIVACY --- */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border space-y-6">
          <div>
            <h3 className="text-lg font-bold">Privacy & Data Compliance</h3>
            <p className="text-xs text-slate-500">Compliant with Kenya Data Protection Act (2019) & GDPR</p>
          </div>

          <div className="space-y-4 border-t border-slate-200 dark:border-dark-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-bold">Data Consent & AI Learning Engine</h5>
                <p className="text-xs text-slate-500">
                  Allow IntelyHire Learning Engine to use anonymized application data to improve match models.
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-brand-blue" />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-dark-border pt-4">
              <div>
                <h5 className="text-sm font-bold text-red-600 dark:text-red-400">Right to be Forgotten (Data Deletion)</h5>
                <p className="text-xs text-slate-500">Request complete removal of CV vectors, application logs, and profile records.</p>
              </div>
              <button
                onClick={onDeleteDataRequest}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-red-300 text-red-600 dark:border-red-900 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Request Data Deletion
              </button>
            </div>
          </div>
        </div>
      )}

     {/* MODALS */}
{selectedJobForDraft && (
  <ApplicationDraftModal
    job={selectedJobForDraft}
    draft={activeDraft}
    onClose={() => setSelectedJobForDraft(null)}
    onSubmitPackage={(approvedPackage) => {
      onSubmitApplication(approvedPackage);
      setSelectedJobForDraft(null);
    }}
  />
)}

{isCoachOpen && <CareerCoachModal onClose={() => setIsCoachOpen(false)} />}
    </div>
  );
}