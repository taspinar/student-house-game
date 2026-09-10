# ADR 001 — Stylized low-poly real-time 3D rendering

**Status:** Accepted (2026-09-10)

## Context
The game must run in a browser, be small in scope, and still present a recognisable, attractive student house. A plain 2D top-down view is explicitly too simple. Candidate approaches: isometric/2.5D with pre-rendered sprites, lightweight real-time 3D (stylized low-poly), and hybrids (pre-rendered 3D backgrounds with sprite characters). Characters must later be derived from reference photos of real people and be reproducible consistently for several characters. Agents will do most implementation, so the approach must be editable through code and data rather than through manual art tooling.

## Decision
Render the world as **stylized low-poly real-time 3D** with a fixed-pitch, snap-rotatable "dollhouse" camera (see `docs/architecture.md` §6.5). Flat/simple materials, one directional light plus ambient, no ceilings, walls faded when they occlude the player. Furniture and dressing come from low-poly glTF assets; the building shell is generated from floor-plan data (ADR 003).

## Alternatives considered
- **Isometric 2D with sprites.** Attractive and cheap to render, but every prop and every character needs sprites in multiple facings; rotating the camera is impossible; photo-derived characters would need 4–8 hand-drawn directional sprites each, which is hard to reproduce consistently. Depth sorting of large couches and doorways is fiddly.
- **Pre-rendered 3D backgrounds + sprite characters (2.5D).** Good visuals for fixed views, but the exterior-vs-interior viewpoints in the brief conflict, every layout change needs re-rendering, and the pipeline is tooling-heavy for agents.
- **Realistic 3D (PBR, baked lighting).** Higher fidelity than required; asset cost and performance risk do not fit the "relatively simple scope" constraint.

## Consequences
- One asset per object serves every camera angle; adding rooms or furniture is data work.
- Characters can share a single rig with per-character variation (ADR 006).
- Requires WebGL-capable browsers (universal on desktop; acceptable on modern mobile).
- Visual quality depends on consistent low-poly style across sourced assets; an asset manifest with style guidelines and license tracking is mandatory (F06).
- Real-time lighting is cheap; shadows are optional and can be disabled for performance.
