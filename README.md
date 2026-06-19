# IntelyHire

Monorepo MVP for a startup-scale recruitment platform.

## What is included

- Auth with roles: candidate, recruiter, admin, founder
- Candidate profile management
- Job management for recruiters
- Application workflow with status updates
- Dashboard summary endpoints
- A polished React + Vite frontend
- A lightweight Express API with local JSON persistence for fast MVP iteration

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm run dev
   ```

API defaults to `http://localhost:4000` and the web app to `http://localhost:5173`.

## Demo accounts

These accounts are seeded on first run:

- recruiter@intelyhire.dev / Passw0rd!
- admin@intelyhire.dev / Passw0rd!
- founder@intelyhire.dev / Passw0rd!

## Next phase

- Replace JSON persistence with PostgreSQL + Prisma
- Add email provider integrations
- Introduce AI matching and application generation