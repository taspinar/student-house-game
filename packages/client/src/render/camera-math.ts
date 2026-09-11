/**
 * Pure camera-rig maths. This module stays free of Three.js so the rig rules
 * can be unit-tested on their own and reused when a dedicated `camera` module
 * lands (architecture 5.2).
 */

const FULL_TURN = Math.PI * 2;

/** Yaw change applied by a single `Q` / `E` snap. */
export const CAMERA_YAW_STEP = Math.PI / 4;

/** Distance between the camera target and the camera, in world units. */
export const CAMERA_DISTANCE = 14;

/** Fixed downward pitch, inside the 50–60° band required by ADR 001. */
export const CAMERA_PITCH = (56 * Math.PI) / 180;

export interface CameraOffset {
  x: number;
  y: number;
  z: number;
}

/**
 * Wrap a yaw into `[0, 2π)` so the debug overlay stays readable and later
 * per-zone default-yaw comparisons (architecture 6.6) can compare values
 * directly.
 */
export function wrapYaw(yaw: number): number {
  return ((yaw % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

/** Snap a yaw by whole `CAMERA_YAW_STEP` increments, wrapped into `[0, 2π)`. */
export function snapYaw(yaw: number, steps: number): number {
  return wrapYaw(yaw + steps * CAMERA_YAW_STEP);
}

/** Offset from the camera target to the camera position for a given rig. */
export function cameraOffset(
  yaw: number,
  pitch: number,
  distance: number,
): CameraOffset {
  const horizontalDistance = distance * Math.cos(pitch);
  return {
    x: Math.sin(yaw) * horizontalDistance,
    y: distance * Math.sin(pitch),
    z: Math.cos(yaw) * horizontalDistance,
  };
}
