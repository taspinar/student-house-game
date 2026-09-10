# ADR 003 — Data-driven world: floor plan → generated shell, glTF props

**Status:** Accepted (2026-09-10)

## Context
The house must follow a real layout with specific rooms, doors and entrances, and small adjustments will be needed for navigation and camera readability. Two ways to build it: model the whole building by hand in a 3D tool and load one large scene, or describe the layout as data and generate the shell in code, placing props from a manifest. Implementation is agent-driven; agents cannot operate Blender interactively but can read, edit and test data files.

## Decision
Describe the building as **typed floor-plan data** (rooms as rectangles in metres, walls, door/window openings, materials, zone ids) in `packages/shared/world`. Pure functions generate wall segments, floors, openings and **collision boxes** from that data and are unit-tested. The client turns the generated description into Three.js meshes. Furniture, doors, vehicles, trees and other dressing are **glTF props** placed by a data list and loaded through an **asset manifest** that records the license and origin of each file (`assets/LICENSES.md`). Custom modelling (Blender) is used only for pieces no CC0 kit provides (e.g. the curved purple lounge seat, the CRT TV, facade panel modules).

## Alternatives considered
- **Hand-built single scene in Blender.** Better artistic control, but every layout correction is a manual art task, collision must be authored separately, and the owner's diagrams are schematic without dimensions, so sizes will be tuned iteratively. Reserved for individual props only.
- **Tile/grid-based construction.** Simple but forces walls on a grid; the real apartment does not fit a coarse grid well and doorway placement becomes approximate.
- **Procedural everything (including furniture).** Too much effort for the visual payoff; props are better sourced.

## Consequences
- Layout changes after diagram validation are cheap and reviewable in a PR diff.
- Collision and rendering are guaranteed consistent because both derive from the same data.
- Requires a small, well-tested geometry module (wall splitting around openings, corners).
- Asset style consistency must be managed manually via manifest guidelines.
- The floor plan file is the ground truth for the house; changes to rooms or entrances need owner approval (architecture invariant 3).
