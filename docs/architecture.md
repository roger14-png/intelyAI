# Architecture Notes

This MVP deliberately keeps the first release simple:

- One React portal for all roles, with role-specific dashboards
- One Express API for auth, profiles, jobs, and applications
- Local JSON persistence during MVP development
- PostgreSQL + Prisma ready schema in `database/schema.sql`

## Delivery order

1. Authentication and roles
2. Candidate profiles and CV attachment flow
3. Job management and recruiter tools
4. Application workflow and notifications
5. Email account integration
6. Matching engine

## Why this shape

Microservices would slow the first release down. This structure keeps the domain boundaries clear while still making it straightforward to split services later:

- auth service
- user service
- job service
- application service
- notification service
- ai service