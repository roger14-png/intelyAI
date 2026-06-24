import crypto from 'node:crypto';
import type express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import type { Application, CandidateProfile, RequestUser } from '../../types.js';
import { createApplicationHistoryEntry, createEmptyCandidateProfile, loadState, saveState } from '../../store.js';

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

export function registerAiRoutes(app: express.Express, options: { jwtSecret: string }) {
  app.post('/ai/match', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const jobIdFromQuery = typeof req.query.jobId === 'string' ? req.query.jobId : undefined;
    const payload = z
      .object({
        jobId: z.string(),
        candidateId: z.string().optional()
      })
      .safeParse({ jobId: jobIdFromQuery ?? req.body?.jobId, candidateId: req.body?.candidateId });

    if (!payload.success) return res.status(400).json({ error: payload.error.flatten() });

    const state = await loadState();
    const job = state.jobs.find((entry) => entry.id === payload.data.jobId);
    const candidateId = payload.data.candidateId ?? current.id;
    const profile = state.candidateProfiles.find((entry) => entry.userId === candidateId);
    if (!job || !profile) return res.status(404).json({ error: 'Matching inputs not found' });

    const profileText = `${profile.headline} ${profile.summary} ${profile.skills.join(' ')}`.toLowerCase();
    const jobText = `${job.title} ${job.description} ${job.company} ${job.skills.join(' ')}`.toLowerCase();

    const skills = new Set(profile.skills.map((skill) => skill.toLowerCase()));
    const requiredSkills = job.skills.map((skill) => skill.toLowerCase());
    const matchingSkills = requiredSkills.filter((skill) => skills.has(skill));
    const missingSkills = requiredSkills.filter((skill) => !skills.has(skill));

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
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const payload = z.object({ candidateId: z.string().optional() }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ error: payload.error.flatten() });

    const state = await loadState();
    const candidateId = payload.data.candidateId ?? current.id;
    const profile = state.candidateProfiles.find((entry) => entry.userId === candidateId);
    if (!profile) return res.status(404).json({ error: 'Candidate profile not found' });

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

    const careerScore = Math.max(0, Math.min(100, Math.round(careerScoreRaw)));

    const technicalScore = Math.max(
      0,
      Math.min(100, Math.round(0.60 * skillsScore + 0.25 * projectsScore + 0.15 * experienceScore))
    );

    const communicationScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          0.45 * (profile.summary.trim().length > 0 ? 100 : 0) +
            0.35 * (profile.headline.trim().length > 0 ? 100 : 0) +
            0.20 * (profile.cvUrl ? 100 : 0)
        )
      )
    );

    const marketReadiness = careerScore >= 81 ? 'High' : careerScore >= 61 ? 'Medium' : 'Low';
    const tier =
      careerScore <= 40
        ? 'Beginner'
        : careerScore <= 60
          ? 'Emerging'
          : careerScore <= 80
            ? 'Competitive'
            : 'Highly Employable';

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
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const payload = z
      .object({
        candidateId: z.string().optional(),
        jobId: z.string().optional(),
        applicationId: z.string().optional()
      })
      .safeParse(req.body);

    if (!payload.success) return res.status(400).json({ error: payload.error.flatten() });

    const state = await loadState();
    const candidateId = payload.data.candidateId ?? current.id;
    const profile = state.candidateProfiles.find((entry) => entry.userId === candidateId);
    if (!profile) return res.status(404).json({ error: 'Candidate profile not found' });

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

    res.json({ candidate: candidateId, job: null, trust_score: trustScore, level, risks });
  });

  app.post('/ai/interview/start', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const payload = z.object({ applicationId: z.string() }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ error: payload.error.flatten() });

    const state = await loadState();
    const application = state.applications.find((a) => a.id === payload.data.applicationId);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const job = state.jobs.find((j) => j.id === application.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found for application' });

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
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const payload = z
      .object({
        sessionId: z.string(),
        questionId: z.string(),
        answer: z.string().min(1)
      })
      .safeParse(req.body);

    if (!payload.success) return res.status(400).json({ error: payload.error.flatten() });

    const state = await loadState();
    const session = state.aiInterviewSessions.find((s) => s.id === payload.data.sessionId);
    if (!session) return res.status(404).json({ error: 'Interview session not found' });

    if (session.status !== 'active') return res.status(400).json({ error: 'Interview session is not active' });

    const question = session.questions.find((q) => q.id === payload.data.questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

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
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });
    if (current.role !== 'candidate') return res.status(403).json({ error: 'Only candidates can auto-apply' });

    const payload = z
      .object({ jobIds: z.array(z.string()).optional(), limit: z.number().int().min(1).max(50).optional() })
      .safeParse(req.body);

    if (!payload.success) return res.status(400).json({ error: payload.error.flatten() });

    const state = await loadState();
    const profile = state.candidateProfiles.find((p) => p.userId === current.id) ?? createEmptyCandidateProfile(current.id);

    const openJobs = state.jobs.filter((j) => j.status === 'open');
    const candidateJobIds = new Set(state.applications.filter((a) => a.candidateId === current.id).map((a) => a.jobId));

    let targetJobs = payload.data.jobIds ? openJobs.filter((j) => payload.data.jobIds!.includes(j.id)) : openJobs;
    targetJobs = targetJobs.filter((j) => !candidateJobIds.has(j.id));
    if (payload.data.limit) targetJobs = targetJobs.slice(0, payload.data.limit);

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
    }

    await saveState(state);
    res.status(201).json({ appliedCount: applied.length, appliedApplications: applied });
  });
}

