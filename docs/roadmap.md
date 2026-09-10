# Roadmap — Student House Game

GitHub Issues are the actionable backlog and the source of truth once created. This roadmap proposes the features and their sequencing; each feature below is written so it can be pasted into a Feature issue (goal, scope, dependencies, acceptance criteria, risk, plan needed). Risk levels follow `.agents/policies/autonomy.md`. "Plan" means a `.agents/plans/<issue>-<slug>.md` written with `.agents/prompts/planner.md` is expected before implementation.

The game is **single-player**; there is no server, no networking and no database anywhere in this roadmap.

## Phases

| Phase | Outcome | Features |
|---|---|---|
| 0 — Technical foundation | Repo builds, tests and renders an empty 3D scene | F01, F02 |
| 1 — House and movement | Walk through a recognisable unit 407 and its surroundings | F03, F04, F05, F06, F07 |
| 2 — Characters and interactions | Choose a character; doors, couches and TV work; the game is deployed | F08, F09, F10, F11, F12, F13, F14 |
| 3 — Real characters and polish | Characters based on reference photos; bedrooms; atmosphere | F15, F16, F17 |
| Later / only if wanted | Remembered preferences, scripted housemates, more rooms | F18+ |

Dependency graph (arrows = "depends on"):

```
F01 → F02 → F03 → F04 → F05
              F03 → F06 → F07
              F04, F06 → F10 → F11, F12, F13
              F01 → F08 → F09 (needs ADR 006 accepted)
              F04, F08 → F14 (deploy)
              F09 + reference photos → F15
              F06, F07 → F16;  F12, F13 → F17
```

---

## Phase 0 — Technical foundation

### F01 — Project scaffold and verification pipeline
- **Goal:** A buildable, lintable, testable TypeScript monorepo so every later feature has a stable `./scripts/verify.sh`.
- **Scope:** npm workspaces with `packages/shared` and `packages/client`; Vite + TypeScript strict; ESLint + Prettier; Vitest; `verify.sh` runs lint/type-check/test/build across workspaces; CI workflow runs `verify.sh` on Node LTS; `docs/development.md` updated with commands; `.env.example` trimmed (no variables are needed yet); README project description replaced.
- **Dependencies:** none.
- **Acceptance criteria:** `npm ci && ./scripts/verify.sh` passes locally and in CI; a trivial unit test in `shared` runs; `npm run dev -w packages/client` serves a page with a canvas placeholder; no application logic beyond a hello-world entry.
- **Risk:** Low.
- **Plan required:** No (issue acceptance criteria are sufficient).

### F02 — Rendering foundation
- **Goal:** A Three.js scene with lighting, a fixed-pitch camera and a render loop, proving the rendering approach (ADR 001/002) in this repo.
- **Scope:** renderer setup with device-pixel-ratio cap and resize handling; hemisphere + directional light with optional soft shadows; ground plane and a few placeholder boxes; fixed-pitch camera rig pointing at a target; debug overlay (FPS, camera yaw, target position); a `render` adapter interface that reads state from plain objects.
- **Dependencies:** F01.
- **Acceptance criteria:** page renders at ≥ 55 FPS on a mid-range laptop with the placeholder scene; window resize keeps aspect correct; camera yaw can be snapped with Q/E; no Three.js imports in `packages/shared`.
- **Risk:** Low.
- **Plan required:** No.

## Phase 1 — House and movement

### F03 — Floor-plan data model and procedural building geometry
- **Goal:** Unit 407, the adjacent shared corridor and the two official entrances exist as data and are turned into walls, floors and openings (ADR 003).
- **Scope:** floor-plan types (rooms, walls, door and window openings, materials, zones) in `shared/world`; pure geometry functions with unit tests; `floorplan/unit407.ts` describing the validated topology of `docs/architecture.md` §6.2: living room at the north end with its west window and outward-opening street double door, T-shaped hall, unit door onto the corridor (east), closet, WC, bathroom, bedrooms 1–3 along the west facade with windows; the shared corridor segment, south entrance and east entrance with side corridor; placeholder materials (dark carpet, white walls); client builds meshes from the geometry output. Dimensions are working values to be tuned visually against the reference photos.
- **Dependencies:** F02.
- **Acceptance criteria:** all rooms in §6.2 are present with the stated adjacency (living room north, bedrooms south along the west facade, closet/WC/bathroom east of the hall); the street double door and the unit door are where the diagrams place them; unit tests cover wall splitting around openings and collision box generation; a debug top-down camera toggle shows the plan and visually matches the owner's unit diagram; no rooms or entrances beyond the diagrams.
- **Risk:** Medium.
- **Plan required:** Yes.

### F04 — Player entity, movement and collision
- **Goal:** The player can walk through every room and doorway with keyboard input.
- **Scope:** player state (position, yaw, speed, animation state) as plain data in `shared/sim/player`; WASD/arrow movement relative to camera yaw; circle-vs-AABB collision from `shared/sim/collision` with sliding; doorways passable; placeholder capsule mesh; camera follows the player; spawn point on Korvezeestraat near the south official entrance (so the first entry follows the real-life route).
- **Dependencies:** F03.
- **Acceptance criteria:** player cannot pass through walls or closed openings; can walk street → entrance → corridor → hall → every room → living room → street and back; movement feels responsive; collision unit tests for corner and doorway cases.
- **Risk:** Medium.
- **Plan required:** Yes.

### F05 — Camera polish and wall cutaway
- **Goal:** Rooms remain readable from any camera angle and the key viewpoints (facade from the street, curtains/TV from inside) look right.
- **Scope:** per-zone default yaw with smooth transition; yaw snapping; fading of walls between camera and player; zoom limits.
- **Dependencies:** F04.
- **Acceptance criteria:** entering the living room defaults to the east-facing view; standing outside defaults to a facade view; no wall ever fully hides the player; transitions are smooth (no pops); performance unchanged.
- **Risk:** Low.
- **Plan required:** No.

### F06 — Asset pipeline and living-room furnishing
- **Goal:** Props are loaded from glTF via a manifest and the living room is furnished to match the description.
- **Scope:** asset manifest (`assetId → file, scale, license entry`), glTF loader with caching, prop placement data with unit tests for the loader-independent parts; `assets/LICENSES.md`; furniture placed per the layout table in `docs/architecture.md` §6.3: kitchen along the east wall, cabinet and two fridges on the north wall, cluttered dining table and a desk with monitors in the north-west, white leather couch in the centre facing the TV, gray fabric couch east of it, low table, CRT TV on a low stand against the west wall north of the double door, curved purple couch in the south-west corner, gray eyelet curtains on the west window and door; props get collision boxes; CC0 kits first (Kenney/Quaternius), custom models only where nothing fits.
- **Dependencies:** F03.
- **Acceptance criteria:** every furniture element in §6.3 is present, in the right place, and identifiable in a screenshot taken from the white couch toward the west wall (compare with reference photo 8) and from the gray couch (photo 10); walking is blocked by furniture; assets total < 10 MB compressed; every asset has a license entry; load time < 3 s on broadband.
- **Risk:** Medium.
- **Plan required:** Yes.

### F07 — Exterior and building surroundings
- **Goal:** The approach to the house is recognisable: the west facade with blue tiled ground floor and ochre upper floors, the street double door and bedroom windows, the dead-end road with grass and trees, the south end with its brick wall and glass box, Feldmannweg with the east entrance, neighbouring blocks as backdrop.
- **Scope:** per `docs/architecture.md` §6.4: west facade modules (blue tiles, white frames, ochre upper floors) with 407's double door and bedroom windows; the paved strip, grass with trees and the dead-end internal road with parked cars on the west; the south end (dark brick, blue steel doors, south entrance at the east corner, cantilevered glass box on columns with bike racks, waste containers, Korvezeestraat parking); Feldmannweg with roadside parking, the east facade (beige tiles, dark surrounds, blue ground floor) and the east entrance bay; low-detail massing for the other seven blocks; a few cars, bicycles, trees; invisible boundary walls; bedroom-1 window banner as a placeholder texture until the owner decides on its content.
- **Dependencies:** F06.
- **Acceptance criteria:** standing on the west pavement the player can identify the living-room double door and the bedroom-1 window next to it (compare with reference photo 9); both official entrances are reachable on foot around the south end and along Feldmannweg; the player cannot leave the playable area; frame rate remains ≥ 55 FPS with the full exterior.
- **Risk:** Medium.
- **Plan required:** Yes.

## Phase 2 — Characters, interactions, deployment

### F08 — Character catalogue and selection screen
- **Goal:** The game starts with a title screen and a character selection screen driven by a data catalogue.
- **Scope:** `shared/characters` catalogue with 3–4 **placeholder** characters (generic names/colours, not real people); DOM overlay screens (title → select → play); selected character stored in app state and applied as a colour tint on the placeholder player mesh; keyboard and mouse navigation.
- **Dependencies:** F01 (screens can be built in parallel with Phase 1).
- **Acceptance criteria:** adding a character to the catalogue requires no code change; selection screen shows name and thumbnail for each entry; the chosen character is visible in-game; unit tests for the catalogue loader and screen state machine.
- **Risk:** Low.
- **Plan required:** No.

### F09 — Base character rig and animation
- **Goal:** One shared humanoid rig with idle, walk and sit animations, parameterised per character (ADR 006).
- **Scope:** rigged low-poly humanoid glTF (CC0 base or self-made in Blender); animation mixer with state blending; per-character parameters (skin/hair/clothing colours, hair/accessory meshes, height scale) applied at load; replaces the capsule placeholder.
- **Dependencies:** F04, F08; ADR 006 accepted.
- **Acceptance criteria:** walk animation plays while moving, idle when still; two placeholder characters are visibly different using parameters only; rig loads in < 1 s; animation state is part of the plain player state.
- **Risk:** Medium.
- **Plan required:** Yes.

### F10 — Interaction system
- **Goal:** A generic mechanism for proximity-based interactions with a prompt.
- **Scope:** interactable registry in `shared/sim/interaction`; nearest-eligible selection with radius and optional facing check; DOM prompt; interaction key; pure state machines with unit tests; debug visualisation of trigger radii.
- **Dependencies:** F04, F06.
- **Acceptance criteria:** a test interactable shows a prompt within radius and hides outside; pressing the key dispatches an action to the state machine; no rendering code in interaction logic.
- **Risk:** Medium.
- **Plan required:** Yes.

### F11 — Doors and access rules
- **Goal:** All doors open and close, with the dual-access behaviour from the description.
- **Scope:** hinged door props with open/close animation and collision toggle; door types: official entrance, unit door, interior door, living-room street door; access rule table from `docs/architecture.md` §6.5 (a closed street door cannot be opened from outside); optional auto-close timer.
- **Dependencies:** F10, F07.
- **Acceptance criteria:** rule table is enforced and unit-tested; a player outside a closed street door gets a "opens from inside" prompt; official entrances always work; the first entry into the house necessarily goes through an official entrance.
- **Risk:** Low.
- **Plan required:** No (rule table and F10 make this a straightforward issue).

### F12 — Sitting on furniture
- **Goal:** The player can sit on couches and chairs.
- **Scope:** seat slots on couches, lounge seat and dining chairs; snap to slot with sit animation; stand up on movement; camera keeps framing.
- **Dependencies:** F09, F10.
- **Acceptance criteria:** each couch has ≥ 2 slots, chairs 1; sitting/standing looks correct from every camera yaw; unit tests for slot selection.
- **Risk:** Low.
- **Plan required:** No.

### F13 — TV interaction
- **Goal:** The CRT TV can be switched on and off.
- **Scope:** on/off state; emissive animated screen material (static/noise or looping frames); optional low-volume audio with a mute toggle.
- **Dependencies:** F10, F06.
- **Acceptance criteria:** visible screen change and prompt text toggles; no audio autoplay before user interaction.
- **Risk:** Low.
- **Plan required:** No.

### F14 — Static deployment
- **Goal:** Every merge to `main` publishes a playable build at a stable URL (ADR 004).
- **Scope, default option (GitHub Pages):** GitHub Actions workflow builds the client and deploys with the official Pages action; Vite base path configured; `docs/deployment.md` and `docs/operations.md` filled in (rollback = redeploy previous commit).
- **Scope, alternative (Cloud Run static container):** Dockerfile with nginx/Caddy serving `dist/`; GitHub Actions builds, pushes to Artifact Registry and deploys via Workload Identity Federation; GCP project, region and WIF configured by the owner beforehand.
- **Dependencies:** F04, F08 (something worth deploying); owner's hosting decision.
- **Acceptance criteria:** the URL serves the current `main` build within minutes of merge; no long-lived cloud keys in GitHub secrets; deployment steps and rollback documented.
- **Risk:** Low for GitHub Pages; High for the Cloud Run variant (IAM, cloud resources) with human approval at the GCP boundary.
- **Plan required:** No for GitHub Pages; Yes for Cloud Run.

## Phase 3 — Real characters and polish

### F15 — Characters based on reference photos
- **Goal:** Replace placeholder characters with the real cast, recognisable from their reference photos, in the agreed style (ADR 006 finalised).
- **Scope:** per-character parameter sets and assets (hair/accessory meshes, textures, palettes), thumbnails, display names approved by the owner; art workflow documented in `assets/source/README.md`; photos kept out of the repo.
- **Dependencies:** F09; reference photos and consent from the people represented.
- **Acceptance criteria:** each person is identifiable by someone who knows them; all characters share the rig and animations; no photo or personal data is committed.
- **Risk:** Medium (content involving real people; owner sign-off required).
- **Plan required:** Yes.

### F16 — Bedrooms, bathroom, closet identity and front-window banner
- **Goal:** Secondary rooms are furnished enough to feel owned; the bedroom-1 window banner is recognisable from outside.
- **Scope:** minimal furniture per bedroom (all three have west windows), bathroom and WC fixtures, closet contents; banner texture as decided by the owner (literal flag or generic banner); per-room props in data.
- **Dependencies:** F06, F07.
- **Acceptance criteria:** each room is distinguishable; banner visible from the street; asset budget respected.
- **Risk:** Low.
- **Plan required:** No.

### F17 — Atmosphere and polish
- **Goal:** The living room feels lived-in and the game feels finished.
- **Scope:** clutter props, lighting mood (evening preset), ambient sound, loading screen, small idle animations, mobile-friendly viewport handling (touch controls are optional).
- **Dependencies:** F06, F12, F13.
- **Acceptance criteria:** owner review of screenshots against reference photos; no performance regression.
- **Risk:** Low.
- **Plan required:** No.

## Later / only if wanted

- **F18 — Remember last character and settings** in `localStorage` (no backend needed).
- **F19 — Scripted housemates:** the non-selected characters appear as non-player characters in the house (sitting on the couch, watching TV), which would also let the "someone is already home, street door open" situation from the description occur.
- **F20 — Full corridor and other blocks enterable; time of day.**
- **Multiplayer** is out of scope. If ever reconsidered, it needs its own ADRs (server, protocol, hosting); the plain-data world state keeps that possible but nothing is built for it.

## Recommended first feature

**F01 — Project scaffold and verification pipeline.** It has no dependencies, is low risk, and unblocks everything else. F02 should follow immediately in the same phase.

## Unresolved decisions requiring human input

1. **Unit dimensions.** The diagrams are schematic. The working sizes in `docs/architecture.md` §6.2 (unit ≈ 18–20 × 7–8 m, living room ≈ 8 × 7 m, bedrooms ≈ 3.5 × 4 m) should be corrected if the owner can measure or estimate the real rooms; otherwise they are tuned visually.
2. **Bedroom-1 banner content.** The real window shows a "Trump 2020" campaign flag. Decide whether the game reproduces it literally, uses a stylised version, or a generic banner. This is a content choice, not a technical one.
3. **WC.** The unit diagram shows a separate WC next to the closet, which the written description omits. It is modelled as drawn unless the owner says otherwise.
4. **Street-door rule.** The owner confirmed the doors have no outside handle or lock. The first-arrival rule (closed door cannot be opened from outside; official entrances always work) follows directly; the only open choice is whether to add a scripted housemate who leaves it open at game start.
5. **Hosting.** GitHub Pages (recommended: free, zero cloud setup, low risk) or a static container on Cloud Run (if the project must live on GCP). This decides the scope and risk of F14.
6. **Character visual style (ADR 006 status Proposed).** Confirm the shared-rig approach once the reference photos and the owner's taste for stylisation are known.
7. **Consent and naming of real people.** Which display names are shown; whether the people represented have agreed.
8. **Asset sourcing preference.** CC0 kits with attribution (fast, generic look) versus custom Blender modelling (closer likeness, more effort).
