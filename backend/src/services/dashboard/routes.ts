import type express from 'express';
import jwt from 'jsonwebtoken';
import type { RequestUser } from '../../types.js';
import { loadState } from '../../store.js';

function getToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length);
}

function authUser(req: express.Request): RequestUser | null {
  const token = getToken(req.header('authorization'));
  if (!token) return null;

  const jwtSecret = process.env.JWT_SECRET ?? 'intelyhire-dev-secret';
  try {
    return jwt.verify(token, jwtSecret) as RequestUser;
  } catch {
    return null;
  }
}

export function registerDashboardRoutes(app: express.Express) {
  app.get('/dashboard/summary', async (req, res) => {
    const current = authUser(req);
    if (!current) return res.status(401).json({ error: 'Unauthorized' });

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
}

