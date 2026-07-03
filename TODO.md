# TODO.md

## Gmail integration (per-user OAuth) — implementation steps

- [x] Create Gmail OAuth integration with Google (read + send)
  - [x] Add backend endpoints: /email/google/auth/start and /email/google/auth/callback
  - [x] Generate OAuth state for CSRF protection and exchange code for tokens
  - [x] Store access/refresh tokens in `emailAccounts` for the authenticated user (refresh token for re-use)
- [x] Implement Gmail read APIs
  - [x] Add GET /gmail/messages?query=&limit= (search list)
  - [x] Add GET /gmail/message/:id (fetch headers/snippet/body as allowed)
  - [x] Enforce limits + require connected Google account + proper scope checks
- [x] Implement Gmail send APIs
  - [x] Add POST /gmail/send to send email via Gmail API using stored tokens
  - [x] Build RFC 2822 MIME message and call `users.messages.send`
- [ ] Wire real sending into existing app email flow (optional but recommended)
  - [ ] Add a “send now” worker/route for queued `emailLogs` entries
  - [ ] Update `emailLogs.status` from `queued` → `sent` (and store errors)
- [x] Add environment/config + security hardening
  - [x] Add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_OAUTH_REDIRECT_URI
  - [x] Add token encryption key (ENCRYPTION_KEY) and encrypt refresh tokens at rest
  - [ ] Add rate limiting + tighten CORS/auth checks for Gmail endpoints
- [ ] Add frontend UI (minimal)
  - [ ] Button to connect Gmail (call start endpoint, redirect)
  - [ ] Page to search/list messages and display snippets (optional)
- [ ] Testing
  - [ ] Manual test: connect Gmail → list inbox messages → send a test email
  - [ ] Security test: ensure tokens never returned to client

