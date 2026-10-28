# Changelog

All notable changes to VoteFlow are documented in this file.

## v1.0.0 — 2026-09-21

Initial release of VoteFlow — Web-Based Online Voting System.

- Voter authentication with `password_hash()` / `password_verify()`
- Six voting options with parties TDP, YSRCP, JSP, BJP, CONGRESS, and NOTA
- One-vote-per-voter restriction at UI, PHP, transaction, and database `UNIQUE(elector_id)` layers
- Admin dashboard with live MySQL totals
- Candidate management (add, view, delete)
- Voter status monitoring without exposing passwords
- Live results calculated from the `votes` table
- Docker and Docker Compose packaging
- Jenkins CI/CD pipeline (PHP, not Maven)
- Kubernetes manifests for local/Minikube use
- PHPUnit unit tests and Selenium WebDriver end-to-end tests
