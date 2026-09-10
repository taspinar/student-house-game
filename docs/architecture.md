# Architecture — Student House Game

**Status:** Project scaffold implemented (F01): npm workspaces, strict TypeScript, a Vite canvas placeholder, and lint/type-check/test/build verification. Rendering and game components below remain the intended design. Decisions with lasting impact are recorded as ADRs in `docs/decisions/`. This document describes the intended system; it must be kept in sync as features land.

## 1. Product summary

A browser-based **single-player** game set in a real student apartment: unit **407** in the south-eastern-most block of an "Open Studentencomplex"-style student housing complex near a university. The player picks one of a small set of predefined characters (each representing a real person), enters the house, walks around, moves between rooms, and interacts with simple objects (doors, couches, TV).

Scope is deliberately small: one apartment plus its immediate surroundings, a handful of interactions, no accounts, no server, no persistence beyond the browser. Multiplayer is explicitly **out of scope**; nothing in the architecture is built for it, though the simulation/render split (principle 4) keeps the option open at no cost.

## 2. Guiding principles

1. **Recognizable, not realistic.** The house must be recognizable from the description and photos; the art style is stylized low-poly 3D (ADR 001).
2. **Smallest architecture that supports the roadmap.** A static client bundle, no backend, no database (ADR 004, 005).
3. **Data over hand-built scenes.** The building, rooms, doors, props and characters are described in data files that agents can read, edit and test; geometry and scene graphs are generated from that data (ADR 003).
4. **Simulation separate from rendering.** World logic (floor plan, collision, zones, interactions) lives in a renderer-independent package so it can be unit-tested headlessly in Node.

## 3. System context

```
 Player (browser, desktop first)                     Developer / agents
   │  HTTPS: static files (HTML/JS/glTF/textures)        │ GitHub (issues, PRs, CI)
   ▼                                                      ▼
 ┌────────────────────────────────┐          ┌──────────────────────────┐
 │ Static hosting                 │◄─────────│ GitHub Actions           │
 │ (GitHub Pages by default, or a │  deploy  │ (verify, build, deploy)  │
 │  static container on Cloud Run)│          └──────────────────────────┘
 └────────────────────────────────┘
```

There is **no runtime backend**. All game logic runs in the browser. External systems: none at runtime. Asset sources (CC0 model kits, Blender) are development-time inputs only.

## 4. Repository layout (target)

```
packages/
  shared/      renderer-independent: world data, floor plan → geometry description,
               collision, zones, interactables, character catalogue
  client/      Vite + TypeScript + Three.js app: rendering, input, camera, UI overlay
assets/
  source/      editable sources (Blender files, palettes, reference notes) — no photos of real people
  public/      exported runtime assets (glTF, textures) served with the client
  LICENSES.md  provenance and license of every third-party asset
docs/          architecture, roadmap, ADRs, development, deployment
tests/e2e/     Playwright smoke tests (later)
```

Two packages are kept (rather than one) only to enforce the "no Three.js/DOM in game logic" boundary via package dependencies. Package manager: npm workspaces (keeps `scripts/verify.sh` unchanged in spirit: lint → type-check → test → build). Node LTS for tooling only.

## 5. Components

### 5.1 `shared` — world model and rules (no Three.js or DOM dependency)

| Module | Responsibility |
|---|---|
| `world/floorplan` | Typed description of the building: rooms (rectangles in metres), walls with thickness, door openings, window openings, floor/wall materials, zone ids. Unit 407, the shared corridor segment, the two official entrances and the exterior are all described here. |
| `world/geometry` | Pure functions turning the floor plan into wall segments, floor slabs, openings, and collision boxes. Unit-tested. |
| `world/props` | Prop placement list: `{ propId, assetId, position, rotationY, interactable? }` for furniture and exterior dressing. |
| `world/zones` | Named zones (living room, hall, bedroom 1/2/3, WC, bathroom, closet, corridor, street-west, south-end, feldmannweg…) used for camera defaults, "is player inside the unit" rules, and debugging. |
| `sim/player` | Player state (position, yaw, animation state, seated slot) and the movement step function. |
| `sim/collision` | 2D collision of a player circle against axis-aligned wall/prop boxes; door openings toggle blockers. |
| `sim/interaction` | Interactable registry and rules: doors (open/close + access rule), seats (occupancy, sit pose), TV (on/off). Pure state machines. |
| `characters` | Character catalogue: id, display name, visual parameters, thumbnail, asset references. Placeholder entries until reference photos arrive. |

### 5.2 `client` — rendering and input

| Module | Responsibility |
|---|---|
| `app` | Bootstrap, game loop, screen flow: Title → Character select → Game. |
| `render/scene` | Three.js scene, renderer, lighting (one directional "sun" + hemisphere; soft shadows optional), resize handling. |
| `render/world` | Builds meshes from `shared/world/geometry` output; assigns materials (dark floor, blue facade panels, curtains); instantiates props from glTF via an asset manifest. |
| `render/characters` | Loads the base humanoid rig, applies per-character parameters, drives animations (idle / walk / sit). |
| `camera` | Fixed-pitch follow camera ("dollhouse" view), snap-rotatable yaw, per-zone default yaw, fading of walls between camera and player. |
| `input` | Keyboard (WASD/arrows) and interaction key; pointer for UI. Click-to-move is optional and not planned. |
| `ui` | DOM overlay (not WebGL): title screen, character selection, interaction prompt. Plain HTML/CSS; no UI framework. |

## 6. World design derived from the house description and reference material

### 6.0 Reference material (stored outside the repository)

The owner supplied ten reference images. They contain photos of real people and must **not** be committed; keep them in a local folder ignored by Git. Numbering as used by the owner:

| Ref | Content | Used for |
|---|---|---|
| 1 | Aerial of the whole complex: eight blocks between Leeghwaterstraat (west), Korvezeestraat (south) and Feldmannweg (east); university buildings east of Feldmannweg; 407 pin on the south-eastern block | Site layout, backdrop massing |
| 2 | Aerial of the west side of the 407 block: narrow paved strip along the facade, grass with trees, dead-end internal road with parked cars, large parking area on Korvezeestraat, bike shed and waste containers at the south end | Playable exterior |
| 3 | Street photo of the south end: dark brick end wall with blue steel doors, official south entrance ("Echte Deur") at the east corner, cantilevered glass box on columns at the south-west corner with bike racks beneath, "most used door" on the west facade | South entrance, facade materials |
| 4 | Street photo of the east facade on Feldmannweg: beige tiles, dark window surrounds, blue tiled ground floor, "SOSH" tile sign, second official entrance in a brick bay with tall windows | East entrance, east facade |
| 5 | Aerial with corridor drawn in red (north–south spine, branch east to the second entrance) and 407 drawn in green **west** of the corridor | Corridor and unit position |
| 6 | Unit plan: living room, T-shaped hall, closet, WC, bathroom, bedrooms 1–3, unit door onto the shared corridor | Unit topology (ground truth) |
| 7 | Living-room plan: kitchen, cabinet, two fridges, dining table, white leather couch, gray fabric couch, low table, CRT TV, curved purple couch, hall door, street double door | Living-room layout (ground truth) |
| 8 | Photo from the white couch toward the street: window with closed gray curtains, door curtain half open, CRT TV on a stand in front of the window, dining table with many items on the right | Interior look, camera default |
| 9 | Photo from the street: living-room double door on the left, bedroom 1 window with a "Trump 2020" flag on the right, blue tiles, red chair on the pavement | Facade, banner, door type |
| 10 | Photo from the gray couch toward the white couch, TV and window; desk with monitors on the right | Furniture relations |

### 6.1 Coordinate system and orientation

- Three.js right-handed, **y up**. Units are metres.
- The real block runs roughly NNW–SSE (about 30° off true north). The game uses a **block-aligned frame** and calls the block axis "north–south": **−z = north (along the block toward the far end), +z = south (toward Korvezeestraat), +x = east (toward Feldmannweg), −x = west (toward the dead-end road)**. All compass words in this document use that frame.

### 6.2 Unit 407 topology (validated against the owner's diagrams)

Unit 407 lies on the **west side of the shared corridor**, roughly midway between the two official entrances (the aerial suggests slightly nearer the east entrance; the owner described it as "about a quarter of the way" — the exact position is not gameplay-relevant). The unit is a rectangle between the corridor (east) and the west facade. Reading the unit plan with the corridor at the top gives top = east, left = north:

```
                 shared corridor (runs north–south, east of the unit)
   ┌───────────────────────┬─────┬──────┬────┬──────────┐
   │                       │     │ unit │ WC │ bathroom │   east (corridor side)
   │   LIVING ROOM         │hall │ door │    │          │
   │   kitchen along the   │stem ├──────┴────┤          │
   │   east wall           ├─────┴───────────┴──────────┤
   │                       │  hall (runs north–south)   │
   │                     ▸ │─────────┬─────────┬────────┤   (▸ = living-room door into the hall)
   │  TV │ double door │   │ bed 1   │ bed 2   │ bed 3  │
   └─────┴─────────────┴───┴─────────┴─────────┴────────┘   west (street side: dead-end road)
   north ◄──────────────────────────────────────────► south
```

- **Living room** at the **north** end, spanning the full depth of the unit. Its **west wall is the street facade** with one window (north part, closed curtains in ref 8) and the **outward-opening double door** near the south-west corner. The **kitchen** runs along the **east** wall (corridor side, no window). The door into the hall is at the east end of the living room's south wall.
- **Hall** is T-shaped: a short stem from the **unit door** (opening east onto the shared corridor) meeting a bar that runs north–south behind the bedrooms.
- **Closet** and a small **WC** sit east of the hall bar next to the stem; the **bathroom** is at the south-east corner. (The WC appears in the owner's diagram although the text mentions only a bathroom; it is modelled as drawn.)
- **Bedrooms 1, 2, 3** lie **south of the living room along the west facade**, all with street-facing windows. **Bedroom 1** is adjacent to the living room; its window carries the flag and sits immediately right of the living-room double door when seen from the street (ref 9).
- Dimensions are not on the diagrams. Working values for the floor-plan feature: unit ≈ 18–20 m long × 7–8 m deep; living room ≈ 8 × 7 m; bedrooms ≈ 3.5 × 4 m. To be tuned visually against refs 8–10.

Circulation implemented in the model:

| Route | Model |
|---|---|
| Official entrance 1 (south) | Keyed door in the dark-brick south end wall, at its east corner → long shared corridor running north. |
| Official entrance 2 (east, halfway) | Keyed door in a brick bay on the east facade at mid-length → short side corridor west → main corridor; 407 is reached by turning left (south). |
| Unit door | Door between the shared corridor and the hall stem. |
| Street door | One outward-opening **double door** (two leaves; the owner's "two doors") from the living room onto the west pavement. Handle inside only, no lock or key outside. |

Only the stretch of shared corridor between the two official entrances plus a little beyond is modelled at full detail; the rest of the corridor is closed off with a visible but locked door or a plausible corridor end. Other units' doors along the corridor are non-interactive props.

### 6.3 Living-room layout (from ref 7, oriented as in 6.2)

| Item | Placement |
|---|---|
| Kitchen | Along the east wall, from the north corner to near the hall door. |
| Cabinet, fridge 1, fridge 2 | Along the north wall, from the east corner westward. |
| Dining table with chairs (cluttered) | North-west area, near the window. Also a desk with monitors nearby (refs 8, 10). |
| White leather couch | Centre of the room, long axis north–south, facing west toward the TV. |
| Gray fabric couch | East of the white couch, nearer the kitchen, facing west/south-west. |
| Low coffee table | Between the white couch and the purple couch. |
| CRT TV on a low stand | Against the west wall, in front of the window, just north of the double door. |
| Curved purple couch | South-west corner, just south of the double door, curving toward the room. |
| Double door to the street | West wall, south part. |
| Door to the hall | South wall, east end. |

Interior materials (refs 1, 8, 10): white walls, dark charcoal carpet, gray eyelet curtains on the west wall, white uPVC door and window frames, exposed pipe in a ceiling corner, radiator under the window, smoke detector. Lived-in clutter: bags, cables on the floor, snacks on the table.

### 6.4 Exterior scope

Playable outdoor area, bounded by invisible walls:

- **West side (the "street" for 407):** paved strip directly along the west facade with the living-room double door and bedroom windows, a stray red chair, bicycles; a strip of grass with trees; the internal dead-end road with parked cars between this block and the next block to the west.
- **South end:** Korvezeestraat with the large parking area; the dark-brick end wall with blue steel storage doors and the south official entrance at the east corner; the cantilevered glass box on columns at the south-west corner with bike racks beneath; waste containers.
- **East side:** Feldmannweg with roadside parking and trees; the east facade with the second official entrance in its brick bay.
- The other seven blocks are low-detail massing with the same silhouette and facade colours as backdrop; they are not enterable. University buildings east of Feldmannweg are optional far backdrop.

Facade materials: **west facade** blue tiled ground floor with white frames, ochre/yellow tiles on the upper floors, grey concrete pier bands; **east facade** beige tiles with dark brown window surrounds above a blue tiled ground floor, "SOSH" tile sign; **south end wall** dark brown brick with blue steel doors.

### 6.5 Door access rules (gameplay expression of the dual-access pattern)

In a single-player game there is no "someone already home", so the description's social pattern is expressed as a first-arrival rule:

| Door | From outside | From inside |
|---|---|---|
| Official entrances (south, east) | Always usable (the player is a resident with a key). | Always usable. |
| Unit door (corridor ↔ hall) | Always usable. | Always usable. |
| Living-room street double door | Usable only if currently **open**. A closed leaf cannot be opened from outside (no handle, no lock); the prompt explains it opens from inside. | Always usable; can be opened and left open. |

Effect: the first entry into the house must go through an official entrance; once the player has opened the street door from inside, it becomes the convenient way in and out, exactly as in real life. Optional later refinement: a scripted housemate who is "already home" and has left the door open at game start.

### 6.6 Camera strategy

- Perspective camera, pitch ≈ 50–60° down, following the player with smoothing; no free-look.
- Yaw snaps in 45° or 90° steps on key press. Per-zone default yaw: **on the west street** the camera looks **east** at the facade (facade is the visual anchor); **inside the living room** it looks **west** toward the curtains, double door and TV (matching refs 8 and 10); **on Feldmannweg** it looks west at the east facade and entrance.
- No ceilings; walls that lie between the camera and the player fade to a low alpha (or shrink), which keeps rooms readable at every yaw.
- Rooms are zones in one continuous scene; there are no loading transitions between rooms. Doors are physical objects with collision that toggles.

### 6.7 Interaction model

- Interactables register a trigger radius and a facing requirement (optional). The nearest eligible interactable shows a DOM prompt ("Sit", "Open door", "Turn on TV").
- **Seats**: each couch/chair defines one or more seat slots (position, facing). Sitting snaps the player to the slot, plays the sit animation, releases on move.
- **Doors**: hinged animation, state open/closed, collision blocker toggled, access rule per door type (6.5). The street double door has two leaves; opening one leaf is enough to pass.
- **TV**: on/off; screen material switches to an emissive animated texture (static/noise or a looping image sequence). Sound optional.

## 7. Character architecture

Individual characters are **not** designed yet (reference photos pending). The architecture anticipates:

- `shared/characters` catalogue with one entry per selectable character: `id`, `displayName`, `visual` (rig id, material/texture references, colour palette, accessory list), `thumbnail`. The catalogue holds visual data only.
- One **shared humanoid rig** (idle / walk / sit animations) with per-character variation via textures, colours, hair/accessory meshes and body-scale parameters (ADR 006, Proposed). This keeps animation and collision identical for all characters and makes adding a character a data + asset task, not a code task.
- The selection screen reads the catalogue; the chosen `characterId` is the only thing the game needs to render the player.
- Reference photos are development inputs only: they are **never committed** to the repository or served to clients. Only derived, stylized assets are committed.

## 8. Data flow

```
input → player controller (shared/sim) → world state (plain objects, single source of truth)
      → render adapters (client/render) update Three.js objects each frame
      → camera follows player; UI overlay reads the same state
```

The game loop runs entirely in the browser. World state is plain data (no Three.js objects inside it) so that `shared` can be unit-tested and so a save-to-`localStorage` feature (if ever wanted) is trivial.

## 9. Invariants and boundaries (agents must preserve)

1. `packages/shared` must not import Three.js or any DOM API; it must be testable with Vitest in Node.
2. World geometry, props, zones and interactables are defined in data (TypeScript/JSON), not hard-coded in render code.
3. The house topology in 6.2 and the living-room layout in 6.3 are ground truth (validated against the owner's diagrams and photos); do not add or remove rooms/entrances or move the street door without human approval.
4. Player, object and character state are plain serializable data; no class instances or Three.js objects in state.
5. No photos or personal data of the real people represented by characters are committed; character data holds only stylized derived assets and a display name approved by the owner.
6. Third-party assets are listed in `assets/LICENSES.md` with license and origin; only licenses compatible with public web distribution (CC0, CC-BY with attribution, or self-made) are used.
7. No backend, database, auth provider or cloud runtime dependency is introduced without an ADR.

## 10. Runtime, environments and deployment

- **Runtime:** a static bundle (HTML, JS, glTF, textures) produced by `vite build`. No server process.
- **Hosting (ADR 004):** static hosting. Default recommendation is **GitHub Pages** via GitHub Actions because it needs no cloud project, IAM or secrets. If hosting on GCP is required, the equivalent is a **Cloud Run service running a static file container** (nginx or Caddy) deployed via Workload Identity Federation; the owner chooses (see roadmap, unresolved decisions).
- **Environments:** PR preview is not required; `main` deploys automatically. A separate production/staging split is unnecessary for a static single-player game; if introduced later, use GitHub Environments with a manual approval.
- **Persistence:** none (ADR 005). Character catalogue and world data ship inside the build. If "remember my character" or "remember house state" is ever wanted, `localStorage` is sufficient; a database is not.
- **Observability:** none needed beyond hosting access logs; the client logs errors to the console.

## 11. Testing strategy

| Layer | Tooling | Examples |
|---|---|---|
| Unit (shared) | Vitest | floor plan → wall segments, collision resolution, door access rules, seat occupancy, movement step |
| Unit (client, non-render) | Vitest + jsdom | screen flow, character catalogue rendering, input mapping |
| E2E smoke | Playwright (headless Chromium with SwiftShader/WebGL) | app loads, character can be selected, canvas renders, no console errors |
| Visual | Manual + screenshot checklist in PRs | recognisability of living room and facade |

`./scripts/verify.sh` runs lint, type-check, unit tests and build for all workspaces.

## 12. Open questions requiring human input

See the "Unresolved decisions" section of `docs/roadmap.md`. The most important: real dimensions of the unit (the diagrams are schematic), whether the bedroom-1 flag is reproduced literally or replaced by a generic banner, hosting choice (GitHub Pages vs Cloud Run static), and the character visual style once character reference photos are available.
