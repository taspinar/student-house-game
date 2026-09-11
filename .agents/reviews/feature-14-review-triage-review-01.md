# Independent Review — feature/14-review-triage

Issue: #14

Base: opus (does not exist locally or on `origin`; reviewed against `main` at `7dfa396`, which is also the feature branch HEAD)

HEAD at review start: 7dfa39693aa15477a2a254ad90ef2d191b67e583

Working tree changes included: yes (the entire change is uncommitted)

Reviewer: claude

## Scope reviewed

- Tracked diff vs `main`: `AGENTS.md`, `.agents/prompts/reviewer.md`, `docs/agentic-workflow.md`, `docs/evaluation.md`.
- Untracked: `tests/triage-review-test.sh`, `tests/apply-triage-test.sh`.
- Present on disk but git-excluded (see C1): `scripts/triage-review.sh`, `scripts/apply-triage.sh`, `.agents/prompts/triage-reviewer.md`, `.agents/prompts/triage-implementer.md`.
- No `.agents/plans/14-*.md` exists.

Verification performed:

| Check | Result |
| --- | --- |
| `./scripts/verify.sh` (lint, type-check, test, build) | passes |
| `bash tests/triage-review-test.sh` | passes |
| `bash tests/apply-triage-test.sh` | fails, exit 1 (see M1, M2) |
| Empty review (all sections `None.`) through `triage-review.sh` in a scratch clone | crashes (see M3) |
| `claude --tools`, `--permission-mode`, `--no-session-persistence`; `codex exec --output-last-message`, `--ephemeral` | flags exist in installed CLIs (Claude Code 2.1.268) |

## Critical

### C1. Core deliverables are excluded from git and cannot be committed

**Evidence.** `git status` shows only the four doc edits and the two test files. `git check-ignore -v` reports that `scripts/triage-review.sh`, `scripts/apply-triage.sh`, `.agents/prompts/triage-reviewer.md` and `.agents/prompts/triage-implementer.md` are excluded by `.git/info/exclude` lines 7–10. The same file also excludes `/.agents/reviews/` and `/.agents/triage/`. `git status --ignored` lists all of them as `!!`.

**Why it matters.** The scripts and prompts are the substance of Issue #14. `git add -A` or `git commit -a` will silently skip them, the PR diff will contain only docs and tests that reference files that do not exist on the branch, and CI or any other clone will fail. `.git/info/exclude` lives in the common git dir, is not versioned, and is shared by every worktree of this repository, so it also affects other sessions. The tests already depend on these files (`tests/triage-review-test.sh:6`, `tests/apply-triage-test.sh:6`).

**Recommended action.** Remove the four file entries (and, unless deliberately intended, the two directory entries) from `.git/info/exclude`, then `git add` the scripts and prompts. If review or triage artifacts are meant to stay out of history, encode that in the versioned `.gitignore` and say so in `docs/agentic-workflow.md`; note that `.agents/reviews/feature-2-project-scaffold.md` is already tracked, and `AGENTS.md` now makes "an approved triage artifact" part of the Definition of Done, which PR reviewers cannot check if the artifact is never committed. Also add `.agents/triage/.gitkeep` so the documented directory exists in the repository.

## Major

### M1. `tests/apply-triage-test.sh` fails on any branch other than `feature/13-*`

**Evidence.** Running the test on this branch exits 1 with no message. Tracing shows the first `apply-triage.sh` invocation returning `Error: current branch does not match source Issue #13. Current branch: feature/14-review-triage`, which aborts the `output="$(...)"` assignment under `set -e`. The fixture hard-codes Issue #13 (`tests/apply-triage-test.sh:9,40,76`) while `scripts/apply-triage.sh:129-144` requires the current branch to be `feature/<issue>-*`.

**Why it matters.** The Issue's acceptance criterion "Workflow shell tests pass" is not met, and the test can never pass on the branch that ships it, in CI (which checks out the PR head), or on `main`. Because the failure is a silent `set -e` abort, a developer sees only a non-zero exit.

**Recommended action.** Make the test independent of the repository it lives in: build a throwaway git repo under `mktemp -d` (init, commit a stub `scripts/verify.sh`, copy the two scripts and prompts in, `git checkout -b feature/13-apply-test`) and run the script there. This also stops the tests from writing fixtures into the real `.agents/reviews` and `.agents/triage` directories. At minimum, derive the Issue number from the current branch instead of hard-coding 13, and print a message before each assertion so failures are diagnosable.

### M2. `tests/apply-triage-test.sh` runs the real npm verification pipeline and cannot pass as written

**Evidence.** In a scratch clone on a `feature/13-*` branch, the first invocation reaches `Running repository verification...` and then fails with `npm is required` and `Error: repository verification failed with status 1`, because the test restricts `PATH` to `$tmp/bin:/usr/bin:/bin` (line 213) and `scripts/apply-triage.sh:523-526` always executes `./scripts/verify.sh` by path. The test sets `APPLY_TRIAGE_TEST_ACTIVE=1` on eleven invocations, but nothing in the repository reads that variable (`grep -rn APPLY_TRIAGE_TEST_ACTIVE` matches only the test itself).

**Why it matters.** Even with M1 fixed the test still fails everywhere. If npm were on the restricted PATH, every "successful" scenario would run `npm ci`, lint, type-check, Vitest and the Vite build inside a shell test, several times over. The `verification passed` assertions on lines 221 and 258 are therefore untestable.

**Recommended action.** Either let `apply-triage.sh` take its verification command from an overridable variable (for example `APPLY_TRIAGE_VERIFY_CMD`, defaulting to `./scripts/verify.sh`) and stub it in the test, or run the test inside the temporary repository suggested in M1 where `scripts/verify.sh` is a stub. Remove the unused `APPLY_TRIAGE_TEST_ACTIVE` or wire it to real behaviour.

### M3. A review with no findings crashes `triage-review.sh`

**Evidence.** With a review whose four sections all contain `None.` and a mock agent that prints `NO_FINDINGS`, the script aborts at `scripts/triage-review.sh:267` with `findings.tsv: No such file or directory` before the agent is even called. The awk parser only opens `$findings_file` on its first `printf ... > output` (line 122), so when no finding is emitted the file is never created, and `$(<"$findings_file")` fails under `set -e`. The later validation awk (line 417) would also fail because `ARGV[1]` does not exist.

**Why it matters.** A clean `PASS` review is the normal happy path of the workflow described in `docs/evaluation.md` and `docs/agentic-workflow.md`, and the `NO_FINDINGS` contract in `.agents/prompts/triage-reviewer.md` and the `NO_FINDINGS` handling in the script (lines 351-358, 400-405, 462, 564) are unreachable. No test covers this path.

**Recommended action.** Create the file up front (`: >"$findings_file"` next to line 77) and add a test case with an all-`None.` review that asserts an artifact with three `None.` sections and `No follow-up Issues created.` is produced.

### M4. Issue scope not delivered: `verify.sh` integration and CI wiring are missing

**Evidence.** `scripts/verify.sh` is unchanged from `main`; it still runs only the four npm stages. Neither `package.json` scripts nor `.github/workflows/ci.yml` reference `tests/*.sh`. Issue #14 lists "Integrate workflow checks into the existing project-specific `verify.sh`" in scope and "Workflow shell tests pass" and "The project-specific lint, formatting, type-check, test and build stages remain mandatory" in the acceptance criteria.

**Why it matters.** The new shell tests are never executed by any automated path, so regressions in the triage tooling (M1–M3 are examples) go unnoticed. The `verify.sh` "works from every directory" criterion is already satisfied by the existing `cd "$(dirname "${BASH_SOURCE[0]}")/.."`, so this item is purely additive.

**Recommended action.** Append the two workflow tests to `scripts/verify.sh` after the npm stages (keeping the npm stages first and mandatory), for example `bash tests/triage-review-test.sh && bash tests/apply-triage-test.sh`, or a loop over `tests/*-test.sh`. Add a `shellcheck` pass there or in CI if it is acceptable to require it (it is not installed locally, so I could not run it). Once M1/M2 are fixed the tests will be hermetic enough to run in CI.

## Minor

### Minor 1. Dangling documentation reference and no command reference for the new scripts

**Evidence.** `docs/agentic-workflow.md:19` says "See `docs/development.md` for the concrete commands", but `docs/development.md` is unchanged and does not mention `triage-review.sh`, `apply-triage.sh`, their arguments, or the `.agents/triage/` artifact. `docs/evaluation.md` names the scripts but shows no invocation.

**Why it matters.** Acceptance criterion "Documentation describes the complete lifecycle" is only partially met; a developer following the docs has nowhere to find `triage-review.sh <review-file> <agent> [model]` or the branch and approval preconditions of `apply-triage.sh`.

**Recommended action.** Add a "Review triage" subsection to `docs/development.md` with the two commands, their arguments, the confirmation prompts, the artifact naming (`<review-stem>-triage[-NN].md`) and the deferred-Issue title format `[F02][R01][Minor-1] …`, or point the reference at the section that actually contains them.

### Minor 2. Unrelated changes bundled into the feature

**Evidence.** `AGENTS.md` gains "Branch and worktree policy" and "Roadmap, Issues and Plans"; `docs/agentic-workflow.md` gains "Project bootstrap workflow", "Roadmap to GitHub Issues" and "Feature plans versus GitHub Issues" (roughly 90 added lines). None of these relate to review triage.

**Why it matters.** `AGENTS.md` Definition of Done states "No unrelated changes are included." Mixing a template sync into this PR makes the triage change harder to review and to revert.

**Recommended action.** Move the template-sync sections to a separate PR, or state explicitly in the PR description that the Issue intentionally includes a template sync.

### Minor 3. Reviews with non-canonical section headings are silently treated as empty

**Evidence.** `scripts/triage-review.sh:125-148` only recognises `## Critical`, `## Major`, `## Minor` and `## Suggestions`; any other `##` heading (for example `## Suggestion`, `## Minor findings`, `## Findings`) resets `section` and its content is ignored without a warning. The "unstructured content" check on line 197-203 only fires inside a recognised section.

**Why it matters.** Once M3 is fixed, a review that uses slightly different headings will produce a `NO_FINDINGS` triage and an artifact with three `None.` sections, giving a false "nothing to fix" signal for a review that may contain Critical findings.

**Recommended action.** Fail when none of the four canonical sections is found, and warn (or fail) when an unrecognised `##` section between the header and `## Verdict` contains `###` headings or bullet items.

### Minor 4. `gh` calls run inside loops that read from stdin

**Evidence.** `scripts/triage-review.sh:601-706` is a `while IFS=$'\t' read -r …; done <"$decisions_file"` loop that calls `gh issue list` (line 623) and `gh issue create` (line 697) without redirecting their stdin.

**Why it matters.** Any child that reads stdin consumes the remaining decision records, so later deferred findings are skipped without error. `gh` is normally non-interactive with `--body-file`, but it can prompt (for example for a repository or template selection) and the mock in the test never reads stdin, so the test would not catch this.

**Recommended action.** Add `</dev/null` to the `gh` invocations inside the loop (and to the `codex`/`claude` triage calls, which should not read from the user's terminal).

### Minor 5. Follow-up Issue deduplication trusts the first search hit

**Evidence.** `scripts/triage-review.sh:623-628` runs `gh issue list --search "\"$trace_token\" in:body"` and takes `.[0].url` without checking that the body actually contains the token.

**Why it matters.** GitHub search tokenises `#`, `/` and `:`, so the token `.agents/reviews/feature-5-x-review-01.md#F002` can match Issues created from a different review or finding key. The script would then record that Issue as the follow-up and skip creating the correct one.

**Recommended action.** Request `--json url,body` and filter with `jq` for `select(.body | contains($token))`, or search by the exact comment line and verify the match before reusing.

## Suggestions

### S1. Share the review-finding parser between the two scripts

`scripts/triage-review.sh:80-213` and `scripts/apply-triage.sh:170-257` contain near-identical awk programs that derive finding identifiers. `apply-triage.sh:299` depends on both producing exactly the same `id ". " title` strings to map triage entries back to the review. Extracting the parser into `scripts/lib/review-findings.awk` (invoked with `awk -f`) removes the duplication and the drift risk.

### S2. Use `read -r -p` and a literal format string for prompts

`scripts/apply-triage.sh:421` interpolates `$agent` into a `printf` format string. It is safe today because `agent` is validated on lines 45-52, but `printf 'Start a write-capable %s agent … ' "$agent"` or `read -r -p` is more robust if the validation is later relaxed.

### S3. Give the tests diagnosable failures

Both tests rely on bare `[[ … ]]` assertions under `set -e`, so any failure exits 1 with no output (this is how M1 presented). A small `assert` helper that prints the failing expectation and the captured output would make the suite far cheaper to maintain.

## Verdict

CHANGES REQUIRED
