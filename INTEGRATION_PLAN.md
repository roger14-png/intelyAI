# Backend-Frontend Integration Plan

## Overview
Emma Karen committed the frontend branch with React + Vite + TypeScript. This document outlines the backend redesign to meet the frontend requirements and ensure seamless integration.

## Current State

### Frontend Stack
- **Framework**: React 19.1.0
- **Build Tool**: Vite 7.0.6
- **Styling**: Tailwind CSS
- **State Management**: TanStack React Query v5.81.5
- **TypeScript**: v5.8.3

### Backend Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express 5.1.0
- **Database**: JSON file-based (db.json)
- **Auth**: JWT + bcryptjs
- **File Upload**: Multer

## Integration Requirements

### 1. API Contract Alignment
- Ensure all endpoints return consistent, frontend-expected responses
- Implement proper error handling with standardized error formats
- Add request/response validation using Zod schemas
- Support both JSON and file upload endpoints

### 2. Database Schema Consistency
- Maintain current JSON-based storage but optimize queries
- Ensure all entities have proper timestamps
- Add indexes/sorting for frequent queries
- Support filtering, pagination, and search

### 3. Authentication Flow
- JWT token-based authentication
- CORS configuration for frontend domain
- Token refresh mechanism
- Role-based access control (RBAC)

### 4. Real-time Features (Future)
- Prepare for WebSocket integration
- Message queuing for email notifications
- Background job processing

## Key Endpoints to Maintain/Enhance

### Authentication
- ✅ POST `/auth/register` - User registration
- ✅ POST `/auth/login` - User login
- ✅ GET `/auth/me` - Current user profile

### Candidate Profile
- ✅ GET `/candidate/profile` - Fetch profile
- ✅ PUT `/candidate/profile` - Update profile
- ✅ POST `/candidate/profile/cv` - Upload CV

### Jobs
- ✅ GET `/jobs` - List all jobs with applicant count
- ✅ POST `/jobs` - Create new job (recruiter)
- ✅ PATCH `/jobs/:jobId/status` - Update job status

### Applications
- ✅ POST `/jobs/:jobId/apply` - Apply to job
- ✅ GET `/applications` - List applications
- ✅ PATCH `/applications/:applicationId/status` - Update application status

### AI Features
- ✅ POST `/ai/match` - Job-candidate matching
- ✅ POST `/ai/career-intelligence` - Career score calculation
- ✅ POST `/ai/trust` - Trust score for candidates
- ✅ POST `/ai/interview/start` - Start AI interview
- ✅ POST `/ai/interview/answer` - Submit interview answer
- ✅ POST `/ai/auto-apply/run` - Automatic job applications

### Email Management
- ✅ GET `/email/accounts` - List connected email accounts
- ✅ POST `/email/accounts/connect` - Connect email account
- ✅ GET `/email/logs` - Email history
- ✅ POST `/email/accounts/:accountId/test` - Test email connection

## Implementation Phases

### Phase 1: Type Safety & Validation (Current)
- [ ] Create shared TypeScript interfaces
- [ ] Enhance Zod schema validation
- [ ] Add input/output validation layer
- [ ] Create API response wrapper

### Phase 2: Frontend Integration (Pending)
- [ ] Verify CORS configuration
- [ ] Test all endpoints with frontend
- [ ] Implement proper error responses
- [ ] Add pagination support

### Phase 3: Performance & Features (Pending)
- [ ] Optimize database queries
- [ ] Add caching layer
- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)

### Phase 4: Deployment & Monitoring (Pending)
- [ ] Environment configuration
- [ ] Error logging & monitoring
- [ ] Performance metrics
- [ ] Health check endpoints

## Database Structure

### Users
```json
{
  "id": "uuid",
  "fullName": "string",
  "email": "string",
  "passwordHash": "string",
  "role": "candidate|recruiter|admin|founder",
  "subscriptionPlan": "student|standard|active|professional",
  "verified": "boolean",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Jobs
```json
{
  "id": "uuid",
  "title": "string",
  "company": "string",
  "location": "string",
  "employmentType": "string",
  "description": "string",
  "skills": ["string"],
  "qualifications": ["string"],
  "merits": ["string"],
  "status": "open|closed",
  "createdBy": "uuid",
  "verified": "boolean",
  "jobTrustScore": "number",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Applications
```json
{
  "id": "uuid",
  "jobId": "uuid",
  "candidateId": "uuid",
  "status": "applied|reviewing|shortlisted|interview|offer|hired|rejected",
  "coverLetter": "string",
  "history": [{"status": "string", "changedBy": "uuid", "notes": "string", "timestamp": "ISO8601"}],
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Candidate Profiles
```json
{
  "userId": "uuid",
  "headline": "string",
  "location": "string",
  "summary": "string",
  "cvUrl": "string",
  "skills": ["string"],
  "certificates": ["string"],
  "education": [{"id": "uuid", "school": "string", "degree": "string", "year": "string"}],
  "experience": [{"id": "uuid", "title": "string", "company": "string", "years": "string", "description": "string"}]
}
```

## Frontend Integration Checklist

- [ ] Test authentication flow (login/register/logout)
- [ ] Test job listing and filtering
- [ ] Test job application submission
- [ ] Test candidate profile CRUD
- [ ] Test CV upload functionality
- [ ] Test email account connection
- [ ] Test AI matching algorithm
- [ ] Test career intelligence endpoint
- [ ] Test interview session flow
- [ ] Test auto-apply feature
- [ ] Verify error handling on frontend
- [ ] Check loading states and spinners
- [ ] Test responsive design on mobile

## Notes

- Current backend uses JSON file storage (`db.json`)
- All timestamps should be ISO 8601 format
- API runs on port 4000 by default
- Frontend should run on port 5173 (Vite default)
- CORS is configured to allow origin: true
