# IntelyHire - Implementation TODO

## Human Approval Mode (Application Review Center) MVP slice
- [x] Backend: add new data model `applicationDrafts` to `DbState` and seed/extend store types.
- [x] Backend: implement endpoints
  - [x] `GET /application-packages`
  - [x] `POST /ai/application-packages/generate`
  - [x] `PATCH /application-packages/:draftId`
  - [x] `POST /application-packages/:draftId/approve`
  - [x] `POST /application-packages/:draftId/reject`
- [x] Backend: ensure outbound email queueing only happens on approve.
- [x] Frontend: add “Application Draft” type support.
- [x] Frontend: add API calls for draft generation/edit/approve/reject.
- [ ] Frontend: add “Application Review Center” UI + wire into candidate workflow.
- [ ] Testing: validate approval gating (no email queued before approve).

