import bcrypt from 'bcryptjs';
import cors from 'cors';
import crypto from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { z } from 'zod';
import { createApplicationHistoryEntry, createEmptyCandidateProfile, createEmailLog, loadState, saveState, uploadsDir } from './store.js';
import type { Application, ApplicationDraft, ApplicationDraftStatus, EmailAccount, Job, RequestUser, Role } from './types.js';

const app = express();

import { registerReviewApi } from './reviewApi.js';

registerReviewApi(app);


const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? 'intelyhire-dev-secret';
const upload = multer({ dest: uploadsDir });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsDir));

const authSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['candidate', 'recruiter']).optional()
});

const jobSchema = z.object({
  title: z.string().min(2),
  company: z.string().min(2),
  location: z.string().min(2),
  employmentType: z.string().min(2),
  description: z.string().min(10),
  skills: z.array(z.string().min(1)).default([])
});

const profileSchema = z.object({
  headline: z.string().default(''),
  location: z.string().default(''),
  summary: z.string().default(''),
  cvUrl: z.string().default(''),
  skills: z.array(z.string()).default([]),
  certificates: z.array(z.string()).default([]),
  education: z.array(z.object({ id: z.string(), school: z.string(), degree: z.string(), year: z.string() })).default([]),
  experience: z.array(z.object({ id: z.string(), title: z.string(), company: z.string(), years: z.string(), description: z.string() })).default([])
});

const emailAccountSchema = z.object({
  provider: z.enum(['google', 'microsoft', 'smtp']),
  emailAddress: z.string().email(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional()
});

function signToken(user: RequestUser): string {
  return jwt.sign(user, jwtSecret, { expiresIn: '12h' });
}

function getToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length);
}

function toPublicUser(user: { id: string; email: string; role: Role; fullName: string; verified: boolean }) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    verified: user.verified
  };
}

function canManageJobs(role: Role): boolean {
  return role === 'recruiter' || role === 'admin' || role === 'founder';
}

function canManageApplications(role: Role): boolean {
  return role === 'recruiter' || role === 'admin' || role === 'founder';
}

function resolveEmailProvider(state: Awaited<ReturnType<typeof loadState>>, userId: string): EmailAccount['provider'] | 'system' {
  return state.emailAccounts.find((account) => account.userId === userId)?.provider ?? 'system';
}

function buildApplicationEmailBody(jobTitle: string, status: Application['status'], notes: string): string {
  const noteLine = notes ? `\n\nNotes: ${notes}` : '';
  return `Your application for ${jobTitle} is now marked as ${status}.${noteLine}`;
}

function buildApplicationSubject(jobTitle: string, status: Application['status']): string {
  return `IntelyHire update: ${jobTitle} status is ${status}`;
}

function queueEmailNotification(state: Awaited<ReturnType<typeof loadState>>, entry: {
  applicationId?: string | null;
  recipientUserId?: string | null;
  recipientEmail: string;
  provider: EmailAccount['provider'] | 'system';
  subject: string;
  body: string;
}) {
  state.emailLogs.unshift(createEmailLog({
    applicationId: entry.applicationId ?? null,
    recipientUserId: entry.recipientUserId ?? null,
    recipientEmail: entry.recipientEmail,
    provider: entry.provider,
    direction: 'outbound',
    subject: entry.subject,
    body: entry.body,
    status: 'queued'
  }));
}

async function authUser(req: express.Request): Promise<RequestUser | null> {
  const token = getToken(req.header('authorization'));
  if (!token) return null;

  try {
    return jwt.verify(token, jwtSecret) as RequestUser;
  } catch {
    return null;
  }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'intelyhire-api' });
});

app.post('/auth/register', async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const state = await loadState();
  const existing = state.users.find((user) => user.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const user = {
    id: crypto.randomUUID(),
    fullName: parsed.data.fullName ?? parsed.data.email.split('@')[0],
    email: parsed.data.email.toLowerCase(),
    passwordHash: await bcrypt.hash(parsed.data.password, 10),
    role: parsed.data.role ?? 'candidate',
    verified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.users.push(user);
  state.candidateProfiles.push(createEmptyCandidateProfile(user.id));
  await saveState(state);

  const token = signToken({ id: user.id, email: user.email, role: user.role, fullName: user.fullName });
  return res.status(201).json({ token, user: toPublicUser(user) });
});

app.post('/auth/login', async (req, res) => {
  const parsed = authSchema.omit({ fullName: true, role: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const state = await loadState();
  const user = state.users.find((entry) => entry.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordOk = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role, fullName: user.fullName });
  return res.json({ token, user: toPublicUser(user) });
});

app.get('/auth/me', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const state = await loadState();
  const user = state.users.find((entry) => entry.id === current.id);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.json({ user: toPublicUser(user) });
});

app.get('/dashboard/summary', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const state = await loadState();
  const candidateApplications = state.applications.filter((application) => application.candidateId === current.id);
  const recruiterJobs = state.jobs.filter((job) => job.createdBy === current.id);
  const recruiterApplications = state.applications.filter((application) => recruiterJobs.some((job) => job.id === application.jobId));

  const statusCounts = candidateApplications.reduce<Record<string, number>>((accumulator, application) => {
    accumulator[application.status] = (accumulator[application.status] ?? 0) + 1;
    return accumulator;
  }, {});

  res.json({
    userRole: current.role,
    counts: {
      totalUsers: state.users.length,
      totalJobs: state.jobs.length,
      totalApplications: state.applications.length,
      openJobs: state.jobs.filter((job) => job.status === 'open').length,
      myApplications: candidateApplications.length,
      recruiterJobs: recruiterJobs.length,
      recruiterApplications: recruiterApplications.length
    },
    statusCounts,
    recentApplications: current.role === 'candidate' ? candidateApplications.slice(-5).reverse() : state.applications.slice(-5).reverse()
  });
});

app.get('/candidate/profile', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const state = await loadState();
  const profile = state.candidateProfiles.find((entry) => entry.userId === current.id) ?? createEmptyCandidateProfile(current.id);
  return res.json({ profile });
});

app.put('/candidate/profile', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const state = await loadState();
  const profileIndex = state.candidateProfiles.findIndex((entry) => entry.userId === current.id);
  const profile = { userId: current.id, ...parsed.data };

  if (profileIndex >= 0) {
    state.candidateProfiles[profileIndex] = profile;
  } else {
    state.candidateProfiles.push(profile);
  }

  await saveState(state);
  return res.json({ profile });
});

app.post('/candidate/profile/cv', upload.single('file'), async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Missing CV file' });
  }

  const cvUrl = `/uploads/${req.file.filename}`;
  const state = await loadState();
  const profileIndex = state.candidateProfiles.findIndex((entry) => entry.userId === current.id);
  const profile = profileIndex >= 0 ? state.candidateProfiles[profileIndex] : createEmptyCandidateProfile(current.id);
  profile.cvUrl = cvUrl;

  if (profileIndex >= 0) {
    state.candidateProfiles[profileIndex] = profile;
  } else {
    state.candidateProfiles.push(profile);
  }

  await saveState(state);
  return res.status(201).json({ cvUrl, originalName: req.file.originalname });
});

app.get('/email/accounts', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const state = await loadState();
  const accounts = state.emailAccounts.filter((account) => account.userId === current.id);
  res.json({ accounts });
});

app.post('/email/accounts/connect', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = emailAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const state = await loadState();
  const now = new Date().toISOString();
  const existingIndex = state.emailAccounts.findIndex((account) => account.userId === current.id && account.provider === parsed.data.provider && account.emailAddress.toLowerCase() === parsed.data.emailAddress.toLowerCase());
  const account: EmailAccount = {
    id: existingIndex >= 0 ? state.emailAccounts[existingIndex].id : crypto.randomUUID(),
    userId: current.id,
    provider: parsed.data.provider,
    emailAddress: parsed.data.emailAddress.toLowerCase(),
    accessToken: parsed.data.accessToken ?? null,
    refreshToken: parsed.data.refreshToken ?? null,
    createdAt: existingIndex >= 0 ? state.emailAccounts[existingIndex].createdAt : now,
    updatedAt: now
  };

  if (existingIndex >= 0) {
    state.emailAccounts[existingIndex] = account;
  } else {
    state.emailAccounts.unshift(account);
  }

  await saveState(state);
  return res.status(existingIndex >= 0 ? 200 : 201).json({ account });
});

app.get('/email/logs', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const state = await loadState();
  const logs = current.role === 'admin' || current.role === 'founder'
    ? state.emailLogs
    : current.role === 'recruiter'
      ? state.emailLogs.filter((log) => log.recipientUserId === current.id || state.jobs.some((job) => job.createdBy === current.id && log.applicationId && state.applications.some((application) => application.id === log.applicationId && application.jobId === job.id)))
      : state.emailLogs.filter((log) => log.recipientUserId === current.id);

  res.json({ logs });
});

app.post('/email/accounts/:accountId/test', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const state = await loadState();
  const account = state.emailAccounts.find((entry) => entry.id === req.params.accountId && entry.userId === current.id);
  if (!account) {
    return res.status(404).json({ error: 'Email account not found' });
  }

  queueEmailNotification(state, {
    recipientUserId: current.id,
    recipientEmail: account.emailAddress,
    provider: account.provider,
    subject: 'IntelyHire connection test',
    body: 'This is a test notification from IntelyHire.'
  });

  await saveState(state);
  return res.status(201).json({ ok: true });
});

app.get('/jobs', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const state = await loadState();
  const jobs = state.jobs.map((job) => ({
    ...job,
    applicantCount: state.applications.filter((application) => application.jobId === job.id).length,
    // Defaults for new MVP fields
    verified: job.verified ?? false,
    jobTrustScore: job.jobTrustScore ?? 0
  }));
  res.json({ jobs });
});


app.post('/jobs', async (req, res) => {
  const current = await authUser(req);
  if (!current || !canManageJobs(current.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const parsed = jobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const state = await loadState();
  const job: Job = {
    id: crypto.randomUUID(),
    ...parsed.data,
    status: 'open',
    createdBy: current.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.jobs.unshift(job);
  await saveState(state);
  res.status(201).json({ job });
});

app.patch('/jobs/:jobId/status', async (req, res) => {
  const current = await authUser(req);
  if (!current || !canManageJobs(current.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const statusSchema = z.object({ status: z.enum(['open', 'closed']) });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const state = await loadState();
  const job = state.jobs.find((entry) => entry.id === req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  job.status = parsed.data.status;
  job.updatedAt = new Date().toISOString();
  await saveState(state);
  res.json({ job });
});

app.post('/jobs/:jobId/apply', async (req, res) => {
  const current = await authUser(req);
  if (!current || current.role !== 'candidate') {
    return res.status(403).json({ error: 'Only candidates can apply' });
  }

  const state = await loadState();
  const job = state.jobs.find((entry) => entry.id === req.params.jobId && entry.status === 'open');
  if (!job) {
    return res.status(404).json({ error: 'Job not found or closed' });
  }

  const existing = state.applications.find((application) => application.jobId === job.id && application.candidateId === current.id);
  if (existing) {
    return res.json({ application: existing });
  }

  const application: Application = {
    id: crypto.randomUUID(),
    jobId: job.id,
    candidateId: current.id,
    status: 'applied',
    coverLetter: typeof req.body?.coverLetter === 'string' ? req.body.coverLetter : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [createApplicationHistoryEntry('applied', current.id, 'Candidate submitted application')]
  };

  state.applications.unshift(application);

  const recruiter = state.users.find((user) => user.id === job.createdBy);
  if (recruiter) {
    const provider = resolveEmailProvider(state, recruiter.id);
    queueEmailNotification(state, {
      applicationId: application.id,
      recipientUserId: recruiter.id,
      recipientEmail: recruiter.email,
      provider,
      subject: `New application for ${job.title}`,
      body: `A new candidate applied for ${job.title} at ${job.company}.`
    });
  }

  await saveState(state);
  res.status(201).json({ application });
});

app.get('/applications', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const state = await loadState();
  const visibleApplications = current.role === 'candidate'
    ? state.applications.filter((application) => application.candidateId === current.id)
    : canManageApplications(current.role)
      ? state.applications
      : [];

  const applications = visibleApplications.map((application) => ({
    ...application,
    job: state.jobs.find((job) => job.id === application.jobId) ?? null,
    candidate: state.users.find((user) => user.id === application.candidateId) ?? null
  }));

  res.json({ applications });
});

app.patch('/applications/:applicationId/status', async (req, res) => {
  const current = await authUser(req);
  if (!current || !canManageApplications(current.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const statusSchema = z.object({
    status: z.enum(['applied', 'reviewing', 'shortlisted', 'interview', 'offer', 'hired', 'rejected']),
    notes: z.string().default('')
  });

  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const state = await loadState();
  const application = state.applications.find((entry) => entry.id === req.params.applicationId);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const job = state.jobs.find((entry) => entry.id === application.jobId);
  const candidate = state.users.find((entry) => entry.id === application.candidateId);

  application.status = parsed.data.status;
  application.updatedAt = new Date().toISOString();
  application.history.unshift(createApplicationHistoryEntry(parsed.data.status, current.id, parsed.data.notes));

  if (candidate && job) {
    queueEmailNotification(state, {
      applicationId: application.id,
      recipientUserId: candidate.id,
      recipientEmail: candidate.email,
      provider: resolveEmailProvider(state, candidate.id),
      subject: buildApplicationSubject(job.title, parsed.data.status),
      body: buildApplicationEmailBody(job.title, parsed.data.status, parsed.data.notes)
    });
  }

  await saveState(state);
  res.json({ application });
});

app.post('/ai/match', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Frontend may provide `jobId` either in querystring or in JSON body.
  const jobIdFromQuery = typeof req.query.jobId === 'string' ? req.query.jobId : undefined;
  const payload = z.object({
    jobId: z.string(),
    candidateId: z.string().optional()
  }).safeParse({
    jobId: jobIdFromQuery ?? req.body?.jobId,
    candidateId: req.body?.candidateId
  });

  if (!payload.success) {
    return res.status(400).json({ error: payload.error.flatten() });
  }

  const state = await loadState();
  const job = state.jobs.find((entry) => entry.id === payload.data.jobId);
  const candidateId = payload.data.candidateId ?? current.id;
  const profile = state.candidateProfiles.find((entry) => entry.userId === candidateId);
  if (!job || !profile) {
    return res.status(404).json({ error: 'Matching inputs not found' });
  }

  const profileText = `${profile.headline} ${profile.summary} ${profile.skills.join(' ')}`.toLowerCase();
  const jobText = `${job.title} ${job.description} ${job.company} ${job.skills.join(' ')}`.toLowerCase();

  const skills = new Set(profile.skills.map((skill) => skill.toLowerCase()));
  const requiredSkills = job.skills.map((skill) => skill.toLowerCase());
  const matchingSkills = requiredSkills.filter((skill) => skills.has(skill));
  const missingSkills = requiredSkills.filter((skill) => !skills.has(skill));

  // Heuristic: keyword overlap between job and candidate profile (headline/summary/skills)
  const jobKeywords = Array.from(new Set(jobText.split(/[^a-z0-9+.-]+/g).filter((t) => t.length >= 3)));
  const keywordHits = jobKeywords.filter((k) => profileText.includes(k));

  const locationHit = profile.location.trim() && job.location.trim() ? profile.location.trim().toLowerCase() === job.location.trim().toLowerCase() : false;

  const skillComponent = requiredSkills.length === 0 ? 0 : matchingSkills.length / requiredSkills.length;
  const keywordComponent = jobKeywords.length === 0 ? 0 : keywordHits.length / jobKeywords.length;

  const scoreRaw = 100 * (0.65 * skillComponent + 0.30 * keywordComponent + 0.05 * (locationHit ? 1 : 0));
  const score = Math.max(0, Math.min(100, Math.round(scoreRaw)));

  const reasons: string[] = [];
  if (requiredSkills.length > 0) {
    reasons.push(`${matchingSkills.length}/${requiredSkills.length} skills match`);
    if (missingSkills.length > 0) reasons.push(`Missing: ${missingSkills.slice(0, 5).join(', ')}`);
  } else {
    reasons.push('No required skills listed for this job');
  }
  reasons.push(`${keywordHits.length} keyword hits from profile`);
  if (locationHit) reasons.push('Location matches');

  res.json({
    candidate: candidateId,
    job: job.title,
    score,
    missing_skills: missingSkills,
    reasons,
    recommendation: score >= 80 ? 'Strong Match' : score >= 60 ? 'Potential Match' : 'Needs Review'
  });
});

app.post('/ai/career-intelligence', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = z.object({
    candidateId: z.string().optional()
  }).safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: payload.error.flatten() });
  }

  const state = await loadState();
  const candidateId = payload.data.candidateId ?? current.id;
  const profile = state.candidateProfiles.find((entry) => entry.userId === candidateId);

  if (!profile) {
    return res.status(404).json({ error: 'Candidate profile not found' });
  }

  // MVP heuristic mapping of inputs to the required formula buckets.
  // We don't have explicit structured project/experience/education years, so we approximate:
  // - Experience bucket -> number of experience entries (0..N)
  // - Skills bucket -> number of skills (0..N)
  // - Projects bucket -> number of experience entries with descriptions (approx projects)
  // - Education bucket -> number of education entries
  // - Certifications bucket -> number of certificates

  const experienceCount = profile.experience.length;
  const skillsCount = profile.skills.length;
  const projectCountApprox = profile.experience.filter((e) => e.description?.trim().length > 0).length;
  const educationCount = profile.education.length;
  const certCount = profile.certificates.length;

  const scale0to100 = (value: number, cap: number) => {
    if (cap <= 0) return 0;
    const v = Math.max(0, Math.min(cap, value));
    return Math.round((v / cap) * 100);
  };


  const experienceScore = scale0to100(experienceCount, 5); // 0-5+ -> 0..100
  const skillsScore = scale0to100(skillsCount, 20); // 0-20+ -> 0..100
  const projectsScore = scale0to100(projectCountApprox, 5);
  const educationScore = scale0to100(educationCount, 2);
  const certificationsScore = scale0to100(certCount, 3);

  const careerScoreRaw =
    0.30 * experienceScore +
    0.30 * skillsScore +
    0.20 * projectsScore +
    0.10 * educationScore +
    0.10 * certificationsScore;

  const careerScore = Math.max(0, Math.min(100, Math.round(careerScoreRaw)));

  // Sub-scores (simple splits for MVP)
  const technicalScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(0.60 * skillsScore + 0.25 * projectsScore + 0.15 * experienceScore)
    )
  );
  const communicationScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(0.45 * (profile.summary.trim().length > 0 ? 100 : 0) + 0.35 * (profile.headline.trim().length > 0 ? 100 : 0) + 0.20 * (profile.cvUrl ? 100 : 0))
    )
  );

  const marketReadiness = careerScore >= 81 ? 'High' : careerScore >= 61 ? 'Medium' : 'Low';

  const tier = careerScore <= 40 ? 'Beginner' : careerScore <= 60 ? 'Emerging' : careerScore <= 80 ? 'Competitive' : 'Highly Employable';

  res.json({
    candidate: candidateId,
    output: {
      careerScore,
      technicalScore,
      communicationScore,
      marketReadiness,
      tier,
      formula: {
        experience: { weight: 0.30, score: experienceScore },
        skills: { weight: 0.30, score: skillsScore },
        projects: { weight: 0.20, score: projectsScore },
        education: { weight: 0.10, score: educationScore },
        certifications: { weight: 0.10, score: certificationsScore }
      }
    }
  });
});

app.post('/ai/trust', async (req, res) => {
  // Backwards-compatible alias: trust_score now equals careerScore for the MVP.
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = z.object({
    candidateId: z.string().optional(),
    jobId: z.string().optional(),
    applicationId: z.string().optional()
  }).safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: payload.error.flatten() });
  }

  const state = await loadState();
  const candidateId = payload.data.candidateId ?? current.id;
  const profile = state.candidateProfiles.find((entry) => entry.userId === candidateId);

  if (!profile) {
    return res.status(404).json({ error: 'Candidate profile not found' });
  }

  const experienceCount = profile.experience.length;
  const skillsCount = profile.skills.length;
  const projectCountApprox = profile.experience.filter((e) => e.description?.trim().length > 0).length;
  const educationCount = profile.education.length;
  const certCount = profile.certificates.length;

  const scale0to100 = (value: number, cap: number) => {
    const v = Math.max(0, Math.min(cap, value));
    return Math.round((v / cap) * 100);
  };

  const experienceScore = scale0to100(experienceCount, 5);
  const skillsScore = scale0to100(skillsCount, 20);
  const projectsScore = scale0to100(projectCountApprox, 5);
  const educationScore = scale0to100(educationCount, 2);
  const certificationsScore = scale0to100(certCount, 3);

  const careerScoreRaw =
    0.30 * experienceScore +
    0.30 * skillsScore +
    0.20 * projectsScore +
    0.10 * educationScore +
    0.10 * certificationsScore;

  const trustScore = Math.max(0, Math.min(100, Math.round(careerScoreRaw)));
  const level = trustScore >= 81 ? 'High' : trustScore >= 61 ? 'Medium' : 'Low';

  const risks: string[] = [];
  if (!profile.cvUrl) risks.push('CV missing');
  if (!profile.headline.trim()) risks.push('Headline missing');
  if (!profile.summary.trim()) risks.push('Summary missing');
  if (skillsCount === 0) risks.push('No skills listed');

  res.json({
    candidate: candidateId,
    job: null,
    trust_score: trustScore,
    level,
    risks
  });
});


app.post('/ai/interview/start', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = z.object({ applicationId: z.string() }).safeParse(req.body);
  if (!payload.success) {
    return res.status(400).json({ error: payload.error.flatten() });
  }

  const state = await loadState();
  const application = state.applications.find((a) => a.id === payload.data.applicationId);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const job = state.jobs.find((j) => j.id === application.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found for application' });
  }

  const questionPrompts = [
    `Tell us about a project from your experience that best matches ${job.title}.`,
    `Describe a time you handled ambiguity while delivering results in a team setting.`,
    `How do you evaluate trade-offs when selecting tools/architecture for a feature?`,
    `What does success look like in the first 30 days for this role?`
  ];

  const session = {
    id: crypto.randomUUID(),
    applicationId: application.id,
    interviewerUserId: current.id,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: questionPrompts.map((prompt) => ({ id: crypto.randomUUID(), prompt, maxScore: 10 })),
    answers: [] as Array<{ id: string; questionId: string; answer: string; score: number; feedback: string; createdAt: string }>
  };

  state.aiInterviewSessions.unshift(session);
  await saveState(state);

  res.status(201).json({ sessionId: session.id, questions: session.questions });
});

app.post('/ai/interview/answer', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = z.object({
    sessionId: z.string(),
    questionId: z.string(),
    answer: z.string().min(1)
  }).safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({ error: payload.error.flatten() });
  }

  const state = await loadState();
  const session = state.aiInterviewSessions.find((s) => s.id === payload.data.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Interview session not found' });
  }

  if (session.status !== 'active') {
    return res.status(400).json({ error: 'Interview session is not active' });
  }

  const question = session.questions.find((q) => q.id === payload.data.questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const answerLower = payload.data.answer.toLowerCase();
  const keywordSeeds = ['impact', 'result', 'challenge', 'learn', 'trade-off', 'architecture', 'communication', 'collaboration', 'metrics'];
  const hits = keywordSeeds.filter((k) => answerLower.includes(k));
  const score = Math.max(1, Math.min(question.maxScore, Math.round(1 + (hits.length / keywordSeeds.length) * (question.maxScore - 1))));

  const feedbackParts: string[] = [];
  if (hits.length >= 3) feedbackParts.push('Strong structure and relevant keywords');
  else if (hits.length >= 1) feedbackParts.push('Good start—add more concrete details and outcomes');
  else feedbackParts.push('Consider adding context, your approach, and measurable results');
  if (!answerLower.includes('i ') && !answerLower.includes('we ')) feedbackParts.push('Make your role explicit (I/We)');

  session.answers.unshift({
    id: crypto.randomUUID(),
    questionId: question.id,
    answer: payload.data.answer,
    score,
    feedback: feedbackParts.join('. '),
    createdAt: new Date().toISOString()
  });
  session.updatedAt = new Date().toISOString();

  const answeredQuestionIds = new Set(session.answers.map((a) => a.questionId));
  if (answeredQuestionIds.size >= session.questions.length) {
    session.status = 'completed';
    session.updatedAt = new Date().toISOString();
  }

  await saveState(state);

  res.json({ score, feedback: feedbackParts.join('. '), sessionStatus: session.status });
});

app.post('/ai/auto-apply/run', async (req, res) => {
  const current = await authUser(req);
  if (!current) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (current.role !== 'candidate') {
    return res.status(403).json({ error: 'Only candidates can auto-apply' });
  }

  const payload = z.object({ jobIds: z.array(z.string()).optional(), limit: z.number().int().min(1).max(50).optional() }).safeParse(req.body);
  if (!payload.success) {
    return res.status(400).json({ error: payload.error.flatten() });
  }

  const state = await loadState();
  const profile = state.candidateProfiles.find((p) => p.userId === current.id) ?? createEmptyCandidateProfile(current.id);

  const openJobs = state.jobs.filter((j) => j.status === 'open');
  const candidateJobIds = new Set(state.applications.filter((a) => a.candidateId === current.id).map((a) => a.jobId));

  let targetJobs = payload.data.jobIds ? openJobs.filter((j) => payload.data.jobIds!.includes(j.id)) : openJobs;
  targetJobs = targetJobs.filter((j) => !candidateJobIds.has(j.id));

  if (payload.data.limit) {
    targetJobs = targetJobs.slice(0, payload.data.limit);
  }

  const applied: Application[] = [];
  const coverLetterBase = profile.summary?.trim()
    ? `Based on my background: ${profile.summary.trim().slice(0, 220)}...`
    : `I’m excited to apply and bring strong motivation and learning velocity to the team.`;

  for (const job of targetJobs) {
    const application: Application = {
      id: crypto.randomUUID(),
      jobId: job.id,
      candidateId: current.id,
      status: 'applied',
      coverLetter: `Hi ${job.company} team—\n\n${coverLetterBase}\n\nRelevant skills: ${profile.skills.slice(0, 8).join(', ') || '—'}.\n\nThanks for your time.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [createApplicationHistoryEntry('applied', current.id, 'AI auto-apply submitted application')]
    };

    state.applications.unshift(application);
    applied.push(application);

    const recruiter = state.users.find((user) => user.id === job.createdBy);
    if (recruiter) {
      const provider = resolveEmailProvider(state, recruiter.id);
      queueEmailNotification(state, {
        applicationId: application.id,
        recipientUserId: recruiter.id,
        recipientEmail: recruiter.email,
        provider,
        subject: `AI Auto-Apply: New application for ${job.title}`,
        body: `An AI agent submitted an application for ${job.title} at ${job.company}.`
      });
    }
  }

  await saveState(state);

  res.status(201).json({ appliedCount: applied.length, appliedApplications: applied });
});


app.listen(port, () => {
  console.log(`IntelyHire API running on http://localhost:${port}`);
});