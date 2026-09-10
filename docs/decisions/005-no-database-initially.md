# ADR 005 — No database and no persistence

**Status:** Accepted (2026-09-10)

## Context
GCP Cloud SQL is available, but the brief asks to introduce it only if the game actually needs persistent relational storage. The roadmap's data: the character catalogue (static, ships with the build), the world/floor plan (static), and transient session state (player position, chosen character, door/seat/TV state). The game is single-player with no accounts, so there is nothing to store centrally.

## Decision
The roadmap uses **no database and no server-side persistence**. Static data lives in the repository; runtime state lives in the browser for the session. If a "remember my last character/settings" convenience is ever wanted, `localStorage` is sufficient and needs no ADR. Any need for server-side persistence (shared state, accounts, leaderboards) would require a new ADR that first evaluates the simplest option and only then Cloud SQL.

## Alternatives considered
- **Cloud SQL from the start.** Provisioning, credentials, migrations, cost and a high-risk production surface for zero current benefit; also impossible to use from a static client without adding a backend.
- **Firestore from the client.** Would need auth rules and a vendor SDK for data that does not exist yet.

## Consequences
- No migrations, no secrets, no production-data policies; deployment stays a static bundle.
- Reloading the page resets the session; this is accepted and matches the intended experience.
- Introducing persistence later is a deliberate, reviewed step rather than an accident.
