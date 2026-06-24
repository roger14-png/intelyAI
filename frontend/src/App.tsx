import { useEffect, useState } from 'react';
import { AuthPage } from './pages/AuthPage';

import { CareerScoreCard } from './components/career/CareerScoreCard';
import { ApplicationStats } from './components/career/ApplicationStats';
import { SkillGapAnalysis } from './components/career/SkillGapAnalysis';
import { JobRecommendations } from './components/career/JobRecommendations';
import { CareerCoachAI } from './components/career/CareerCoachAI';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyToJob,
  autoApply,
  applicationDrafts,
  approveApplicationPackageDraft,
  generateApplicationPackage,
  rejectApplicationPackageDraft,
  updateApplicationPackageDraft,

  clearToken,
  createJob,
  jobs,
  login,
  me,
  matchScore,
  profile,
  register,
  saveProfile,
  setToken,
  startInterview,
  answerInterview,
  trustScore,
  summary,
  toggleJobStatus,
  updateApplicationStatus,
  applications,
  uploadCv
} from './api';
import type { Application, ApplicationDraft, CandidateProfile, Job } from './types';


const emptyProfile: CandidateProfile = {

  userId: '',
  headline: '',
  location: '',
  summary: '',
  cvUrl: '',
  certificates: [],
  skills: [],
  education: [],
  experience: []
};

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function App() {
  const queryClient = useQueryClient();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<'candidate' | 'recruiter' | 'admin' | 'founder'>('candidate');
  const [tokenReady, setTokenReady] = useState(Boolean(localStorage.getItem('intelyhire-token')));

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
    enabled: tokenReady,
    retry: false
  });

  useEffect(() => {
    if (meQuery.isError) {
      clearToken();
      setTokenReady(false);
    }
  }, [meQuery.isError]);

  const summaryQuery = useQuery({ queryKey: ['summary'], queryFn: summary, enabled: Boolean(meQuery.data) });
  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: jobs, enabled: Boolean(meQuery.data) });
  const applicationsQuery = useQuery({ queryKey: ['applications'], queryFn: applications, enabled: Boolean(meQuery.data) });
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: profile, enabled: Boolean(meQuery.data && meQuery.data.user.role === 'candidate') });

  const authMutation = useMutation({
    mutationFn: async (payload: { mode: 'login' | 'register'; fullName: string; email: string; password: string; role: 'candidate' | 'recruiter' | 'admin' | 'founder' }) => {
      const roleForBackend = payload.role === 'founder' ? 'admin' : payload.role;
      return payload.mode === 'login'
        ? login({ email: payload.email, password: payload.password })
        : register({ fullName: payload.fullName, email: payload.email, password: payload.password, role: roleForBackend as 'candidate' | 'recruiter' | 'admin' | 'founder' });
    },
    onSuccess: async (data) => {
      setToken(data.token);
      setTokenReady(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['summary'] }),
        queryClient.invalidateQueries({ queryKey: ['jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      ]);
    }
  });

  const profileMutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  const cvMutation = useMutation({
    mutationFn: uploadCv,
    onSuccess: async ({ fileUrl }) => {
      const current = profileQuery.data?.profile ?? emptyProfile;
      await profileMutation.mutateAsync({ ...current, cvUrl: fileUrl });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  const jobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['summary'] })
      ]);
    }
  });

  const applicationStatusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: Application['status'] }) => updateApplicationStatus(applicationId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
        queryClient.invalidateQueries({ queryKey: ['summary'] })
      ]);
    }
  });

  const jobStatusMutation = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: 'open' | 'closed' }) => toggleJobStatus(jobId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
  });

  const applyMutation = useMutation({
    mutationFn: ({ jobId }: { jobId: string }) => applyToJob(jobId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
        queryClient.invalidateQueries({ queryKey: ['summary'] })
      ]);
    }
  });

  const currentUser = meQuery.data?.user;
  const roleTitle = !currentUser
    ? 'Recruitment platform MVP'
    : currentUser.role === 'candidate'
      ? 'Candidate Portal'
      : currentUser.role === 'recruiter'
        ? 'Recruiter Portal'
        : 'Admin Portal';

  if (meQuery.isLoading && tokenReady) {
    return <LoadingState />;
  }

  if (!currentUser) {
    return (
      <AuthPage
        initialRole={authRole}
        initialMode={authMode}
        loading={authMutation.isPending}
        error={authMutation.error instanceof Error ? authMutation.error.message : null}
      />
    );
  }



  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">IntelyHire</p>
          <h1>{roleTitle}</h1>
          <p className="muted">
            {currentUser.fullName} · {currentUser.email}
          </p>
        </div>

        <div className="stats-grid compact">
          <StatCard label="Users" value={summaryQuery.data?.counts.totalUsers ?? 0} />
          <StatCard label="Jobs" value={summaryQuery.data?.counts.totalJobs ?? 0} />
          <StatCard label="Applications" value={summaryQuery.data?.counts.totalApplications ?? 0} />
        </div>

        <button
          className="secondary-button"
          onClick={() => {
            clearToken();
            setTokenReady(false);
            queryClient.clear();
          }}
        >
          Sign out
        </button>
      </aside>

      <main className="content">
        <header className="hero-card">
          <div>
            <p className="eyebrow">Fast path to MVP</p>
            <h2>Auth, profiles, jobs, and application workflow are live.</h2>
            <p className="muted">The frontend is role-aware and the backend persists state locally so the team can iterate immediately.</p>
          </div>
          <div className="hero-pill-group">
            <span>React</span>
            <span>Express</span>
            <span>JSON store</span>
          </div>
        </header>

        <section className="stats-grid">
          <StatCard label="Open Jobs" value={summaryQuery.data?.counts.openJobs ?? 0} />
          <StatCard label="My Applications" value={summaryQuery.data?.counts.myApplications ?? 0} />
          <StatCard label="Recruiter Jobs" value={summaryQuery.data?.counts.recruiterJobs ?? 0} />
          <StatCard label="Recruiter Applications" value={summaryQuery.data?.counts.recruiterApplications ?? 0} />
        </section>

        <div className="panel-grid">
          {currentUser.role === 'candidate' ? (
            <CandidateWorkspace
              profile={profileQuery.data?.profile ?? emptyProfile}
              profileLoading={profileQuery.isLoading}
              jobs={jobsQuery.data?.jobs ?? []}
              applications={applicationsQuery.data?.applications ?? []}
              onSaveProfile={(value) => profileMutation.mutate(value)}
              onUploadCv={(file) => cvMutation.mutate(file)}
              onApply={(jobId) => applyMutation.mutate({ jobId })}
              onBusy={profileMutation.isPending || applyMutation.isPending || cvMutation.isPending}
            />
          ) : null}

          {currentUser.role === 'recruiter' ? (
            <RecruiterWorkspace
              jobs={jobsQuery.data?.jobs ?? []}
              applications={applicationsQuery.data?.applications ?? []}
              onCreateJob={(value) => jobMutation.mutate(value)}
              onToggleJob={(jobId, status) => jobStatusMutation.mutate({ jobId, status })}
              onUpdateApplication={(applicationId, status) => applicationStatusMutation.mutate({ applicationId, status })}
              pending={jobMutation.isPending || jobStatusMutation.isPending || applicationStatusMutation.isPending}
            />
          ) : null}

          {currentUser.role === 'admin' || currentUser.role === 'founder' ? <AdminWorkspace summaryData={summaryQuery.data} /> : null}
        </div>
      </main>
    </div>
  );
}

function LoadingState() {
  return <div className="loading-shell">Loading IntelyHire...</div>;
}

function AuthHero() {
  return (
    <section className="auth-hero">
      <p className="eyebrow">Recruitment operating system</p>
      <h1>Move from application to hire without losing the thread.</h1>
      <p>Candidate portal, recruiter portal, and admin visibility in one focused workspace.</p>
      <div className="hero-pill-group">
        <span>Role-based access</span>
        <span>Workflow tracking</span>
        <span>Dashboard-ready</span>
      </div>
    </section>
  );
}

function AuthCard({
  role,
  mode,
  onModeChange,
  onRoleChange,
  onSubmit,
  loading,
  error
}: {
  role: 'candidate' | 'recruiter' | 'admin' | 'founder';
  mode: 'login' | 'register';
  onRoleChange: (role: 'candidate' | 'recruiter' | 'admin' | 'founder') => void;
  onModeChange: (mode: 'login' | 'register') => void;
  onSubmit: (payload: { mode: 'login' | 'register'; fullName: string; email: string; password: string; role: 'candidate' | 'recruiter' | 'admin' | 'founder' }) => void;
  loading: boolean;
  error: string | null;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('recruiter@intelyhire.dev');
  const [password, setPassword] = useState('Passw0rd!');
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter' | 'admin' | 'founder'>('candidate');

  return (
    <section className="auth-card">
      <div className="auth-tabs">
        <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => onModeChange('login')} type="button">
          Login
        </button>
        <button className={mode === 'register' ? 'tab active' : 'tab'} onClick={() => onModeChange('register')} type="button">
          Register
        </button>
      </div>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ mode, fullName, email, password, role: selectedRole });
        }}
      >
        {mode === 'register' ? (
          <label>
            Full name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Taylor Candidate" />
          </label>
        ) : null}

        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
        </label>

        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••" />
        </label>

        {mode === 'register' ? (
          <label>
            Role
            <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as 'candidate' | 'recruiter' | 'admin' | 'founder')}>
              <option value="candidate">Candidate</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
              <option value="founder">Founder</option>
            </select>
          </label>
        ) : null}

        {error ? <div className="error-banner">{error}</div> : null}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <p className="microcopy">Seeded recruiter, admin, and founder accounts all use the same password for fast demo access.</p>
      </form>
    </section>
  );
}

function CandidateWorkspace({
  profile,
  jobs,
  applications,
  onSaveProfile,
  onUploadCv,
  onApply,
  onBusy,
  profileLoading
}: {
  profile: CandidateProfile;
  profileLoading: boolean;
  jobs: Job[];
  applications: Application[];
  onSaveProfile: (value: CandidateProfile) => void;
  onUploadCv: (file: File) => void;
  onApply: (jobId: string) => void;
  onBusy: boolean;
}): React.ReactElement {

  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);


  const draftsQuery = useQuery({
    queryKey: ['application-drafts'],
    queryFn: applicationDrafts,
    enabled: true
  });

  const drafts = draftsQuery.data?.drafts ?? [];
  const selectedDraft = drafts.find((d) => d.id === selectedDraftId) ?? null;

  const generateMutation = useMutation({
    mutationFn: ({ jobId }: { jobId: string }) => generateApplicationPackage(jobId),
    onSuccess: async () => {
      await draftsQuery.refetch();
    }
  });

  const updateDraftMutation = useMutation({
    mutationFn: ({ draftId, payload }: { draftId: string; payload: { emailSubject?: string; emailBody?: string; coverLetterText?: string } }) =>
      updateApplicationPackageDraft(draftId, payload),
    onSuccess: async () => {
      await draftsQuery.refetch();
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ draftId }: { draftId: string }) => approveApplicationPackageDraft(draftId),
    onSuccess: async () => {
      await draftsQuery.refetch();
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ draftId }: { draftId: string }) => rejectApplicationPackageDraft(draftId),
    onSuccess: async () => {
      await draftsQuery.refetch();
    }
  });
  const [draft, setDraft] = useState(profile);
  const appliedJobIds = new Set(applications.map((application) => application.jobId));

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Application Review Center</p>
            <h3>Generate a tailored package, preview it, then approve & send.</h3>
          </div>
        </div>

        <div className="stack">
          {jobs
            .filter((job) => job.status === 'open')
            .map((job) => {
              const alreadyApplied = appliedJobIds.has(job.id);
              const isDraftSelected = selectedDraft && selectedDraft.jobId === job.id;

              return (
                <article className="list-card" key={job.id}>
                  <div>
                    <h4>{job.title}</h4>
                    <p className="muted">
                      {job.company} · {job.location} · {job.employmentType}
                    </p>
                    <div className="pill-row">
                      {job.skills.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>

                    {alreadyApplied ? <p className="muted">Already applied to this job.</p> : null}
                  </div>

                  <div className="inline-actions">
                    <span className={job.status === 'open' ? 'status open' : 'status closed'}>{job.status}</span>
                    <button
                      className="primary-button"
                      disabled={alreadyApplied || onBusy || draftsQuery.isFetching}
                      onClick={async () => {
                        setSelectedDraftId(null);
                        const result = await generateMutation.mutateAsync({ jobId: job.id });
                        if (result && 'draft' in result) {
                          // backend may return draft in different shapes; keep conservative.
                        }
                        await draftsQuery.refetch();
                        const refreshedDrafts = draftsQuery.data?.drafts ?? [];
                        const draftForJob = refreshedDrafts.find((d) => d.jobId === job.id);
                        if (draftForJob) setSelectedDraftId(draftForJob.id);
                      }}
                      type="button"
                    >
                      Generate package
                    </button>
                  </div>

                  {selectedDraft && selectedDraft.jobId === job.id ? (
                    <div style={{ marginTop: 12 }}>
                      <div className="muted" style={{ marginBottom: 8 }}>
                        Match score: <strong>{selectedDraft.matchScore}</strong> · Trust score: <strong>{selectedDraft.trustScore}</strong>
                      </div>

                      <label style={{ width: '100%', display: 'block' }}>
                        Email subject
                        <input
                          value={selectedDraft.emailSubject}
                          onChange={(e) => updateDraftMutation.mutate({ draftId: selectedDraft.id, payload: { emailSubject: e.target.value } })}
                        />
                      </label>

                      <label style={{ width: '100%', display: 'block', marginTop: 8 }}>
                        Email body
                        <textarea
                          value={selectedDraft.emailBody}
                          rows={6}
                          onChange={(e) => updateDraftMutation.mutate({ draftId: selectedDraft.id, payload: { emailBody: e.target.value } })}
                        />
                      </label>

                      <label style={{ width: '100%', display: 'block', marginTop: 8 }}>
                        Cover letter
                        <textarea
                          value={selectedDraft.coverLetterText}
                          rows={6}
                          onChange={(e) => updateDraftMutation.mutate({ draftId: selectedDraft.id, payload: { coverLetterText: e.target.value } })}
                        />
                      </label>

                      <div className="inline-actions" style={{ marginTop: 12 }}>
                        <button
                          className="primary-button"
                          disabled={approveMutation.isPending || onBusy}
                          onClick={async () => {
                            await approveMutation.mutateAsync({ draftId: selectedDraft.id });
                            setSelectedDraftId(null);
                          }}
                          type="button"
                        >
                          Approve & Send
                        </button>
                        <button
                          className="secondary-button"
                          disabled={rejectMutation.isPending || onBusy}
                          onClick={async () => {
                            await rejectMutation.mutateAsync({ draftId: selectedDraft.id });
                            setSelectedDraftId(null);
                          }}
                          type="button"
                          style={{ marginLeft: 8 }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Candidate profile</p>
            <h3>Build the profile the recruiter sees first.</h3>
          </div>
          <button className="secondary-button" onClick={() => onSaveProfile(draft)} disabled={onBusy || profileLoading} type="button">
            Save profile
          </button>
        </div>
        <div className="form-grid two-col">
          <Field label="Headline" value={draft.headline} onChange={(value) => setDraft((current) => ({ ...current, headline: value }))} />
          <Field label="Location" value={draft.location} onChange={(value) => setDraft((current) => ({ ...current, location: value }))} />
          <Field label="CV URL" value={draft.cvUrl} onChange={(value) => setDraft((current) => ({ ...current, cvUrl: value }))} />
          <Field label="Skills" value={draft.skills.join(', ')} onChange={(value) => setDraft((current) => ({ ...current, skills: splitList(value) }))} />
          <Field label="Certificates" value={draft.certificates.join(', ')} onChange={(value) => setDraft((current) => ({ ...current, certificates: splitList(value) }))} />
        </div>
        <label>
          Summary
          <textarea value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} rows={5} />
        </label>
        <div className="panel-heading">
          <label style={{ width: '100%' }}>
            Upload CV
            <input
              type="file"
              accept="application/pdf,.doc,.docx"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUploadCv(file);
              }}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Job board</p>
            <h3>Find a role and apply.</h3>
          </div>
        </div>
        <div className="stack">
          {jobs.map((job) => (
            <article className="list-card" key={job.id}>
              <div>
                <h4>{job.title}</h4>
                <p className="muted">
                  {job.company} · {job.location} · {job.employmentType}
                </p>
                <p>{job.description}</p>
                <div className="pill-row">
                  {job.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </div>
              <div className="inline-actions">
                <span className={job.status === 'open' ? 'status open' : 'status closed'}>{job.status}</span>
                <button className="primary-button" disabled={job.status !== 'open' || appliedJobIds.has(job.id) || onBusy} onClick={() => onApply(job.id)} type="button">
                  {appliedJobIds.has(job.id) ? 'Applied' : 'Apply now'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Applications</p>
            <h3>Status tracking</h3>
          </div>
        </div>
        <div className="stack">
          {applications.map((application) => (
            <article className="list-card" key={application.id}>
              <div>
                <h4>{application.job?.title ?? 'Unknown job'}</h4>
                <p className="muted">{application.job?.company ?? 'IntelyHire'}</p>
                <p>{application.coverLetter || 'No cover letter yet.'}</p>
              </div>
              <span className={`status ${application.status}`}>{application.status}</span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function RecruiterWorkspace({
  jobs,
  applications,
  onCreateJob,
  onToggleJob,
  onUpdateApplication,
  pending
}: {
  jobs: Job[];
  applications: Application[];
  onCreateJob: (value: { title: string; company: string; location: string; employmentType: string; description: string; skills: string[] }) => void;
  onToggleJob: (jobId: string, status: 'open' | 'closed') => void;
  onUpdateApplication: (applicationId: string, status: Application['status']) => void;
  pending: boolean;
}): React.ReactElement {

  const [jobDraft, setJobDraft] = useState({
    title: 'Frontend Engineer',
    company: 'IntelyHire',
    location: 'Remote',
    employmentType: 'Full-time',
    description: 'Design the recruitment UI, portals, and workflow views.',
    skills: 'React, TypeScript, Product Thinking'
  });

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Job management</p>
            <h3>Create and control open roles.</h3>
          </div>
          <button className="secondary-button" disabled={pending} onClick={() => onCreateJob({ ...jobDraft, skills: splitList(jobDraft.skills) })} type="button">
            Publish job
          </button>
        </div>
        <div className="form-grid two-col">
          <Field label="Title" value={jobDraft.title} onChange={(value) => setJobDraft((current) => ({ ...current, title: value }))} />
          <Field label="Company" value={jobDraft.company} onChange={(value) => setJobDraft((current) => ({ ...current, company: value }))} />
          <Field label="Location" value={jobDraft.location} onChange={(value) => setJobDraft((current) => ({ ...current, location: value }))} />
          <Field label="Employment type" value={jobDraft.employmentType} onChange={(value) => setJobDraft((current) => ({ ...current, employmentType: value }))} />
          <Field label="Skills" value={jobDraft.skills} onChange={(value) => setJobDraft((current) => ({ ...current, skills: value }))} />
        </div>
        <label>
          Description
          <textarea value={jobDraft.description} onChange={(event) => setJobDraft((current) => ({ ...current, description: event.target.value }))} rows={5} />
        </label>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Recruiter dashboard</p>
            <h3>Active hiring pipeline.</h3>
          </div>
        </div>
        <div className="stack">
          {jobs.map((job) => (
            <article className="list-card" key={job.id}>
              <div>
                <h4>{job.title}</h4>
                <p className="muted">
                  {job.company} · {job.location}
                </p>
                <p>{job.description}</p>
                <div className="pill-row">
                  {job.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </div>
              <div className="inline-actions">
                <span className={job.status === 'open' ? 'status open' : 'status closed'}>{job.status}</span>
                <button className="secondary-button" onClick={() => onToggleJob(job.id, job.status === 'open' ? 'closed' : 'open')} disabled={pending} type="button">
                  {job.status === 'open' ? 'Close' : 'Reopen'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Applications</p>
            <h3>Move candidates through the workflow.</h3>
          </div>
        </div>
        <div className="stack">
          {applications.map((application) => (
            <article className="list-card" key={application.id}>
              <div>
                <h4>{application.job?.title ?? 'Unknown job'}</h4>
                <p className="muted">
                  {application.candidate?.fullName ?? 'Candidate'} · {application.candidate?.email ?? 'n/a'}
                </p>
                <p>{application.coverLetter || 'No cover letter provided.'}</p>
                <div className="pill-row">
                  <button className="secondary-button" onClick={async () => alert(JSON.stringify(await matchScore(application.jobId), null, 2))} type="button">
                    AI match
                  </button>
                </div>
              </div>
              <div className="inline-actions">
                <span className={`status ${application.status}`}>{application.status}</span>
                <select value={application.status} onChange={(event) => onUpdateApplication(application.id, event.target.value as Application['status'])} disabled={pending}>
                  <option value="applied">Applied</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function AdminWorkspace({ summaryData }: { summaryData?: { counts: { totalUsers: number; totalJobs: number; totalApplications: number } } }) {
  return (
    <section className="panel admin-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Admin visibility</p>
          <h3>Growth, activity, and system status.</h3>
        </div>
      </div>
      <div className="stats-grid compact">
        <StatCard label="Revenue" value="Coming next" />
        <StatCard label="User activity" value={summaryData?.counts.totalUsers ?? 0} />
        <StatCard label="Open jobs" value={summaryData?.counts.totalJobs ?? 0} />
        <StatCard label="Applications" value={summaryData?.counts.totalApplications ?? 0} />
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}