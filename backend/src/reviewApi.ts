import crypto from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import type { ApplicationDraft, EmailAccount, RequestUser } from './types.js';
import type { DbState } from './types.js';
import { createApplicationHistoryEntry, createEmptyCandidateProfile, createEmailLog, loadState, saveState } from './store.js';

// Note: this file is intentionally MVP-level.
// It implements draft generation + preview editing + explicit approve/reject gating.

export function registerReviewApi(app: express.Express) {
  // Helper to access current user (duplicated small logic to keep this router standalone)
  const getToken = (authHeader?: string): string | null => {
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice('Bearer '.length);
  };

  const jwtSecret = process.env.JWT_SECRET ?? 'intelyhire-dev-secret';

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

  // -----------------------------
  // GET drafts
  // -----------------------------
  app.get('/application-packages', async (req, res) => {
    const current = await authUser(req);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const state = await loadState();
    const drafts = current.role === 'candidate' ? state.applicationDrafts.filter((d) => d.candidateId === current.id) : state.applicationDrafts;

    res.json({ drafts });
  });

  // -----------------------------
  // Generate draft
  // -----------------------------
  app.post('/ai/application-packages/generate', async (req, res) => {
    const current = await authUser(req);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });
    if (current.role !== 'candidate') return res.status(403).json({ error: 'Only candidates can generate application packages' });

    const payload = z.object({ jobId: z.string() }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ error: payload.error.flatten() });

    const state = await loadState();
    const job = state.jobs.find((j) => j.id === payload.data.jobId);
    if (!job || job.status !== 'open') return res.status(404).json({ error: 'Job not found or closed' });

    const profile = state.candidateProfiles.find((p) => p.userId === current.id) ?? createEmptyCandidateProfile(current.id);

    // Match score heuristic (inline)
    const normalizeChunk = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const hasRequirementMatch = (text: string, requirement: string) => {
      const normalizedRequirement = normalizeChunk(requirement);
      if (!normalizedRequirement) return false;
      const normalizedText = normalizeChunk(text);
      return normalizedText.includes(normalizedRequirement);
    };

    const skills = new Set(profile.skills.map((s) => s.toLowerCase()));
    const requiredSkills = job.skills.map((s) => s.toLowerCase());
    const matchingSkills = requiredSkills.filter((s) => skills.has(s));
    const missingSkills = requiredSkills.filter((s) => !skills.has(s));

    const profileText = `${profile.headline} ${profile.summary} ${profile.skills.join(' ')} ${profile.experience.map((entry) => `${entry.title} ${entry.description}`).join(' ')}`.toLowerCase();
    const jobText = `${job.title} ${job.description} ${job.company} ${job.skills.join(' ')} ${(job.qualifications ?? []).join(' ')} ${(job.merits ?? []).join(' ')}`.toLowerCase();

    const qualifications = (job.qualifications ?? []).map((item) => item.trim()).filter(Boolean);
    const merits = (job.merits ?? []).map((item) => item.trim()).filter(Boolean);
    const matchedQualifications = qualifications.filter((item) => hasRequirementMatch(profileText, item));
    const matchedMerits = merits.filter((item) => hasRequirementMatch(profileText, item));
    const missingQualifications = qualifications.filter((item) => !matchedQualifications.includes(item));
    const missingMerits = merits.filter((item) => !matchedMerits.includes(item));

    const jobKeywords = Array.from(new Set(jobText.split(/[^a-z0-9+.-]+/g).filter((t) => t.length >= 3)));
    const keywordHits = jobKeywords.filter((k) => profileText.includes(k));
    const locationHit = profile.location.trim() && job.location.trim() ? profile.location.trim().toLowerCase() === job.location.trim().toLowerCase() : false;

    const skillComponent = requiredSkills.length === 0 ? 0 : matchingSkills.length / requiredSkills.length;
    const qualificationComponent = qualifications.length === 0 ? 0 : matchedQualifications.length / qualifications.length;
    const meritComponent = merits.length === 0 ? 0 : matchedMerits.length / merits.length;
    const keywordComponent = jobKeywords.length === 0 ? 0 : keywordHits.length / jobKeywords.length;
    const scoreRaw = 100 * (0.50 * skillComponent + 0.20 * qualificationComponent + 0.15 * meritComponent + 0.10 * keywordComponent + 0.05 * (locationHit ? 1 : 0));
    const matchScore = Math.max(0, Math.min(100, Math.round(scoreRaw)));

    const reasons: string[] = [];
    if (requiredSkills.length > 0) {
      reasons.push(`${matchingSkills.length}/${requiredSkills.length} skills match`);
      if (missingSkills.length > 0) reasons.push(`Missing skills: ${missingSkills.slice(0, 5).join(', ')}`);
    } else {
      reasons.push('No required skills listed for this job');
    }
    if (qualifications.length > 0) {
      reasons.push(`${matchedQualifications.length}/${qualifications.length} qualifications match`);
      if (missingQualifications.length > 0) reasons.push(`Missing qualifications: ${missingQualifications.slice(0, 3).join(', ')}`);
    }
    if (merits.length > 0) {
      reasons.push(`${matchedMerits.length}/${merits.length} merits align`);
      if (missingMerits.length > 0) reasons.push(`Missing merits: ${missingMerits.slice(0, 3).join(', ')}`);
    }
    reasons.push(`${keywordHits.length} keyword hits from profile`);
    if (locationHit) reasons.push('Location matches');

    // Trust score heuristic (inline)
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

    const coverLetterText = `Hi ${job.company} team—\n\nI’m excited to apply for the ${job.title} role.\n\nRelevant skills: ${profile.skills.slice(0, 10).join(', ') || '—'}.\n\nThanks for your time.\n`;

    const emailSubject = `Application for ${job.title} — IntelyHire`;
    const emailBody = `Dear Hiring Manager,\n\nI’m writing to apply for the ${job.title} position at ${job.company}.\n\n${coverLetterText}\nSincerely,\n${current.email}\n`;

    const now = new Date().toISOString();

    const recruiterEmail = job.createdBy ? state.users.find((u) => u.id === job.createdBy)?.email : undefined;

    const draft: ApplicationDraft = {
      id: crypto.randomUUID(),
      jobId: job.id,
      candidateId: current.id,
      matchScore,
      trustScore,
      aiRecommendation: matchScore >= 80 ? 'Strong Match' : matchScore >= 60 ? 'Potential Match' : 'Needs Review',
      aiReasons: reasons,
      resumeVariantLabel: 'AI-Generated Version',
      resumeCvUrl: profile.cvUrl,
      emailTo: recruiterEmail ?? current.email,
      emailSubject,
      emailBody,
      coverLetterText,
      status: 'generated',
      createdAt: now,
      updatedAt: now
    };

    state.applicationDrafts.unshift(draft);
    await saveState(state);

    res.status(201).json({ draft });
  });

  // Edit
  app.patch('/application-packages/:draftId', async (req, res) => {
    const current = await authUser(req);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });
    if (current.role !== 'candidate') return res.status(403).json({ error: 'Only candidates can edit application packages' });

    const payload = z
      .object({
        emailBody: z.string().optional(),
        emailSubject: z.string().optional(),
        coverLetterText: z.string().optional()
      })
      .safeParse(req.body);

    if (!payload.success) return res.status(400).json({ error: payload.error.flatten() });

    const state = await loadState();
    const draft = state.applicationDrafts.find((d) => d.id === req.params.draftId);
    if (!draft || draft.candidateId !== current.id) return res.status(404).json({ error: 'Draft not found' });
    if (draft.status === 'sent' || draft.status === 'approved' || draft.status === 'rejected') return res.status(400).json({ error: 'Draft is not editable' });

    const next: ApplicationDraft = {
      ...draft,
      emailBody: payload.data.emailBody ?? draft.emailBody,
      emailSubject: payload.data.emailSubject ?? draft.emailSubject,
      coverLetterText: payload.data.coverLetterText ?? draft.coverLetterText,
      status: 'user_edited',
      updatedAt: new Date().toISOString()
    };

    state.applicationDrafts = state.applicationDrafts.map((d) => (d.id === next.id ? next : d));
    await saveState(state);

    res.json({ draft: next });
  });

  // Approve (queues email)
  app.post('/application-packages/:draftId/approve', async (req, res) => {
    const current = await authUser(req);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });
    if (current.role !== 'candidate') return res.status(403).json({ error: 'Only candidates can approve application packages' });

    const state = await loadState();
    const draft = state.applicationDrafts.find((d) => d.id === req.params.draftId);
    if (!draft || draft.candidateId !== current.id) return res.status(404).json({ error: 'Draft not found' });
    if (draft.status === 'sent' || draft.status === 'rejected') return res.status(400).json({ error: 'Draft cannot be approved' });

    const job = state.jobs.find((j) => j.id === draft.jobId);
    if (!job || job.status !== 'open') return res.status(404).json({ error: 'Job not found or closed' });

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
        history: [createApplicationHistoryEntry('applied', current.id, 'Candidate approved AI-generated application package')]
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

    const updatedDraft: ApplicationDraft = {
      ...draft,
      status: 'sent',
      updatedAt: new Date().toISOString()
    };

    state.applicationDrafts = state.applicationDrafts.map((d) => (d.id === updatedDraft.id ? updatedDraft : d));
    await saveState(state);

    res.status(201).json({ application, draft: updatedDraft });
  });

  // Reject
  app.post('/application-packages/:draftId/reject', async (req, res) => {
    const current = await authUser(req);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });
    if (current.role !== 'candidate') return res.status(403).json({ error: 'Only candidates can reject application packages' });

    const state = await loadState();
    const draft = state.applicationDrafts.find((d) => d.id === req.params.draftId);
    if (!draft || draft.candidateId !== current.id) return res.status(404).json({ error: 'Draft not found' });

    const updatedDraft: ApplicationDraft = {
      ...draft,
      status: 'rejected',
      updatedAt: new Date().toISOString()
    };

    state.applicationDrafts = state.applicationDrafts.map((d) => (d.id === updatedDraft.id ? updatedDraft : d));
    await saveState(state);

    res.json({ draft: updatedDraft });
  });
}

