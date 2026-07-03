import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import type express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { createEmptyCandidateProfile, loadState, saveState } from '../../store.js';
import type { Role, RequestUser, SubscriptionPlan, User } from '../../types.js';

export function registerAuthRoutes(app: express.Express) {
  const jwtSecret = process.env.JWT_SECRET ?? 'intelyhire-dev-secret';

  const authSchema = z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['candidate', 'recruiter', 'admin', 'founder']).optional(),
    plan: z.enum(['student', 'standard', 'active', 'professional']).optional()
  });

  function signToken(user: RequestUser): string {
    return jwt.sign(user, jwtSecret, { expiresIn: '12h' });
  }

  function toPublicUser(user: { id: string; email: string; role: Role; fullName: string; subscriptionPlan?: SubscriptionPlan; verified: boolean }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      subscriptionPlan: user.subscriptionPlan,
      verified: user.verified
    };
  }

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

    const user: User = {
      id: crypto.randomUUID(),
      fullName: parsed.data.fullName ?? parsed.data.email.split('@')[0],
      email: parsed.data.email.toLowerCase(),
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: parsed.data.role ?? 'candidate',
      subscriptionPlan: parsed.data.plan ?? 'student',
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    state.users.push(user);
    state.candidateProfiles.push(createEmptyCandidateProfile(user.id));
    await saveState(state);

    const token = signToken({ id: user.id, email: user.email, role: user.role, fullName: user.fullName, subscriptionPlan: user.subscriptionPlan });
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

    const token = signToken({ id: user.id, email: user.email, role: user.role, fullName: user.fullName, subscriptionPlan: user.subscriptionPlan });
    return res.json({ token, user: toPublicUser(user) });
  });

  app.get('/auth/me', async (req, res) => {
    const header = req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let current: RequestUser;
    try {
      current = jwt.verify(token, jwtSecret) as RequestUser;
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const state = await loadState();
    const user = state.users.find((entry) => entry.id === current.id);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.json({ user: toPublicUser(user) });
  });
}

