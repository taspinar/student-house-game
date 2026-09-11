# Development

## Prerequisites and setup

Use Node.js LTS (22.14 or newer) with npm. CI selects the current LTS with `actions/setup-node`. Run commands from the repository root unless noted otherwise.

```sh
npm ci
npm run dev -w packages/client
```

Open the URL printed by Vite (normally http://localhost:5173). The client displays a Three.js placeholder scene with lighting, a fixed-pitch camera and a debug overlay; press Q/E to snap the camera yaw. No environment variables or external services are required; there is no need to copy `.env.example`.

## Packages

- `packages/shared`: renderer-independent TypeScript, checked without DOM globals. The initial export is a greeting, with a trivial Vitest unit test running in Node.
- `packages/client`: Vite, TypeScript and Three.js. Its renderer consumes plain render-state objects; world and game logic remain unimplemented.

Both packages extend the root strict TypeScript configuration. These private internal packages resolve shared TypeScript source directly; Vite bundles it for the browser. The shared build emits JavaScript and declarations into `packages/shared/dist`; the static client build is in `packages/client/dist`. Generated output is ignored by Git.

## Render loop and adapters

`packages/client/src/main.ts` stands in for the `app` module (architecture §5.2) until it lands: it owns the single `requestAnimationFrame` loop and the plain `RenderState` object, input handlers mutate that object, and every frame passes it to the renderer. Renderers live in `packages/client/src/render/` and implement `RenderAdapter<State>` (`render(state)`, `resize()`, `dispose()`); `render` reads plain objects each frame, keeps its Three.js objects private, and never retains or mutates caller-owned state. Only render adapters (currently `render/scene.ts`) import `three`; `packages/shared` never does. Pure rig and layout maths such as `render/camera-math.ts` stay Three.js-free so Vitest can test them in Node. New adapters (for example `render/world`) are created once in `main.ts` and called from the same loop; the FPS readout restarts its sample after any frame gap longer than 1 s, so a hidden tab reads `--` rather than a near-zero rate.

## Verification

```sh
./scripts/verify.sh
```

The stable verification entry point runs ESLint and Prettier, type-checks both workspaces, runs Vitest once (not watch mode), and builds both packages. Every stage must succeed. The script can be invoked from any working directory and installs locked dependencies if `node_modules` is absent. Use `npm ci` explicitly for a clean dependency installation.

Individual commands:

- `npm run lint`: code linting and formatting checks.
- `npm run format`: format supported files; existing planning/workflow documents are excluded to avoid unrelated churn.
- `npm run type-check`: strict checking in both packages.
- `npm test`: all `*.test.ts` unit tests, using Vitest's default Node environment.
- `npm run build`: shared output followed by the static client bundle.

The client build prints a Vite warning that the chunk exceeds the 500 kB pre-gzip threshold. That size is Three.js itself (about 130 kB gzipped) and is expected; no action is needed until the bundle grows beyond the renderer.

Commit `package-lock.json` with dependency changes. GitHub Actions runs `npm ci` and the same verifier on pull requests and pushes to `main`. Deployment and browser E2E tests belong to later features.
