# ADR 002 — Three.js with TypeScript and Vite, no full game engine

**Status:** Accepted (2026-09-10)

## Context
ADR 001 chose real-time 3D in the browser. The rendering library must be mature, well documented (so agents implement it reliably), lightweight, and must not force a heavy editor-centric workflow. Candidates: Three.js, Babylon.js, PlayCanvas, Unity/Godot web exports, Phaser (2D only).

## Decision
Use **Three.js** (plain, without React Three Fiber) for rendering, **TypeScript** (strict) for all packages, and **Vite** for the client build. UI screens (title, character selection, prompts) are plain **DOM/HTML/CSS** overlays, not WebGL UI. No physics engine: collision is a small 2D circle-vs-box routine in `packages/shared`. Testing with **Vitest**; end-to-end smoke tests with Playwright later.

## Alternatives considered
- **Babylon.js.** Comparable capability with more built-in engine features (physics, GUI, inspector), but a larger bundle and fewer community examples for the minimal scene we need. Acceptable fallback if Three.js proves limiting.
- **PlayCanvas.** Excellent for the genre, but its strength is the hosted editor, which agents cannot drive; the engine-only path loses most of the benefit.
- **Unity / Godot WebGL export.** Large builds, slow load, opaque to text-based agents, editor-driven.
- **React Three Fiber.** Adds React as a dependency for a game with two DOM screens; declarative scene graphs also blur the simulation/render separation we want.
- **Phaser / PixiJS.** 2D only; excluded by ADR 001.

## Consequences
- Small bundle and fast load; huge example base for Three.js.
- We own the game loop, scene management and asset loading conventions; these must be kept simple and documented in `docs/development.md`.
- Rendering code lives only in `packages/client`; `packages/shared` must remain Three.js-free so it can be unit-tested in Node.
- glTF is the only runtime model format.
