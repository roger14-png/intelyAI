import crypto from 'node:crypto';
import type express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import type { Application, ApplicationStatus, Job, JobStatus, RequestUser } from '../../types.js';
import { createApplicationHistoryEntry, loadState, saveState } from '../../store.js';

function getToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length);
}

function authUser(req: express.Request, jwtSecret: string): RequestUser | null {
  const token = getToken(req.header('authorization'));
  if (!token) return null;

  try {
    return jwt.verify(token, jwtSecret) as RequestUser;
  } catch {
    return null;
  }
}

function canManageJobs(role: RequestUser['role']): boolean {
  return role === 'recruiter' || role === 'admin' || role === 'founder';
}

function canManageApplications(role: RequestUser['role']): boolean {
  return role === 'recruiter' || role === 'admin' || role === 'founder';
}

export function registerRecruiterRoutes(app: express.Express, options: { jwtSecret: string }) {
  const jobSchema = z.object({
    title: z.string().min(2),
    company: z.string().min(2),
    location: z.string().min(2),
    employmentType: z.string().min(2),
    description: z.string().min(10),
    skills: z.array(z.string().min(1)).default([])
  });

  app.get('/jobs', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const state = await loadState();
    const jobs = state.jobs.map((job) => ({
      ...job,
      applicantCount: state.applications.filter((application) => application.jobId === job.id).length,
      verified: job.verified ?? false,
      jobTrustScore: job.jobTrustScore ?? 0
    }));

    res.json({ jobs });
  });

  app.post('/jobs', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current || !canManageJobs(current.role)) return res.status(403).json({ error: 'Forbidden' });

    const parsed = jobSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

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
    const current = authUser(req, options.jwtSecret);
    if (!current || !canManageJobs(current.role)) return res.status(403).json({ error: 'Forbidden' });

    const statusSchema = z.object({ status: z.enum(['open', 'closed']) });
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const state = await loadState();
    const job = state.jobs.find((entry) => entry.id === req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    job.status = parsed.data.status as JobStatus;
    job.updatedAt = new Date().toISOString();
    await saveState(state);
    res.json({ job });
  });

  app.post('/jobs/:jobId/apply', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current || current.role !== 'candidate') return res.status(403).json({ error: 'Only candidates can apply' });

    const state = await loadState();
    const job = state.jobs.find((entry) => entry.id === req.params.jobId && entry.status === 'open');
    if (!job) return res.status(404).json({ error: 'Job not found or closed' });

    const existing = state.applications.find((application) => application.jobId === job.id && application.candidateId === current.id);
    if (existing) return res.json({ application: existing });

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
      // queue email notification behavior is in index.ts in Phase 1; for now keep minimal and rely on existing draft/approval flow.
      // To preserve behavior fully, keep endpoints in index.ts until Phase 2.
    }

    await saveState(state);
    res.status(201).json({ application });
  });

  app.get('/applications', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const state = await loadState();
    const visibleApplications =
      current.role === 'candidate'
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
    const current = authUser(req, options.jwtSecret);
    if (!current || !canManageApplications(current.role)) return res.status(403).json({ error: 'Forbidden' });

    const statusSchema = z.object({
      status: z.enum(['applied', 'reviewing', 'shortlisted', 'interview', 'offer', 'hired', 'rejected']),
      notes: z.string().default('')
    });

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const state = await loadState();
    const application = state.applications.find((entry) => entry.id === req.params.applicationId);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const job = state.jobs.find((entry) => entry.id === application.jobId);
    const candidate = state.users.find((entry) => entry.id === application.candidateId);

    application.status = parsed.data.status as ApplicationStatus;
    application.updatedAt = new Date().toISOString();
    application.history.unshift(createApplicationHistoryEntry(parsed.data.status as ApplicationStatus, current.id, parsed.data.notes));

    // queue email notification behavior is in index.ts in Phase 1; keep for Phase 2.

    await saveState(state);
    res.json({ application });
  });
}

