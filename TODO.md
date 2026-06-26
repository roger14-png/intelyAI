# TODO.md

## AI Career Agent feature (bot UX with user authorization)

- [ ] Create an Agent Run model in backend types + MVP persistence behavior.
- [ ] Add backend routes:
  - [ ] POST /agent/run (prepare-only draft generation; no submission)
  - [ ] GET /agent/runs (candidate sees their runs)
  - [ ] POST /agent/run/:runId/approve (bulk approve -> queues emails + creates/updates applications)
  - [ ] POST /agent/run/:runId/reject (marks drafts rejected; no submission)
- [ ] Reuse existing draft generation + approve logic from backend/src/reviewApi.ts.
- [ ] Add frontend UI:
  - [ ] “AI Career Agent” section with Run / Review runs
  - [ ] Draft list for a run with match/trust + editable email/cover letter fields
  - [ ] Buttons: Approve & Send (per draft) + Approve All (still gated)
  - [ ] Reject per draft and/or per run
- [ ] Add ethical label in UI: “AI-prepared (not submitted until you approve)”.
- [ ] Ensure bot workflow never calls /ai/auto-apply/run by default.
- [ ] Test manually:
  - [ ] Run agent generates drafts
  - [ ] Approving a draft creates Application + queues EmailLog
  - [ ] Rejecting prevents submission

