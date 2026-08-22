import React, { useState, useEffect } from 'react';

export default function RecruiterDashboard({ jobs: initialJobs = [], applications: initialApps = [] }) {
  const [activeTab, setActiveTab] = useState('jobs');
  
  // Local state initialized with props
  const [jobs, setJobs] = useState(initialJobs);
  const [applications, setApplications] = useState(initialApps);
  const [interviews, setInterviews] = useState([
    {
      id: 'int-501',
      applicationId: 'app_301',
      candidateName: 'Alex Mercer',
      company: 'Nexus AI Labs',
      role: 'Senior Frontend Developer',
      scheduledTime: '2026-08-21T14:00',
      platform: 'Google Meet',
      link: 'https://meet.google.com/abc-defg-hij'
    }
  ]);

  // Sync state if initial props update
  useEffect(() => {
    if (initialJobs.length > 0) setJobs(initialJobs);
  }, [initialJobs]);

  useEffect(() => {
    if (initialApps.length > 0) setApplications(initialApps);
  }, [initialApps]);

  // Modal States
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobModalMode, setJobModalMode] = useState('manual'); // 'manual' | 'ai_sourced'
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  // Active selections
  const [selectedApp, setSelectedApp] = useState(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [interviewForm, setInterviewForm] = useState({
    scheduledTime: '',
    platform: 'Google Meet',
    link: ''
  });

  // Manual Job Creation Form State
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    description: '',
    salaryMin: 4000,
    salaryMax: 6000,
    location: 'Nairobi, Kenya (Hybrid)',
    requiredSkills: '',
    source: 'internal'
  });

  // AI Job Sourcing Search Query State
  const [aiSearchQuery, setAiSearchQuery] = useState('Senior React Engineer Remote');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [sourcedResults, setSourcedResults] = useState([]);

  // --- 1. TOGGLE JOB STATUS (PERSISTED TO DB.JSON) ---
  const toggleJobStatus = async (jobId) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    const newStatus = targetJob.status === 'open' ? 'closed' : 'open';

    // Optimistic UI Update
    setJobs((prevJobs) =>
      prevJobs.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job))
    );

    // Save to json-server
    try {
      await fetch(`http://localhost:5000/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.warn('API server offline, saved locally only:', err);
    }
  };

  // --- 2. MANUAL JOB CREATION (PERSISTED TO DB.JSON) ---
  const handleCreateManualJob = async (e) => {
    e.preventDefault();
    const createdJob = {
      id: `job_${Date.now()}`,
      company: newJob.company || 'Nexus AI Labs',
      title: newJob.title,
      description: newJob.description,
      salaryMin: Number(newJob.salaryMin),
      salaryMax: Number(newJob.salaryMax),
      location: newJob.location,
      trustScore: 98,
      verificationStatus: 'verified',
      requiredSkills: newJob.requiredSkills.split(',').map((s) => s.trim()),
      status: 'open',
      source: 'internal',
      applicantCount: 0,
      createdAt: new Date().toISOString()
    };

    // Update UI state
    setJobs((prev) => [createdJob, ...prev]);

    // Save to json-server db.json
    try {
      await fetch('http://localhost:5000/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdJob),
      });
    } catch (err) {
      console.warn('API server offline, saved locally only:', err);
    }

    setIsJobModalOpen(false);
    setNewJob({ title: '', company: '', description: '', salaryMin: 4000, salaryMax: 6000, location: '', requiredSkills: '', source: 'internal' });
  };

  // --- 3. AI GLOBAL JOB SOURCING SIMULATOR ---
  const handleRunAiSourcer = () => {
    if (!aiSearchQuery.trim()) return;
    setIsAiSearching(true);
    
    setTimeout(() => {
      const mockGlobalJobs = [
        {
          id: `sourced_${Date.now()}_1`,
          company: 'Safaricom Digital',
          title: `${aiSearchQuery} (Global Sourced)`,
          description: `AI-verified global posting sourced from online market. Focuses on high scale architecture, clean APIs, and distributed systems.`,
          salaryMin: 5500,
          salaryMax: 8000,
          location: 'Nairobi / Remote',
          trustScore: 97,
          verificationStatus: 'verified',
          requiredSkills: ['React', 'TypeScript', 'Node.js', 'AWS'],
          status: 'open',
          source: 'ai_sourced',
          applicantCount: 5,
          createdAt: new Date().toISOString()
        },
        {
          id: `sourced_${Date.now()}_2`,
          company: 'Andela Talent Cloud',
          title: `Lead Frontend & AI Interface Architect`,
          description: `Global remote role aggregated via AI web scraper. Requires expertise in UI responsiveness and GraphQL APIs.`,
          salaryMin: 6000,
          salaryMax: 9000,
          location: 'Global Remote',
          trustScore: 95,
          verificationStatus: 'verified',
          requiredSkills: ['React', 'GraphQL', 'Tailwind CSS', 'Docker'],
          status: 'open',
          source: 'ai_sourced',
          applicantCount: 14,
          createdAt: new Date().toISOString()
        }
      ];

      setSourcedResults(mockGlobalJobs);
      setIsAiSearching(false);
    }, 1200);
  };

  // --- 4. IMPORT AI SOURCED JOB (PERSISTED TO DB.JSON) ---
  const handleImportSourcedJob = async (jobToImport) => {
    // 1. Remove from search list
    setSourcedResults((prev) => prev.filter((j) => j.id !== jobToImport.id));

    // 2. Add to local React state
    setJobs((prevJobs) => [jobToImport, ...prevJobs]);

    // 3. PERSIST TO DB.JSON via json-server POST request!
    try {
      const res = await fetch('http://localhost:5000/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobToImport),
      });
      if (res.ok) {
        console.log('Successfully saved AI sourced job to db.json!');
      }
    } catch (err) {
      console.warn('API server offline, saved locally only:', err);
    }
  };

  // --- 5. ADVANCE CANDIDATE PIPELINE (PERSISTED TO DB.JSON) ---
  const advancePipelineStage = async (appId) => {
    const stageOrder = ['applied', 'screening', 'interviewed', 'offered', 'hired'];
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;

    const currentIndex = stageOrder.indexOf((targetApp.status || 'applied').toLowerCase());
    const nextStatus = currentIndex >= 0 && currentIndex < stageOrder.length - 1
      ? stageOrder[currentIndex + 1]
      : 'hired';

    // Optimistic UI Update
    setApplications((prevApps) =>
      prevApps.map((app) => (app.id === appId ? { ...app, status: nextStatus } : app))
    );

    // Save status update to json-server
    try {
      await fetch(`http://localhost:5000/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      console.warn('API offline, updated locally only:', err);
    }
  };

  // --- 6. SAVE RECRUITER FEEDBACK (PERSISTED TO DB.JSON) ---
  const handleSaveFeedback = async () => {
    if (!selectedApp) return;

    // Optimistic UI update
    setApplications((prevApps) =>
      prevApps.map((app) => (app.id === selectedApp.id ? { ...app, notes: feedbackNote } : app))
    );

    // Save feedback note to json-server
    try {
      await fetch(`http://localhost:5000/applications/${selectedApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: feedbackNote }),
      });
    } catch (err) {
      console.warn('API offline, updated locally only:', err);
    }

    setIsFeedbackModalOpen(false);
    setSelectedApp(null);
    setFeedbackNote('');
  };

  // --- 7. SCHEDULE INTERVIEW ---
  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    const newInterview = {
      id: `int_${Date.now()}`,
      applicationId: selectedApp.id,
      candidateName: selectedApp.candidateName || `Candidate #${selectedApp.id}`,
      company: selectedApp.companyName || 'Target Company',
      role: selectedApp.jobTitle || 'Role',
      scheduledTime: interviewForm.scheduledTime || 'Tomorrow at 2:00 PM EAT',
      platform: interviewForm.platform,
      link: interviewForm.link || 'https://meet.google.com/new'
    };

    setInterviews([newInterview, ...interviews]);
    advancePipelineStage(selectedApp.id);

    try {
      await fetch('http://localhost:5000/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInterview),
      });
    } catch (err) {
      console.warn('API offline, saved locally:', err);
    }

    setIsInterviewModalOpen(false);
    setSelectedApp(null);
    setInterviewForm({ scheduledTime: '', platform: 'Google Meet', link: '' });
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-dark-border gap-6 text-sm font-semibold overflow-x-auto pb-1">
        {[
          { id: 'jobs', label: '💼 Job Postings & AI Sourcing' },
          { id: 'candidates', label: '👥 Candidates Pipeline' },
          { id: 'interviews', label: '📅 Scheduled Interviews' },
          { id: 'reports', label: '📈 Analytics & Recruiter Reports' },
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

      {/* --- TAB 1: JOB POSTINGS & AI SOURCING --- */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Active Postings ({jobs.length})</h3>
              <p className="text-xs text-slate-500 dark:text-dark-muted">Manage postings, toggle open/closed status, or source verified jobs globally.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setJobModalMode('ai_sourced');
                  setIsJobModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-blue/10 text-brand-blue dark:bg-brand-cyan/20 dark:text-brand-cyan border border-brand-blue/30 hover:bg-brand-blue/20 transition-colors flex items-center gap-1.5"
              >
                <span>🤖 AI Global Job Sourcer</span>
              </button>

              <button
                onClick={() => {
                  setJobModalMode('manual');
                  setIsJobModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-green text-white hover:bg-emerald-600 transition-all shadow-green-glow flex items-center gap-1.5"
              >
                <span>+ Create Posting</span>
              </button>
            </div>
          </div>

          {/* Job Postings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`p-5 rounded-2xl bg-white dark:bg-dark-surface border transition-all ${
                  job.status === 'open'
                    ? 'border-slate-200 dark:border-dark-border'
                    : 'border-slate-200/50 dark:border-dark-border/50 opacity-75 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-brand-blue dark:text-brand-cyan">{job.company}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      job.source === 'ai_sourced'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-dark-bg dark:text-slate-400'
                    }`}>
                      {job.source === 'ai_sourced' ? '🤖 AI Sourced' : '🏢 Internal'}
                    </span>
                  </div>

                  <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {job.trustScore}% Trust Score
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-2">{job.title}</h4>
                <p className="text-xs text-slate-500 dark:text-dark-muted line-clamp-2 mt-1.5">{job.description}</p>

                {/* Required Skills Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {job.requiredSkills?.map((skill, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-300 font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border flex justify-between items-center text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    👥 Applicants: <strong className="text-slate-900 dark:text-white">{job.applicantCount || 0}</strong>
                  </span>

                  <div className="flex items-center gap-3">
                    <span className={`font-bold uppercase text-[11px] ${
                      job.status === 'open' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}>
                      ● {job.status}
                    </span>

                    <button
                      onClick={() => toggleJobStatus(job.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        job.status === 'open'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                      }`}
                    >
                      {job.status === 'open' ? 'Close Job' : 'Reopen Job'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 2: CANDIDATE PIPELINE --- */}
      {activeTab === 'candidates' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Application Pipeline & Review</h3>
              <p className="text-xs text-slate-500">Review scores, add recruiter feedback notes, and advance candidate stages.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-cyan/20 dark:text-brand-cyan">
              Total Applications: {applications.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-dark-bg text-slate-500 border-b border-slate-200 dark:border-dark-border">
                <tr>
                  <th className="p-3">Application ID</th>
                  <th className="p-3">Job Posting</th>
                  <th className="p-3">CV Match</th>
                  <th className="p-3">Date Applied</th>
                  <th className="p-3">Pipeline Status</th>
                  <th className="p-3">Feedback / Notes</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/50 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">#{app.id}</td>
                    <td className="p-3">
                      <span className="font-bold block text-slate-800 dark:text-slate-200">{app.jobTitle || 'Role'}</span>
                      <span className="text-[10px] text-slate-400">{app.companyName || 'Company'}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {app.matchScore || 90}%
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="p-3 font-extrabold uppercase text-brand-blue dark:text-brand-cyan">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50">
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">
                      {app.notes ? (
                        <span className="text-slate-700 dark:text-slate-300 font-medium">📝 {app.notes}</span>
                      ) : (
                        <span className="italic text-slate-400">No notes yet</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setFeedbackNote(app.notes || '');
                          setIsFeedbackModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
                      >
                        📝 Feedback
                      </button>

                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setIsInterviewModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-blue/10 text-brand-blue dark:bg-brand-cyan/20 dark:text-brand-cyan hover:bg-brand-blue/20 transition-colors"
                      >
                        📅 Schedule
                      </button>

                      <button
                        onClick={() => advancePipelineStage(app.id)}
                        className="px-3 py-1 rounded-lg bg-brand-blue text-white font-bold hover:bg-brand-blueHover transition-colors shadow-brand-glow"
                      >
                        Advance ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: SCHEDULED INTERVIEWS --- */}
      {activeTab === 'interviews' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Upcoming Interview Sessions</h3>
              <p className="text-xs text-slate-500">Scheduled Google Meet, Zoom, and screening calls with candidates.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {interviews.length} Scheduled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviews.map((int) => (
              <div key={int.id} className="p-4 rounded-xl border border-brand-green/30 bg-brand-green/5 dark:bg-brand-green/10 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-green uppercase">{int.platform} Session</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      Confirmed
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{int.role}</h4>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Candidate: {int.candidateName} • Company: {int.company}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-dark-muted mt-1">
                    📅 Date & Time: {int.scheduledTime}
                  </p>
                </div>

                <div className="pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-between">
                  <a
                    href={int.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-brand-blue dark:text-brand-cyan hover:underline truncate max-w-[200px]"
                  >
                    🔗 {int.link}
                  </a>
                  <a
                    href={int.link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-brand-green text-white hover:bg-emerald-600 transition-colors shadow-green-glow"
                  >
                    Join Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: ANALYTICS & RECRUITER REPORTS --- */}
      {activeTab === 'reports' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border space-y-6">
          <div>
            <h3 className="text-lg font-bold">Recruiter Intelligence & Performance Analytics</h3>
            <p className="text-xs text-slate-500">Metrics on job postings, sourcing velocity, and candidate funnel conversion rates.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-center">
              <span className="block text-2xl font-black text-brand-blue dark:text-brand-cyan">{jobs.length}</span>
              <span className="text-xs font-bold uppercase text-slate-500">Active Postings</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-center">
              <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">{applications.length}</span>
              <span className="text-xs font-bold uppercase text-slate-500">Total Applicants</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-center">
              <span className="block text-2xl font-black text-amber-500">{interviews.length}</span>
              <span className="text-xs font-bold uppercase text-slate-500">Interviews Held</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-center">
              <span className="block text-2xl font-black text-purple-600 dark:text-purple-400">95.8%</span>
              <span className="text-xs font-bold uppercase text-slate-500">Avg Job Trust Score</span>
            </div>
          </div>

          {/* Sourcing Breakdown Report */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Sourcing Channel Effectiveness
            </h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>AI Sourced Jobs (Global Engines)</span>
                  <span>{jobs.filter((j) => j.source === 'ai_sourced').length} jobs</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-dark-border overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(jobs.filter((j) => j.source === 'ai_sourced').length / Math.max(jobs.length, 1)) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Internal / Direct Postings</span>
                  <span>{jobs.filter((j) => j.source !== 'ai_sourced').length} jobs</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-dark-border overflow-hidden">
                  <div className="h-full bg-brand-blue rounded-full" style={{ width: `${(jobs.filter((j) => j.source !== 'ai_sourced').length / Math.max(jobs.length, 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: JOB CREATION / AI SOURCING MODAL --- */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setJobModalMode('manual')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    jobModalMode === 'manual'
                      ? 'bg-brand-blue text-white'
                      : 'bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400'
                  }`}
                >
                  📝 Manual Job
                </button>
                <button
                  onClick={() => setJobModalMode('ai_sourced')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    jobModalMode === 'ai_sourced'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🤖 AI Global Sourcer
                </button>
              </div>
              <button onClick={() => setIsJobModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {/* MANUAL JOB CREATION FORM */}
            {jobModalMode === 'manual' ? (
              <form onSubmit={handleCreateManualJob} className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Create New Job Posting</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Job Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Frontend Developer"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Company</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nexus AI Labs"
                      value={newJob.company}
                      onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Job responsibilities and domain overview..."
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Min Salary ($/mo)</label>
                    <input
                      type="number"
                      value={newJob.salaryMin}
                      onChange={(e) => setNewJob({ ...newJob, salaryMin: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Max Salary ($/mo)</label>
                    <input
                      type="number"
                      value={newJob.salaryMax}
                      onChange={(e) => setNewJob({ ...newJob, salaryMax: e.target.value })}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Required Skills (Comma separated)</label>
                  <input
                    type="text"
                    required
                    placeholder="React, TypeScript, Tailwind CSS, GraphQL"
                    value={newJob.requiredSkills}
                    onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsJobModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-green text-white hover:bg-emerald-600 transition-colors shadow-green-glow"
                  >
                    Publish Job Posting
                  </button>
                </div>
              </form>
            ) : (
              /* AI GLOBAL JOB SOURCING PANEL */
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Global Job Search Engine</h4>
                  <p className="text-xs text-slate-500">Scan LinkedIn, Indeed, Glassdoor & global sites for verified job listings.</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiSearchQuery}
                    onChange={(e) => setAiSearchQuery(e.target.value)}
                    placeholder="e.g. Senior Frontend Developer Nairobi"
                    className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg"
                  />
                  <button
                    onClick={handleRunAiSourcer}
                    disabled={isAiSearching}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                  >
                    {isAiSearching ? 'Scraping Global Markets...' : '🔍 Search & Verify'}
                  </button>
                </div>

                {/* Sourced Results List */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {sourcedResults.map((sJob) => (
                    <div key={sJob.id} className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">{sJob.company}</span>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">{sJob.title}</h5>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{sJob.description}</p>
                      </div>
                      <button
                        onClick={() => handleImportSourcedJob(sJob)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-200 whitespace-nowrap"
                      >
                        + Import Job
                      </button>
                    </div>
                  ))}

                  {sourcedResults.length === 0 && !isAiSearching && (
                    <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-dark-border rounded-xl">
                      Enter search keywords above and click Search & Verify to pull verified global jobs.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: RECRUITER FEEDBACK MODAL --- */}
      {isFeedbackModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <h3 className="text-sm font-bold">Candidate Evaluation Notes</h3>
              <button onClick={() => setIsFeedbackModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Candidate App ID: <strong>#{selectedApp.id}</strong> • Role: <strong>{selectedApp.jobTitle}</strong>
            </p>

            <textarea
              rows={4}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="e.g. Passed technical screening with 90%. Great communication and strong React expertise."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeedback}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-blue text-white hover:bg-brand-blueHover shadow-brand-glow"
              >
                Save Recruiter Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: INTERVIEW SCHEDULER MODAL --- */}
      {isInterviewModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <h3 className="text-sm font-bold">Schedule Interview Call</h3>
              <button onClick={() => setIsInterviewModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleScheduleInterview} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Date & Time Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tomorrow at 2:00 PM EAT"
                  value={interviewForm.scheduledTime}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduledTime: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Meeting Platform</label>
                <select
                  value={interviewForm.platform}
                  onChange={(e) => setInterviewForm({ ...interviewForm, platform: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom Meeting</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Meeting Call Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={interviewForm.link}
                  onChange={(e) => setInterviewForm({ ...interviewForm, link: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-green text-white hover:bg-emerald-600 transition-colors shadow-green-glow"
                >
                  Confirm & Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}