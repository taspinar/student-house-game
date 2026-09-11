# Issue #5 — Rendering foundation verification record

- Issue: https://github.com/taspinar/student-house-game/issues/5
- Date: 2026-09-11
- Base commit: 626b8b5
- Implementation reference: uncommitted working tree on `feature/5-rendering-foundation`.
- No pre-existing plan; the issue states that no separate implementation plan is required. This file records completion evidence, as `.agents/plans/2-project-scaffold.md` does for F01. Copy the acceptance evidence below into the pull request description.
- Independent reviews (review and triage artifacts are local workflow files and are not committed):
  - Review 01 — PASS WITH MINOR FINDINGS; all approved `FIX_NOW` items implemented, the rest deferred as #6–#9.
  - Review 02 — CHANGES REQUIRED because unrelated triage tooling had been bundled into the diff and `scripts/verify.sh` replaced; resolved by restoring `scripts/verify.sh` to its `main` version and removing the tooling from this change.
  - Review 03 — PASS WITH MINOR FINDINGS; approved `FIX_NOW` items implemented (FPS readout after a hidden tab, shadow-frustum comment, this record's references, the render-loop section in `docs/development.md`, `camera-math` boundary tests); the rest deferred as #10–#12.
- The evidence below was recorded after the approved `FIX_NOW` findings were implemented.

## Implemented scope

Three.js renderer with a device-pixel-ratio cap of 2, resize handling, hemisphere and directional lighting with shadows, a placeholder ground plane and three boxes, a fixed-pitch camera rig with `Q` / `E` yaw snapping, a debug overlay, and a `RenderAdapter` interface that reads plain render-state objects. The pure rig maths live in `packages/client/src/render/camera-math.ts` so they can be unit-tested without Three.js.

## Test environment

| Item | Value |
| --- | --- |
| Machine | Apple silicon MacBook, macOS 15 (Darwin 24.6.0) |
| Browser | Chrome 152 (hardware-accelerated WebGL, not headless) |
| Window / canvas CSS size | 1728 × 902 |
| Device pixel ratio | 2 (display native); drawing buffer 3456 × 1804 |
| Server | `npm run dev -w packages/client` (Vite 8.3.0) on Node v22.14.0 |

## Acceptance evidence

- **≥ 55 FPS on a mid-range laptop:** the debug overlay reported a steady **120 FPS** on the machine above, with shadows enabled, at 1728 × 902 and DPR 2 (six consecutive 0.7 s samples: 104, then 120 five times; the first sample includes page start-up). The readout is averaged over a 0.5 s window, so the value is the sustained rate rather than an instantaneous frame time. Headless software rendering (SwiftShader) reports 20–60 FPS and is not representative; the number above supersedes it.
- **Resize keeps output and aspect correct:** dispatching `resize` keeps the drawing buffer equal to the canvas CSS size multiplied by the capped pixel ratio, and the camera aspect is updated in the same handler. Measured by overriding `window.devicePixelRatio`: at DPR 1 the buffer was 1728 × 902, at DPR 3 it was 3456 × 1804 — the cap of 2 holds after a resize, not only at construction.
- **Camera yaw snapping with `Q` / `E`:** nine `E` presses from the initial 180° yaw read **225°** (wrapped into `[0, 2π)` instead of the previous 585°/540°); nine `q` presses returned it to 180°, and one further `q` gave 135°. Synthetic `keydown` events carrying `repeat`, `ctrlKey`, `metaKey` or `altKey` left the yaw unchanged.
- **Placeholder geometry and lighting:** screenshot confirms the sky background, green ground plane and three boxes, each casting a soft-edged shadow (`PCFShadowMap` with `shadow.radius = 3`). The widest box's shadow is no longer clipped now that the sun's orthographic shadow frustum is set to ±16.
- **Debug overlay:** shows `FPS`, `Camera yaw` and `Target`, refreshed four times per second rather than every frame. The FPS sample starts on the first rendered frame and restarts after any frame gap longer than 1 s (for example a hidden tab), showing `--` until a full window has elapsed instead of a near-zero rate.
- **Rendering reads state through the adapter:** `createSceneRenderer` returns `RenderAdapter<RenderState>`; `render(state)` consumes a plain `{ camera: { target, yaw } }` object and retains no caller-owned objects.
- **No Three.js in `packages/shared`:** `grep -rn three packages/shared/src` finds nothing; the package compiles with `types: []`.
- **Browser console:** clean on load — only Vite's two client-connection debug messages. The previous `THREE.WebGLShadowMap: PCFSoftShadowMap has been deprecated` warning is gone.
- **`./scripts/verify.sh` passed:** ESLint and Prettier clean, strict type-check in both workspaces, 4 Vitest tests in 2 files passed, both builds succeeded. Run the verifier under the same CPU architecture that `npm ci` used: the rolldown native binding is architecture-specific, and a mismatched shell (arm64 vs x86_64/Rosetta on Apple silicon) makes Vitest fail to load it. Vite reports a 520 kB pre-gzip client chunk (130 kB gzip), which is Three.js itself and is documented as expected in `docs/development.md`.

## Remaining status

Local implementation, review, triage and verification are complete. Deferred findings are tracked as Issues #6, #7, #8, #9, #10, #11 and #12. Changes are uncommitted; nothing was pushed, merged or deployed.
