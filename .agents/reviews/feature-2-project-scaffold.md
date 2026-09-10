# Independent Review — feature/2-project-scaffold

Base: main

Reviewed commit: 8472f0b85cc962a277f799fc6e63ace6bdc30ced (plus the complete uncommitted working tree; the branch has no commits ahead of `main`)

Issue: #2 — F01 Project scaffold and verification pipeline

Reviewer: claude (Claude Fable 5.1), 2026-09-10

Inputs read: `AGENTS.md`, `.agents/prompts/reviewer.md`, `.agents/policies/autonomy.md`, `docs/evaluation.md`, `docs/architecture.md`, ADRs 001–006, Issue #2, `.agents/plans/2-project-scaffold.md`, `git diff main` (tracked) and every untracked file.

## Independent verification performed

| Check | Result |
|---|---|
| `./scripts/verify.sh` (Node v22.14.0, npm 10.9.2) | Pass: ESLint + Prettier clean, `tsc --noEmit` in both packages, 1 Vitest test passed, shared `dist/` and client bundle built |
| `./scripts/verify.sh` second run with `dist/` present | Pass, still exactly 1 test file (explicit Vitest `include` prevents compiled test copies) |
| `npm run dev -w packages/client` + HTTP GET | Served `index.html` containing the `<canvas>` placeholder; transformed `main.ts` resolves the workspace import to `packages/shared/src/index.ts` |
| `npm ls --workspaces --depth=0` | All dependencies valid, both workspaces linked; lockfile v3 contains `packages/*` links |
| `npm audit` | 0 vulnerabilities |
| `git diff --check main` | Clean |
| Working tree after verify | Unchanged (build output is ignored by `.gitignore`) |
| Runtime code inspection | `packages/shared/src/index.ts` exports one string; `packages/client/src/main.ts` writes it into a `<p>`. No game logic, no Three.js, no DOM use in `shared` |

Acceptance criteria:

- [x] `npm ci && ./scripts/verify.sh` passes locally (verified above; `npm ci` consistency confirmed via `npm ls`)
- [ ] `./scripts/verify.sh` passes in GitHub Actions — **not verifiable until pushed**; workflow reviewed statically and looks correct (`setup-node` LTS with npm cache, `npm ci`, then `verify.sh`, `contents: read` permissions)
- [x] Trivial unit test in `packages/shared` runs (`packages/shared/src/index.test.ts`, run via root `vitest run`)
- [x] `npm run dev -w packages/client` serves a page with a canvas placeholder
- [x] No application/game logic beyond a minimal hello-world entry

Issue scope items (workspaces, shared, client, Vite, TS strict, ESLint, Prettier, Vitest, verify.sh, CI on Node LTS, `docs/development.md`, trimmed `.env.example`, README description) are all present. Architecture compliance: two-package boundary (ADR 004) is enforced by the workspace dependency; `shared` compiles with `lib: ["ES2022"]` and `types: []`, so DOM/Three.js leakage would fail type-check (ADR 002); build output is a static bundle (ADR 004).

## Critical

None.

## Major

None.

## Minor

### M1. Unrelated workflow-tooling changes are bundled into the feature branch

- **Evidence:** `scripts/start-feature.sh` (new `model` argument, Codex sandbox/approval flags), `scripts/review-feature.sh` (rewritten from a stub into an agent launcher), `.agents/prompts/reviewer.md` (two wording changes). None of these are in Issue #2's scope list.
- **Why it matters:** `AGENTS.md` Definition of Done requires "No unrelated changes are included", and PR #3 shows this tooling is already being iterated separately. Mixing it into F01 makes the scaffold PR harder to review and revert, and the `.github/workflows/` / `.agents/` paths are CODEOWNERS-gated areas.
- **Recommended action:** Commit these three files as a separate change (or PR) titled for the agent-tooling work, or if the owner intends them to ride along, state that explicitly in the PR description so the deviation from the DoD is a recorded decision.

### M2. `review-feature.sh` overwrites prior reviews and under-identifies what was reviewed

- **Evidence:** `scripts/review-feature.sh` does `cat > "$out"` unconditionally and records only `Reviewed commit: $(git rev-parse HEAD)`, while the prompt it emits instructs the reviewer to include uncommitted changes.
- **Why it matters:** A second run silently destroys the previous review artifact (evidence is supposed to be preserved per `AGENTS.md`), and a reader of the artifact cannot tell that the reviewed state differs from `HEAD` (as is the case right now: HEAD is `main`'s tip and everything reviewed is uncommitted).
- **Recommended action:** Refuse to run (or move the old file aside) when `$out` already exists, and add a line such as `Working tree: dirty (N changed files)` derived from `git status --porcelain` to the header. Only applies if M1's changes remain in this branch.

### M3. Evidence record misstates the installed ESLint version

- **Evidence:** `.agents/plans/2-project-scaffold.md` says "ESLint 9 emits a deprecation notice but lint passes"; `package.json` requests `eslint ^10.10.0` and `package-lock.json` resolves `eslint@10.10.0`.
- **Why it matters:** The plan is the verification evidence of record (`AGENTS.md` DoD); a stale statement about the toolchain misleads the next agent that reads it.
- **Recommended action:** Correct the sentence (and re-check whether any deprecation notice still appears with ESLint 10; the local run in this review printed none).

### M4. Local and CI Node versions are not aligned and CI floats

- **Evidence:** `package.json` `engines.node >=22.14.0`; `README.md`/`docs/development.md` say "22.14 or newer"; `.github/workflows/ci.yml` uses `node-version: 'lts/*'`, which resolves to whatever the current LTS line is (Node 24.x today, not 22).
- **Why it matters:** The documented minimum version is never exercised in CI, and an LTS rollover can turn CI red on a day with no code change, undermining `verify.sh` as the "stable verification pipeline" the issue asks for.
- **Recommended action:** Add a `.nvmrc` (or `.node-version`) with the chosen LTS line and switch CI to `node-version-file`, then quote that file in the docs. Alternatively, keep `lts/*` but state in `docs/development.md` that CI tracks the current LTS and local development should too.

## Suggestions

### S1. Remove root-level template leftovers that contradict the target layout

`src/.gitkeep`, `tests/unit/.gitkeep`, and `tests/integration/.gitkeep` remain from the template. `docs/architecture.md` §4 places all code under `packages/` and keeps only `tests/e2e/` at the root. Deleting the three placeholder directories (a follow-up is fine since the issue does not list it) avoids new contributors or agents putting code in the wrong place.

### S2. The `shared` build output is currently unused

`packages/shared/package.json` points `exports` at `./src/index.ts`, so Vite and Vitest consume the TypeScript source directly and `packages/shared/dist/` is produced by `verify.sh` but never read. Either drop the shared `build` script (type-check already validates the package) or keep it deliberately and add one sentence in `docs/development.md` explaining it exists for future Node consumers. Low priority; nothing is broken.

### S3. Root config files are outside every tsconfig

`vitest.config.ts` is not included by any `tsconfig.json`, so a type error in it would only surface at runtime. Optional: give the root `tsconfig.json` an `include` of the root `*.ts` config files with `noEmit`, or accept the gap given the file is three lines.

### S4. `docs/` is excluded from Prettier

`.prettierignore` deliberately skips `docs/`, `.agents/`, `AGENTS.md`, etc. to avoid churn on planning documents. That is reasonable now, but `docs/development.md` is being actively maintained by this feature; consider un-ignoring `docs/development.md` and `docs/architecture.md` once the current planning documents have been formatted once.

## Verdict

PASS WITH MINOR FINDINGS

All in-scope acceptance criteria that can be checked locally are met and were reproduced independently. The one criterion that cannot be checked (hosted CI) is blocked only on pushing the branch. None of the findings affect correctness of the scaffold; M1 and M3 should be addressed before or in the PR because they concern the process artifacts `AGENTS.md` relies on.
