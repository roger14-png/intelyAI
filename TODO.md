## AI Job Intelligence + Git Workflow hardening

- [ ] Implement Job Intelligence Layer (stop relying on direct Google scraping): add compliant ingestion adapters, normalization, validation, dedup, trust-scoring hooks.
- [ ] Replace/contain Google Jobs usage (remove from main path; ensure providers are pluggable).
- [ ] Add queue-based ingestion scheduler (BullMQ/Redis in prod-ready design; local in-memory fallback for MVP).
- [ ] Add caching + dedup fingerprinting for job ingestion.
- [ ] Update backend routes/types to reflect Job Intelligence fields (verified, trustScore) and persist them.
- [ ] Fix / prevent bot workflow from calling /ai/auto-apply/run by default.

## PR-based Git workflow

- [ ] Create feature branch for each logical change.
- [ ] Ensure all changes go via Pull Requests with review gates.
- [ ] (Repo config) Add required status checks / branch protection (if GitHub).

