# ADR 004 — Static, client-only application with static hosting

**Status:** Accepted (2026-09-10) — hosting provider choice pending owner decision

## Context
The game is single-player. All state (player position, door/seat/TV state, chosen character) lives in the browser for the duration of a session. Nothing needs to be shared between players or remembered on a server. The brief listed GitHub Actions, Cloud Run and Cloud SQL as *potential* infrastructure and asked for the simplest architecture that supports the roadmap.

## Decision
- The product is a **static bundle** (HTML, JS, glTF, textures) produced by `vite build`. There is **no backend process, no API and no runtime cloud service**.
- Source is an **npm-workspace monorepo** with `packages/shared` (game logic, no Three.js/DOM) and `packages/client` (rendering, input, UI). Two packages exist only to enforce the logic/rendering boundary through package dependencies.
- **Hosting is static.** Default recommendation: **GitHub Pages** deployed by GitHub Actions on every merge to `main` (no cloud project, IAM or secrets). If the owner requires GCP, the equivalent is a **Cloud Run service running a static file container** (nginx/Caddy) deployed via Workload Identity Federation. The owner picks one before the deployment feature (F14); the application code is identical either way.
- Staging/production separation is not needed for a static single-player game; `main` is the deployed version.

## Alternatives considered
- **Node service serving the client (original plan when multiplayer was in scope).** Only justified by a WebSocket endpoint; without multiplayer it is an idle process that costs money and adds an attack surface.
- **Cloud Storage bucket website + HTTPS load balancer.** Works, but the load balancer setup is more infrastructure than GitHub Pages or a Cloud Run container for the same result.
- **Firebase Hosting.** Good static hosting, but another console/CLI to learn for no advantage over the two options above.
- **Single package instead of two.** Simpler tooling, but the "no Three.js in game logic" rule would rely on discipline alone.

## Consequences
- Zero runtime cost on GitHub Pages; near-zero on Cloud Run with scale-to-zero.
- No secrets, no IAM and no production-data policies to enforce in the default option; the deployment feature is low risk.
- Anything that needs a server later (multiplayer, leaderboards, shared persistence) is a new ADR and a genuine architecture change; the plain-data world state keeps it possible but nothing is prepared for it.
- If GitHub Pages is chosen and the repository is private, Pages requires a paid GitHub plan; a public repository or the Cloud Run option avoids that.
