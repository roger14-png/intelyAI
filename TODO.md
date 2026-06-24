# IntelyHire Work Tracker

## Enterprise rollout (Phase 1: service boundary refactor)
- [ ] Create service route modules under `backend/src/services/*`
- [ ] Refactor `backend/src/index.ts` into a thin bootstrapper
- [ ] Add a centralized route registration (API gateway boundary) in `backend/src/api/*`
- [ ] Keep `backend/src/reviewApi.ts` standalone for this phase (called from gateway)
- [ ] Run `npm run typecheck` for backend + frontend
- [ ] Run `npm run dev` smoke test for backend + frontend

