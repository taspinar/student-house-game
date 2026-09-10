# Development

## Prerequisites and setup

Use Node.js LTS (22.14 or newer) with npm. CI selects the current LTS with `actions/setup-node`. Run commands from the repository root unless noted otherwise.

```sh
npm ci
npm run dev -w packages/client
```

Open the URL printed by Vite (normally http://localhost:5173). The scaffold displays a hello-world greeting and an empty, shaded canvas placeholder. No environment variables or external services are required; there is no need to copy `.env.example`.

## Packages

- `packages/shared`: renderer-independent TypeScript, checked without DOM globals. The initial export is a greeting, with a trivial Vitest unit test running in Node.
- `packages/client`: Vite, TypeScript, HTML and CSS. Imports shared code through the npm workspace dependency. No rendering or game logic is implemented yet.

Both packages extend the root strict TypeScript configuration. These private internal packages resolve shared TypeScript source directly; Vite bundles it for the browser. The shared build emits JavaScript and declarations into `packages/shared/dist`; the static client build is in `packages/client/dist`. Generated output is ignored by Git.

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

Commit `package-lock.json` with dependency changes. GitHub Actions runs `npm ci` and the same verifier on pull requests and pushes to `main`. Deployment and browser E2E tests belong to later features.
