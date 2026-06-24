import type express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import type { EmailAccount, EmailLog, EmailProvider, RequestUser } from '../../types.js';
import { loadState, saveState } from '../../store.js';

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

export function registerEmailRoutes(app: express.Express, options: { jwtSecret: string }) {
  const emailAccountSchema = z.object({
    provider: z.enum(['google', 'microsoft', 'smtp']),
    emailAddress: z.string().email(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional()
  });

  app.get('/email/accounts', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const state = await loadState();
    const accounts = state.emailAccounts.filter((account) => account.userId === current.id);
    res.json({ accounts });
  });

  app.post('/email/accounts/connect', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = emailAccountSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const state = await loadState();
    const now = new Date().toISOString();

    const existingIndex = state.emailAccounts.findIndex(
      (account) =>
        account.userId === current.id &&
        account.provider === parsed.data.provider &&
        account.emailAddress.toLowerCase() === parsed.data.emailAddress.toLowerCase()
    );

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

    if (existingIndex >= 0) state.emailAccounts[existingIndex] = account;
    else state.emailAccounts.unshift(account);

    await saveState(state);
    return res.status(existingIndex >= 0 ? 200 : 201).json({ account });
  });

  app.get('/email/logs', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const state = await loadState();

    const logs =
      current.role === 'admin' || current.role === 'founder'
        ? state.emailLogs
        : current.role === 'recruiter'
          ? state.emailLogs.filter(
              (log) =>
                log.recipientUserId === current.id ||
                state.jobs.some(
                  (job) => job.createdBy === current.id && log.applicationId && state.applications.some((a) => a.id === log.applicationId && a.jobId === job.id)
                )
            )
          : state.emailLogs.filter((log) => log.recipientUserId === current.id);

    res.json({ logs });
  });

  app.post('/email/accounts/:accountId/test', async (req, res) => {
    const current = authUser(req, options.jwtSecret);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

    const state = await loadState();
    const account = state.emailAccounts.find((entry) => entry.id === req.params.accountId && entry.userId === current.id);
    if (!account) return res.status(404).json({ error: 'Email account not found' });

    // Defer actual queueing to index.ts helper for Phase 1 risk minimization.
    // For Phase 1, keep behavior by reusing store's createEmailLog + unshift happens in index.ts.
    // In the meantime, we mimic the previous behavior by writing the log entry directly.

    const { createEmailLog } = await import('../../store.js');

    state.emailLogs.unshift(
      createEmailLog({
        applicationId: null,
        recipientUserId: current.id,
        recipientEmail: account.emailAddress,
        provider: account.provider,
        direction: 'outbound',
        subject: 'IntelyHire connection test',
        body: 'This is a test notification from IntelyHire.',
        status: 'queued'
      })
    );

    await saveState(state);
    return res.status(201).json({ ok: true });
  });
}

