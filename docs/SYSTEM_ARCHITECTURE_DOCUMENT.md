# IntelyHire — System Architecture Document (Enterprise)

This document explains how IntelyHire components work together end-to-end.

> Note: The current repository contains an MVP that uses a single Express backend with local JSON persistence. The architecture below describes the *intended enterprise architecture* (client → API gateway → domain services → engines → data layer). The MVP implements many of these responsibilities inside a monolith so teams can split into microservices later.

---

## 1) High-level system architecture

```text
┌───────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                         │
└───────────────────────────────────────────────────────────┘

    Candidate Portal     Recruiter Portal     Admin Portal
           │                    │                  │
           └────────────────────┼──────────────────┘
                                │
                                ▼

┌───────────────────────────────────────────────────────────┐
│                     API GATEWAY                           │
│             Authentication & Routing                      │
└───────────────────────────────────────────────────────────┘
                                │
      ┌─────────────────────────┼─────────────────────────┐
      │                         │                         │
      ▼                         ▼                         ▼

 User Service         Candidate Service        Recruiter Service

      │                         │                         │
      └─────────────────────────┼─────────────────────────┘
                                │
                                ▼

┌───────────────────────────────────────────────────────────┐
│                CAREER INTELLIGENCE ENGINE                 │
└───────────────────────────────────────────────────────────┘

 CV Parsing
 Skills Extraction
 Employability Scoring
 Career Readiness Analysis
 Skills Gap Analysis

                                │
                                ▼

┌───────────────────────────────────────────────────────────┐
│                  JOB INTELLIGENCE ENGINE                  │
└───────────────────────────────────────────────────────────┘

 Job Aggregation
 Job Validation
 Duplicate Detection
 Scam Detection
 Trust Scoring

                                │
                                ▼

┌───────────────────────────────────────────────────────────┐
│                    SMART MATCHING ENGINE                  │
└───────────────────────────────────────────────────────────┘

 Candidate Embeddings
 Job Embeddings
 Similarity Search
 Suitability Ranking
 Opportunity Prioritization

                                │
                                ▼

┌───────────────────────────────────────────────────────────┐
│                   APPLICATION ENGINE                      │
└───────────────────────────────────────────────────────────┘

 Resume Generation
 Cover Letter Generation
 Application Drafting
 User Approval Workflow
 Submission Engine

                                │
                                ▼

┌───────────────────────────────────────────────────────────┐
│                    RESPONSE TRACKER                       │
└───────────────────────────────────────────────────────────┘

 Application Monitoring
 Recruiter Interaction Tracking
 Interview Tracking
 Offer Tracking

                                │
                                ▼

┌───────────────────────────────────────────────────────────┐
│                    LEARNING ENGINE                        │
└───────────────────────────────────────────────────────────┘

 Match Optimization
 Success Pattern Detection
 Recommendation Improvement
 Feedback Processing

                                │
                                ▼

┌───────────────────────────────────────────────────────────┐
│                     DATA LAYER                            │
└───────────────────────────────────────────────────────────┘

 PostgreSQL
 Redis
 Qdrant Vector Database
 Object Storage (S3)

                                │
                                ▼

┌───────────────────────────────────────────────────────────┐
│                ANALYTICS & REPORTING                      │
└───────────────────────────────────────────────────────────┘

 Candidate Analytics
 Recruiter Analytics
 Platform Analytics
 AI Performance Analytics
```

### How requests flow (example: candidate applying)
1. Candidate portal requests authentication + candidate profile data.
2. Candidate uploads CV → backend stores file and updates `cvUrl`.
3. Candidate requests an application package draft for a job.
4. Application engine generates a draft (resume/cover letter content, plus match/trust indicators).
5. Candidate reviews and **approves & sends**.
6. Submission engine creates an application record and emits events for notifications + tracking.
7. Later, recruiter updates pipeline status → response tracker persists status changes.
8. Learning engine captures outcomes (feedback) and improves matching/recommendations.

---

## 2) Domain services (what each service owns)

### 2.1 User Service / Authentication & Identity
- Responsibilities
  - Register/login
  - JWT issuance/refresh
  - Role assignment (candidate, recruiter, admin, founder)
  - Audit log of auth events

### 2.2 Candidate Service
- Responsibilities
  - Candidate profile CRUD
  - CV upload + metadata
  - Candidate skills/experience modeling
  - Career readiness indicators (as outputs from Career Intelligence Engine)

### 2.3 Recruiter Service
- Responsibilities
  - Job CRUD
  - Job open/close
  - Application pipeline updates
  - Recruiter feedback collection
  - Per-recruiter reporting endpoints

### 2.4 Career Intelligence Engine
- Purpose: evaluate employability and readiness
- Outputs
  - `careerScore` and `readiness` (e.g., tiers)
  - skills gap insights

**Pipeline (enterprise):**
- CV upload → extraction → skills detection → experience analysis → scoring → gap analysis

### 2.5 Job Intelligence Engine
- Purpose: verify opportunities and reduce low-quality postings
- Outputs
  - `trustScore`, `verified`
  - fraud/scam risk signals

**Pipeline (enterprise):**
- Job source ingestion → validation → duplication detection → scam detection → trust scoring

### 2.6 Smart Matching Engine
- Purpose: connect candidates to jobs optimally
- Inputs
  - Candidate profile & skills & experience
  - Job requirements
  - Career score and readiness
- Outputs
  - `matchScore` / ranking and prioritized opportunities

**Pipeline (enterprise):**
- Candidate embeddings + Job embeddings → vector similarity → suitability ranking → opportunity prioritization

### 2.7 Application Engine
- Purpose: generate application artifacts and manage approval
- Responsibilities
  - Draft resume/cover letter/app content
  - Draft generation and editing
  - **User approval workflow**
  - Submission into tracking + notifications

### 2.8 Response Tracker
- Purpose: track outcomes and interactions
- Responsibilities
  - status progression (applied → interviewed → offered → hired)
  - recruiter responses
  - interview sessions
  - offer generation/status

### 2.9 Learning Engine
- Purpose: continuous improvement
- Responsibilities
  - consume feedback and outcomes
  - detect success patterns
  - improve ranking models/recommendations

---

## 3) Database architecture

> Target (enterprise) SQL schema. The MVP currently uses local JSON persistence but the schema below documents the intended normalized model.

### 3.1 Users
```sql
users
-----
id
email
password_hash
role
status
created_at
updated_at
```

### 3.2 Candidate Profiles
```sql
candidate_profiles
------------------
id
user_id
headline
bio
location
linkedin_url
github_url
portfolio_url
career_score
readiness_level
```

### 3.3 Skills
```sql
candidate_skills
----------------
id
candidate_id
skill_name
proficiency
verified
```

### 3.4 Work Experience
```sql
candidate_experience
--------------------
id
candidate_id
company
position
start_date
end_date
description
```

### 3.5 Jobs
```sql
jobs
----
id
company_id
title
description
salary_min
salary_max
location
trust_score
verification_status
```

### 3.6 Matches
```sql
matches
-------
id
candidate_id
job_id
match_score
ranking
```

### 3.7 Applications
```sql
applications
------------
id
candidate_id
job_id
status
submitted_at
```

### 3.8 Recruiter Feedback
```sql
recruiter_feedback
------------------
id
application_id
score
comments
```

---

## 4) AI layer architecture (what each AI pipeline does)

> Current MVP uses heuristic implementations. The enterprise design replaces heuristics with production ML/NLP/LLM pipelines.

### 4.1 Career Intelligence AI
**Purpose:** evaluate employability.

**Enterprise pipeline:**
```text
CV Upload
    ↓
Text Extraction
    ↓
Skills Detection
    ↓
Experience Analysis
    ↓
Career Scoring
```

**Output (example):**
```json
{
  "careerScore": 87,
  "readiness": "Highly Competitive"
}
```

### 4.2 Job Intelligence AI
**Purpose:** verify opportunities.

**Enterprise pipeline:**
```text
Job Source
    ↓
Data Extraction
    ↓
Validation
    ↓
Fraud Detection
    ↓
Trust Score
```

**Output (example):**
```json
{
  "trustScore": 94,
  "verified": true
}
```

### 4.3 Matching AI
**Purpose:** connect the right people to the right jobs.

**Inputs:**
- Candidate profile & skills & experience & career score
- Location & salary expectations
- Job requirements

**Output (example):**
```json
{
  "matchScore": 96
}
```

---

## 5) Microservices architecture (intended decomposition)

```text
auth-service
candidate-service
recruiter-service
job-service
career-intelligence-service
job-intelligence-service
matching-service
application-service
tracking-service
notification-service
analytics-service
learning-engine-service
```

### Communication
- Synchronous: REST APIs
- Asynchronous: events/queue (e.g., RabbitMQ)

**Example (CV uploaded):**
```text
CV Uploaded
      ↓
RabbitMQ Event
      ↓
Career Intelligence Service
      ↓
Score Generated
      ↓
Matching Service Triggered
```

---

## 6) Frontend architecture

> The MVP uses a single React portal with role-based workspaces.

### Client routes (enterprise)
```text
web/
  landing
  candidate
  recruiter
  admin
```

### Candidate dashboard
- Career score
- Job matches
- Applications pipeline
- Interviews and offers
- AI career coach
- Settings

### Recruiter dashboard
- Jobs
- Candidates
- Application pipeline
- Interviews
- Reports

### Admin dashboard
- Analytics
- Users
- Jobs compliance
- AI monitoring
- System health

---

## 7) Security & compliance

### Authentication
- JWT + refresh tokens
- OAuth (optional)
- 2FA (optional)

### Privacy
- Data encryption at rest and in transit
- Consent tracking
- Audit logs
- Data deletion requests

### Compliance
- GDPR
- Kenya Data Protection Act
- Audit trails and retention policies

---

## 8) Recommended technology stack

### Frontend
- Next.js 15
- TypeScript
- TailwindCSS
- ShadCN UI
- TanStack Query
- Zustand

### Backend
- NestJS (TypeScript)

### Databases
- PostgreSQL
- Redis
- Qdrant vector database

### Messaging
- RabbitMQ

### Storage
- AWS S3 / Cloudflare R2

### AI
- OpenAI
- LangChain
- Qdrant embeddings

### Deployment
- Docker
- Kubernetes
- GitHub Actions

---

## 9) Development roadmap alignment

### Phase 1 (MVP)
- Authentication
- Candidate profiles
- CV upload
- Career readiness score
- Job management
- Smart matching (heuristic/early model)

### Phase 2
- AI Resume Generator
- Cover Letter Generator
- Application Engine with approval workflow
- Recruiter dashboard

### Phase 3
- Learning engine
- Opportunity validation
- Recruiter analytics
- Interview tracking

### Phase 4
- AI Career Coach
- Predictive hiring analytics
- Enterprise recruiter features
- Regional expansion across Africa

