import { expect, test } from 'vitest';
import {
  CAMERA_DISTANCE,
  CAMERA_PITCH,
  CAMERA_YAW_STEP,
  cameraOffset,
  snapYaw,
  wrapYaw,
} from './camera-math';

const FULL_TURN = Math.PI * 2;

test('wraps a yaw into the [0, 2pi) range', () => {
  expect(wrapYaw(0)).toBe(0);
  expect(wrapYaw(Math.PI)).toBeCloseTo(Math.PI);
  expect(wrapYaw(3 * Math.PI)).toBeCloseTo(Math.PI);
  expect(wrapYaw(-Math.PI / 4)).toBeCloseTo((7 * Math.PI) / 4);

  // A full turn must display as 0°, not 360°.
  expect(wrapYaw(FULL_TURN)).toBe(0);
  expect(wrapYaw(-FULL_TURN)).toBe(0);
});

test('snaps yaw in both directions without leaving the range', () => {
  expect(snapYaw(0, 1)).toBeCloseTo(CAMERA_YAW_STEP);
  expect(snapYaw(0, -1)).toBeCloseTo(FULL_TURN - CAMERA_YAW_STEP);
  expect(snapYaw(5 * Math.PI, 0)).toBe(wrapYaw(5 * Math.PI));

  // A full turn of `E` presses returns to the starting yaw instead of 540°.
  let yaw = Math.PI;
  for (let press = 0; press < 8; press += 1) yaw = snapYaw(yaw, 1);
  expect(yaw).toBeCloseTo(Math.PI);
});

test('places the camera on a fixed-pitch orbit around the target', () => {
  const offset = cameraOffset(0, CAMERA_PITCH, CAMERA_DISTANCE);
  const length = Math.hypot(offset.x, offset.y, offset.z);
  expect(length).toBeCloseTo(CAMERA_DISTANCE);
  expect(offset.y).toBeCloseTo(CAMERA_DISTANCE * Math.sin(CAMERA_PITCH));

  // Yaw 0 looks north along +z; a quarter turn moves the camera onto +x.
  expect(offset.x).toBeCloseTo(0);
  expect(offset.z).toBeCloseTo(CAMERA_DISTANCE * Math.cos(CAMERA_PITCH));

  const quarterTurn = cameraOffset(Math.PI / 2, CAMERA_PITCH, CAMERA_DISTANCE);
  expect(quarterTurn.x).toBeCloseTo(CAMERA_DISTANCE * Math.cos(CAMERA_PITCH));
  expect(quarterTurn.z).toBeCloseTo(0);
  expect(quarterTurn.y).toBeCloseTo(offset.y);
});
