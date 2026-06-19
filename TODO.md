# IntelyHire - Implementation TODO

## Authentication / Role-aware sign up & redirect (Candidate / Recruiter / Admin)
- [ ] Update Frontend AuthCard to support role selection: Candidate, Recruiter, Admin (and map Admin+Founder to Admin portal)
- [ ] Frontend: allow admin/founder role during register and login redirect to correct workspace
- [ ] Update frontend api/register typing to accept admin role
- [ ] Backend: allow /auth/register to accept role: admin|founder in addition to candidate|recruiter
- [ ] Backend: ensure seeded profiles exist for new admin/founder users (no extra profile needed)
- [ ] Validate: candidate cannot access recruiter/admin workspaces, recruiter cannot approve candidate drafts

## Human Approval Mode (Application Review Center) MVP slice
- [ ] Frontend add “Application Review Center” UI + wire into candidate workflow (if not already)
- [x] Backend: add new data model `applicationDrafts` to `DbState` and extend store types.
- [x] Backend: implement endpoints
  - [x] `GET /application-packages`
  - [x] `POST /ai/application-packages/generate`
  - [x] `PATCH /application-packages/:draftId`
  - [x] `POST /application-packages/:draftId/approve`
  - [x] `POST /application-packages/:draftId/reject`
- [x] Backend: ensure outbound email queueing only happens on approve.
- [x] Frontend: add “Application Draft” type support.
- [x] Frontend: add API calls for draft generation/edit/approve/reject.
- [ ] Testing: validate approval gating (no email queued before approve).

