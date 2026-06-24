# IntelyHire — Project Documentation (Work Completed)

This document summarizes the functionality implemented in the current monorepo MVP.

---

## 1. Repo structure

This project is a **monorepo** with two main packages:

- **Frontend** (`frontend/`): React + Vite, role-aware dashboard UI.
- **Backend** (`backend/`): Express + TypeScript, JWT auth, and **local JSON persistence**.

Reference docs already present:
- `README.md` (high-level MVP overview + run instructions)
- `docs/architecture.md` (architecture notes + delivery order)

---

## 2. Frontend work (Career OS / role-based dashboard)

### 2.1 App shell & role-aware workspaces
**File:** `frontend/src/App.tsx`

Implemented a single React portal that switches content based on authenticated role:

- **Candidate portal**:
  - Application Review Center (generate draft → edit → **Approve & Send** / reject)
  - Candidate profile editing + CV upload
  - Job board + manual application submission (job apply)
  - Application status tracking view
- **Recruiter portal**:
  - Job management (create jobs, open/close jobs)
  - Application pipeline management (update application status)
  - “AI match” button (debug/inspect matching score)
- **Admin/Founder portal**:
  - Summary visibility endpoints (basic admin metrics)

Also includes React Query integration:
- Fetches: `me`, `dashboard/summary`, `jobs`, `applications`, and candidate `profile`
- Invalidates queries on auth and key mutations.

Auth token is persisted in `localStorage` under `intelyhire-token`.

---

### 2.2 Candidate “Application Review Center” (human approval mode)
**Implemented inside:** `CandidateWorkspace` within `frontend/src/App.tsx`

Candidate workflow is explicitly gated:
1. Generate an **application package draft** for a selected open job
2. Edit draft fields:
   - Email subject
   - Email body
   - Cover letter text
3. Perform **Approve & Send** to submit
4. Optionally **Reject** to cancel

This matches the intended “no auto-submit” behavior.

---

### 2.3 Candidate profile management & CV upload
**Implemented inside:** `CandidateWorkspace` within `frontend/src/App.tsx`

Candidate profile fields:
- headline, location, summary
- cvUrl
- skills (comma-separated input)
- certificates

CV upload:
- Accepts `application/pdf,.doc,.docx`
- Calls backend upload endpoint and updates `cvUrl` in the candidate profile.

---

### 2.4 Career OS components (heuristic insights)
These components exist under `frontend/src/components/career/`:

#### CareerScoreCard
**File:** `frontend/src/components/career/CareerScoreCard.tsx`

- Computes an **employability readiness score** (0–100) using an MVP heuristic:
  - profile completeness (headline/location/summary/cvUrl + presence of arrays)
  - skills and experience counts
  - application pipeline stage weights (applied → hired)
- Renders label + progress bar styling by score bands.

#### ApplicationStats
**File:** `frontend/src/components/career/ApplicationStats.tsx`

- Computes counts by application status.
- Displays summary stats such as Applications, Interviews, Offers, Hired.

#### SkillGapAnalysis
**File:** `frontend/src/components/career/SkillGapAnalysis.tsx`

- Uses a fixed technical list:
  `React, Node.js, PostgreSQL, TypeScript, Docker, AWS, CI/CD`
- Detects:
  - strengths: candidate skills that match the technical list
  - gaps: missing from the technical list
- Shows:
  - strengths/gaps pills
  - heuristic “AI recommendations” based on gaps.

#### JobRecommendations
**File:** `frontend/src/components/career/JobRecommendations.tsx`

- Ranks open jobs by:
  - overlap between job skills and tracked “skills to watch” derived from job skills encountered in current applications
- Returns top 4 recommendations.
- Disables the “Generate Application” button (UI stub) if already applied.

#### CareerCoachAI (“Ask IntelyAI”)
**File:** `frontend/src/components/career/CareerCoachAI.tsx`

- Implements a modal assistant UI opened via floating **Ask IntelyAI** button.
- Uses deterministic canned prompts and generates responses based on:
  - application pipeline state
- Provides quick prompt buttons and a text input.

---

## 3. Frontend API layer
**File:** `frontend/src/api.ts`

Implements client functions for all currently used backend endpoints, including:

### Auth & dashboard
- `login`, `register`
- `me`
- `summary`

### Candidate profile
- `profile`, `saveProfile`
- `uploadCv`

### Jobs & applications
- `jobs`, `createJob`, `toggleJobStatus`
- `applyToJob`
- `applications`, `updateApplicationStatus`

### AI/MVP endpoints
- `matchScore`, `trustScore`
- interview flow (`startInterview`, `answerInterview`)
- `autoApply`

### Human approval mode: application packages
- `applicationDrafts`
- `generateApplicationPackage`
- `updateApplicationPackageDraft`
- `approveApplicationPackageDraft`
- `rejectApplicationPackageDraft`

---

## 4. Backend work (Express API + local JSON persistence)

### 4.1 Server + core endpoints
**File:** `backend/src/index.ts`

Key responsibilities:
- Express server setup with:
  - CORS
  - JSON body parsing
  - static `/uploads` hosting
  - multer upload handler
- JWT auth:
  - `/auth/register`
  - `/auth/login`
  - `/auth/me`
- Role-based access controls:
  - can manage jobs (recruiter/admin/founder)
  - can manage applications (recruiter/admin/founder)

Implemented domain endpoints:

#### Dashboard
- `GET /dashboard/summary`

#### Candidate profile
- `GET /candidate/profile`
- `PUT /candidate/profile`
- `POST /candidate/profile/cv` (uploads CV file)

#### Jobs
- `GET /jobs` (includes applicantCount and default intelligence fields)
- `POST /jobs`
- `PATCH /jobs/:jobId/status`

#### Applications
- `GET /applications` (candidate sees own; others see permitted set)
- `PATCH /applications/:applicationId/status`
  - records history
  - queues email notifications

---

### 4.2 Persistence, seeding, and data model helpers
**File:** `backend/src/store.ts`

- Persists state to `backend/data/db.json`
- Uploads stored under `backend/uploads/`
- Seeds default users:
  - recruiter@intelyhire.dev / Passw0rd!
  - admin@intelyhire.dev / Passw0rd!
  - founder@intelyhire.dev / Passw0rd!
- Provides helpers:
  - `loadState`, `saveState`
  - `createEmptyCandidateProfile`
  - `createApplicationHistoryEntry`
  - `createEmailLog`

---

## 5. Backend “AI” MVP endpoints (heuristic implementations)

Implemented in `backend/src/index.ts`:

### Matching & trust
- `POST /ai/match`
  - skill overlap + keyword overlap + optional location match
  - returns `score`, `missing_skills`, `reasons`, `recommendation`

- `POST /ai/career-intelligence`
  - computes careerScore using profile counts for experience/skills/projects/education/certs buckets
  - returns technical/communication scores + tier.

- `POST /ai/trust`
  - MVP alias that maps trust_score to careerScore-style heuristic
  - returns `trust_score`, `level`, `risks`

### Interview flow (session-based)
- `POST /ai/interview/start`
  - creates interview session with 4 prompt templates
- `POST /ai/interview/answer`
  - scores answers using keyword seeds
  - completes session after all questions are answered

### Candidate auto-apply
- `POST /ai/auto-apply/run`
  - creates “applied” applications for open jobs not already applied to
  - generates cover letter text from profile summary/skills
  - queues recruiter email logs

---

## 6. Human approval mode: draft review pipeline

**File:** `backend/src/reviewApi.ts`

Implements “application packages” draft generation and explicit approve/reject gating.

### Draft APIs
- `GET /application-packages` (list drafts visible to current role)
- `POST /ai/application-packages/generate`
  - generates:
    - `ApplicationDraft` with `matchScore`, `trustScore`
    - email subject/body + cover letter text
    - draft status: `generated`
- `PATCH /application-packages/:draftId`
  - candidate can edit email/cover letter text
  - draft status becomes `user_edited`
  - blocked once draft is `sent` / `approved` / `rejected`

### Approve / reject
- `POST /application-packages/:draftId/approve`
  - queues recruiter email notification
  - creates/updates an `Application` with `coverLetter`
  - marks draft status `sent`

- `POST /application-packages/:draftId/reject`
  - marks draft status `rejected`

---

## 7. Existing docs and TODO tracking

- `README.md` documents MVP scope and how to run.
- `docs/architecture.md` describes architectural intent and delivery order.
- Root `TODO.md` tracks current work items toward a Career OS dashboard-first layout and testing.

---

## 8. Summary of what is “done” in this work snapshot

Across frontend + backend, the following are fully implemented in the current code:
- Role-based portal UI (candidate/recruiter/admin/founder)
- Candidate application review center with explicit **Approve & Send** and reject gating
- Candidate profile management + CV upload
- Application status workflow (pipeline statuses)
- Recruiter job management and application pipeline updates
- MVP heuristic AI endpoints: match, trust, career intelligence, interview sessions, and auto-apply
- Draft generation/review pipeline for application packages (`reviewApi.ts`)
- Career OS UI components: score card, skill gap analysis, application stats, job recommendations, and “Ask IntelyAI” coach modal

---

End of documentation.

