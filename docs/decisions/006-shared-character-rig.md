# ADR 006 — One shared humanoid rig with per-character parameters

**Status:** Proposed — confirm or revise once reference photos are available and before F09 is implemented

## Context
Selectable characters represent real people and should be recognisable from reference photos without being photorealistic. Several characters are needed now and more later. All characters must animate (idle, walk, sit) and collide identically. The art style is stylized low-poly (ADR 001). Photos are not yet available, so individual characters cannot be designed, but the pipeline that will produce them shapes the animation and asset features.

## Decision (proposed)
- A **single rigged low-poly humanoid base model** (glTF, CC0 base or self-made in Blender) with the shared animation set. All characters use this rig and these animations.
- Per-character **parameter sets** in the catalogue (`packages/shared/characters`): skin, hair and clothing colours; hair and accessory meshes (glasses, hat, beard, etc.) attached to rig sockets; body height/width scale within limits; a stylized face texture where a simple palette is not recognisable enough.
- Recognisability is achieved through the strongest distinguishing features of each person (hair shape/colour, glasses, signature clothing, build), decided per character when photos arrive.
- Reference photos are development inputs only and are never committed or served.

## Alternatives considered
- **Fully custom mesh per character.** Highest likeness ceiling, but each character becomes a modelling project, animations must be retargeted, and consistency between characters suffers.
- **Photo-textured heads on a shared body.** Fast and recognisable, but visually jarring in a low-poly world, raises privacy concerns (real photos in the build), and ages badly.
- **2D portrait sprites/billboards.** Cheap but conflicts with the 3D camera and looks out of place.

## Consequences
- Adding a character is a data-plus-assets task: no new animation or code.
- The animation feature (F09) can be built with placeholder characters before any photo exists.
- Likeness is limited by the parameter space; the parameter set may need extension (more accessory sockets, face texture support) when real characters are produced (F15).
- Requires owner sign-off on each character's appearance and display name.
