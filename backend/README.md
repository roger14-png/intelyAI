# Backend (local) — intelyAI

This folder provides a minimal Express-based local API to support the new frontend integration for development and testing.

What it is
- Small Express server with file-backed persistence (backend/data/store.json)
- Seeds initial data from `intelyai-frontent/db.json` if present
- Exposes the simple endpoints the frontend expects (GET /jobs, GET /applications, candidate profile endpoints, POST/PATCH support)

Quick start (local dev)

1. From repository root:

   cd backend
   npm install
   npm start

2. The server listens on port 5000 by default. You can change via environment var:

   PORT=5000 npm start

3. Useful endpoints

   GET  /health
   GET  /profile
   GET  /candidate_profiles
   PATCH /candidate_profiles/:id
   GET  /jobs
   POST /jobs
   GET  /applications
   POST /applications
   PATCH /applications/:id
   GET  /interviews
   POST /interviews

Development notes
- The server will attempt to seed `backend/data/store.json` from `intelyai-frontent/db.json` on first run.
- A helper route `POST /__seed_from_frontend` will re-seed the store from `intelyai-frontent/db.json` (dev use only).
- This backend is intended for local development and prototyping only.

If you want a different backend style (SQLite/Prisma, Django), I can scaffold that instead — tell me and I'll switch.
