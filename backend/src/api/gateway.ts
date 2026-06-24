import type { Express } from 'express';

import { registerReviewApi } from '../reviewApi.js';

import { registerAuthRoutes } from '../services/auth/routes.js';
import { registerCandidateRoutes } from '../services/candidate/routes.js';
import { registerRecruiterRoutes } from '../services/recruiter/routes.js';
import { registerDashboardRoutes } from '../services/dashboard/routes.js';
import { registerAiRoutes } from '../services/ai/routes.js';
import { registerEmailRoutes } from '../services/email/routes.js';

export function registerGateway(
  app: Express,
  options: { jwtSecret: string; upload: any }
) {
  // --- middleware/express app bootstrapping is done in backend/src/index.ts ---

  // Keep review/drafts standalone for Phase 1 (least risk)
  registerReviewApi(app);

  registerAuthRoutes(app);
  registerDashboardRoutes(app);
  registerCandidateRoutes(app, { jwtSecret: options.jwtSecret, upload: options.upload });
  registerRecruiterRoutes(app, { jwtSecret: options.jwtSecret });
  registerEmailRoutes(app, { jwtSecret: options.jwtSecret });
  registerAiRoutes(app, { jwtSecret: options.jwtSecret });
}



