import crypto from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';

import { z } from 'zod';

import type {
  AgentRun,
  AgentRunDraft,
  ApplicationDraft,
  DbState,
  EmailAccount,
  RequestUser
} from './types.js';


import { createApplicationHistoryEntry, createEmptyCandidateProfile, createEmailLog, loadState, saveState } from './store.js';
import type { Application } from './types.js';

export function registerAgentApi(app: express.Express) {
  const jwtSecret = process.env.JWT_SECRET ?? 'intelyhire-dev-secret';

  function getToken(authHeader?: string): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice('Bearer '.length);
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

  function resolveEmailProvider(state: DbState, userId: string): EmailAccount['provider'] | 'system' {
    return state.emailAccounts.find((account) => account.userId === userId)?.provider ?? 'system';
  }

  function queueEmailNotification(state: DbState, entry: {
    applicationId?: string | null;
    recipientUserId?: string | null;
    recipientEmail: string;
    provider: EmailAccount['provider'] | 'system';
    subject: string;
    body: string;
  }) {
    state.emailLogs.unshift(
      createEmailLog({
        applicationId: entry.applicationId ?? null,
        recipientUserId: entry.recipientUserId ?? null,
        recipientEmail: entry.recipientEmail,
        provider: entry.provider,
        direction: 'outbound',
        subject: entry.subject,
        body: entry.body,
        status: 'queued'
      })
    );
  }

  function computeMatchAndTrust(state: DbState, profile: DbState['candidateProfiles'][number], job: DbState['jobs'][number]) {
    const skills = new Set(profile.skills.map((s) => s.toLowerCase()));
    const requiredSkills = job.skills.map((s) => s.toLowerCase());
    const matchingSkills = requiredSkills.filter((s) => skills.has(s));
    const missingSkills = requiredSkills.filter((s) => !skills.has(s));

    const profileText = `${profile.headline} ${profile.summary} ${profile.skills.join(' ')}`.toLowerCase();
    const jobText = `${job.title} ${job.description} ${job.company} ${job.skills.join(' ')}`.toLowerCase();

    const jobKeywords = Array.from(new Set(jobText.split(/[^a-z0-9+.-]+/g).filter((t) => t.length >= 3)));
    const keywordHits = jobKeywords.filter((k) => profileText.includes(k));

    const locationHit =
      profile.location.trim() && job.location.trim()
        ? profile.location.trim().toLowerCase() === job.location.trim().toLowerCase()
        : false;

    const skillComponent = requiredSkills.length === 0 ? 0 : matchingSkills.length / requiredSkills.length;
    const keywordComponent = jobKeywords.length === 0 ? 0 : keywordHits.length / jobKeywords.length;
    const scoreRaw = 100 * (0.65 * skillComponent + 0.30 * keywordComponent + 0.05 * (locationHit ? 1 : 0));
    const matchScore = Math.max(0, Math.min(100, Math.round(scoreRaw)));

    const reasons: string[] = [];
    if (requiredSkills.length > 0) {
      reasons.push(`${matchingSkills.length}/${requiredSkills.length} skills match`);
      if (missingSkills.length > 0) reasons.push(`Missing: ${missingSkills.slice(0, 5).join(', ')}`);
    } else {
      reasons.push('No required skills listed for this job');
    }
    reasons.push(`${keywordHits.length} keyword hits from profile`);
    if (locationHit) reasons.push('Location matches');

    const hasCv = Boolean(profile.cvUrl);
    const hasHeadline = profile.headline.trim().length > 0;
    const hasSummary = profile.summary.trim().length > 0;
    const skillCount = profile.skills.length;
    const certCount = profile.certificates.length;

    const base = 35;
    const completeness = (hasCv ? 25 : 0) + (hasHeadline ? 10 : 0) + (hasSummary ? 10 : 0);
    const skillsComponent = Math.min(20, skillCount * 2);
    const certsComponent = Math.min(10, certCount * 2);
    const trustScore = Math.max(0, Math.min(100, Math.round(base + completeness + skillsComponent + certsComponent)));

    const coverLetterText = `Hi ${job.company} team—\\n\\nI’m excited to apply for the ${job.title} role.\\n\\nRelevant skills: ${profile.skills
      .slice(0, 10)
      .join(', ') || '—'}.\\n\\nThanks for your time.\\n`;

    const emailSubject = `Application for ${job.title} — IntelyHire`;
    const emailBody = `Dear Hiring Manager,\\n\\nI’m writing to apply for the ${job.title} position at ${job.company}.\\n\\n${coverLetterText}\\nSincerely,\\n${profile.userId}`;

    return {
      matchScore,
      trustScore,
      missingSkills,
      reasons,
      aiRecommendation: matchScore >= 80 ? 'Strong Match' : matchScore >= 60 ? 'Potential Match' : 'Needs Review',
      coverLetterText,
      emailSubject,
      emailBody
    };
  }

  // Prepare-only draft generation for multiple jobs
  app.post('/agent/run', async (req, res) => {
    const current = await authUser(req);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });
    if (current.role !== 'candidate') return res.status(403).json({ error: 'Only candidates can run the agent' });

    const payload = z
      .object({
        jobIds: z.array(z.string()).optional(),
        limit: z.number().int().min(1).max(50).optional()
      })
      .safeParse(req.body);

    if (!payload.success) return res.status(400).json({ error: payload.error.flatten() });

    const state = await loadState();
    const profile = state.candidateProfiles.find((p) => p.userId === current.id) ?? createEmptyCandidateProfile(current.id);

    const openJobs = state.jobs.filter((j) => j.status === 'open');

    const alreadyAppliedJobIds = new Set(state.applications.filter((a) => a.candidateId === current.id).map((a) => a.jobId));

    let targetJobs = payload.data.jobIds ? openJobs.filter((j) => payload.data.jobIds!.includes(j.id)) : openJobs;
    targetJobs = targetJobs.filter((j) => !alreadyAppliedJobIds.has(j.id));
    if (payload.data.limit) targetJobs = targetJobs.slice(0, payload.data.limit);

    const now = new Date().toISOString();
    const runId = crypto.randomUUID();

    const runDrafts: AgentRunDraft[] = [];

    for (const job of targetJobs) {
      const jobMatch = computeMatchAndTrust(state, profile, job);

      const draft: ApplicationDraft = {
        id: crypto.randomUUID(),
        jobId: job.id,
        candidateId: current.id,
        matchScore: jobMatch.matchScore,
        trustScore: jobMatch.trustScore,
        aiRecommendation: jobMatch.aiRecommendation,
        aiReasons: jobMatch.reasons,
        resumeVariantLabel: 'AI-Prepared (Not Submitted)',
        resumeCvUrl: profile.cvUrl,
        emailTo: job.createdBy ? (state.users.find((u) => u.id === job.createdBy)?.email ?? current.email) : current.email,
        emailSubject: jobMatch.emailSubject,
        emailBody: jobMatch.emailBody,
        coverLetterText: jobMatch.coverLetterText,
        status: 'generated',
        createdAt: now,
        updatedAt: now
      };

      state.applicationDrafts.unshift(draft);

      runDrafts.push({ draftId: draft.id, jobId: job.id });
    }

    const run: AgentRun = {
      id: runId,
      candidateId: current.id,
      status: 'prepared',
      mode: 'prepare_only',
      createdAt: now,
      updatedAt: now,
      runDrafts
    };

    state.agentRuns = [run, ...(state.agentRuns ?? [])];

    await saveState(state);

    res.status(201).json({ run, draftCount: runDrafts.length, draftIds: runDrafts.map((d) => d.draftId) });
  });

  app.get('/agent/runs', async (req, res) => {
    const current = await authUser(req);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const state = await loadState();

    const runs = current.role === 'candidate' ? (state.agentRuns ?? []).filter((r) => r.candidateId === current.id) : state.agentRuns ?? [];

    res.json({ runs });
  });

  const approveDraft = (state: DbState, draft: ApplicationDraft, current: RequestUser) => {
    const job = state.jobs.find((j) => j.id === draft.jobId);
    if (!job || job.status !== 'open') return null;

    let application = state.applications.find((a) => a.jobId === job.id && a.candidateId === current.id);

    if (!application) {
      application = {
        id: crypto.randomUUID(),
        jobId: job.id,
        candidateId: current.id,
        status: 'applied',
        coverLetter: draft.coverLetterText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [createApplicationHistoryEntry('applied', current.id, 'AI Career Agent approved application package')]
      };
      state.applications.unshift(application);
    } else {
      application.coverLetter = draft.coverLetterText;
      application.updatedAt = new Date().toISOString();
    }

    const recruiter = state.users.find((u) => u.id === job.createdBy);
    if (recruiter) {
      const provider = resolveEmailProvider(state, recruiter.id);
      queueEmailNotification(state, {
        applicationId: application.id,
        recipientUserId: recruiter.id,
        recipientEmail: recruiter.email,
        provider,
        subject: draft.emailSubject,
        body: draft.emailBody
      });
    }

    const nextDraft: ApplicationDraft = {
      ...draft,
      status: 'sent',
      updatedAt: new Date().toISOString()
    };

    state.applicationDrafts = state.applicationDrafts.map((d) => (d.id === nextDraft.id ? nextDraft : d));

    return { application, draft: nextDraft };
  };

  app.post('/agent/run/:runId/approve', async (req, res) => {
    const current = await authUser(req);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });
    if (current.role !== 'candidate') return res.status(403).json({ error: 'Only candidates can approve agent runs' });

    const state = await loadState();
    const run = (state.agentRuns ?? []).find((r) => r.id === req.params.runId);
    if (!run || run.candidateId !== current.id) return res.status(404).json({ error: 'Run not found' });
    if (run.status !== 'prepared' && run.status !== 'rejected') return res.status(400).json({ error: 'Run cannot be approved' });

    for (const rd of run.runDrafts) {
      const draft = state.applicationDrafts.find((d) => d.id === rd.draftId);
      if (!draft) continue;
      if (draft.status === 'sent' || draft.status === 'approved') continue;

      approveDraft(state, draft, current);
    }

    const updatedRun: AgentRun = {
      ...run,
      status: 'approved',
      updatedAt: new Date().toISOString()
    };

    state.agentRuns = (state.agentRuns ?? []).map((r) => (r.id === updatedRun.id ? updatedRun : r));
    await saveState(state);

    res.json({ run: updatedRun });
  });

  app.post('/agent/run/:runId/reject', async (req, res) => {
    const current = await authUser(req);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });
    if (current.role !== 'candidate') return res.status(403).json({ error: 'Only candidates can reject agent runs' });

    const state = await loadState();
    const run = (state.agentRuns ?? []).find((r) => r.id === req.params.runId);
    if (!run || run.candidateId !== current.id) return res.status(404).json({ error: 'Run not found' });

    const updatedRun: AgentRun = {
      ...run,
      status: 'rejected',
      updatedAt: new Date().toISOString()
    };

    for (const rd of run.runDrafts) {
      const draft = state.applicationDrafts.find((d) => d.id === rd.draftId);
      if (!draft) continue;
      if (draft.status === 'sent') continue;

      state.applicationDrafts = state.applicationDrafts.map((d) =>
        d.id === draft.id
          ? {
              ...d,
              status: 'rejected',
              updatedAt: new Date().toISOString()
            }
          : d
      );
    }

    state.agentRuns = (state.agentRuns ?? []).map((r) => (r.id === updatedRun.id ? updatedRun : r));

    await saveState(state);

    res.json({ run: updatedRun });
  });
}

