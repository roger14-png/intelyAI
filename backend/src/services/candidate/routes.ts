import type express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { z } from 'zod';

import type { CandidateProfile, RequestUser } from '../../types.js';
import { createEmptyCandidateProfile, loadState, saveState, uploadsDir } from '../../store.js';

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

export function registerCandidateRoutes(app: express.Express, options: { jwtSecret: string; upload: multer.Multer }) {
  const profileSchema = z.object({
    headline: z.string().default(''),
    location: z.string().default(''),
    summary: z.string().default(''),
    cvUrl: z.string().default(''),
    skills: z.array(z.string()).default([]),
    certificates: z.array(z.string()).default([]),
    education: z
      .array(z.object({ id: z.string(), school: z.string(), degree: z.string(), year: z.string() }))
      .default([]),
    experience: z
      .array(z.object({ id: z.string(), title: z.string(), company: z.string(), years: z.string(), description: z.string() }))
      .default([])
  });

  app.get('/candidate/profile', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const state = await loadState();
    const profile = state.candidateProfiles.find((entry) => entry.userId === current.id) ?? createEmptyCandidateProfile(current.id);
    return res.json({ profile });
  });

  app.put('/candidate/profile', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const state = await loadState();
    const profileIndex = state.candidateProfiles.findIndex((entry) => entry.userId === current.id);
    const profile: CandidateProfile = { userId: current.id, ...parsed.data };

    if (profileIndex >= 0) state.candidateProfiles[profileIndex] = profile;
    else state.candidateProfiles.push(profile);

    await saveState(state);
    return res.json({ profile });
  });

  app.post('/candidate/profile/cv', options.upload.single('file'), async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) return res.status(400).json({ error: 'Missing CV file' });

    const cvUrl = `/uploads/${req.file.filename}`;
    const state = await loadState();
    const profileIndex = state.candidateProfiles.findIndex((entry) => entry.userId === current.id);
    const profile = profileIndex >= 0 ? state.candidateProfiles[profileIndex] : createEmptyCandidateProfile(current.id);
    profile.cvUrl = cvUrl;

    if (profileIndex >= 0) state.candidateProfiles[profileIndex] = profile;
    else state.candidateProfiles.push(profile);

    await saveState(state);
    return res.status(201).json({ cvUrl, originalName: req.file.originalname });
  });
}

