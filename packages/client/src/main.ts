import './style.css';
import { snapYaw } from './render/camera-math';
import { createSceneRenderer, type RenderState } from './render/scene';

/** Window the FPS readout is averaged over, in milliseconds. */
const FPS_SAMPLE_WINDOW_MS = 500;

/**
 * A gap between frames longer than this (a hidden tab, a debugger pause)
 * restarts the FPS sample instead of being averaged in, in milliseconds.
 */
const FPS_SAMPLE_GAP_MS = 1000;

/** Debug overlay refresh interval, in milliseconds. */
const OVERLAY_INTERVAL_MS = 250;

const canvas = getRequiredElement<HTMLCanvasElement>('#game-canvas');
const fpsElement = getRequiredElement<HTMLParagraphElement>('#debug-fps');
const yawElement = getRequiredElement<HTMLParagraphElement>('#debug-yaw');
const targetElement = getRequiredElement<HTMLParagraphElement>('#debug-target');

const state: RenderState = {
  camera: {
    target: { x: 0, y: 0, z: 0 },
    yaw: Math.PI,
  },
};

const renderer = createSceneRenderer(canvas);
window.addEventListener('resize', renderer.resize);
window.addEventListener('keydown', (event) => {
  // Auto-repeat would spin the camera at the OS repeat rate, and shortcuts such
  // as Ctrl/Cmd+E belong to the browser.
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key === 'q') state.camera.yaw = snapYaw(state.camera.yaw, -1);
  if (key === 'e') state.camera.yaw = snapYaw(state.camera.yaw, 1);
});

let previousFrame: number | undefined;
let sampleStart = 0;
let sampleFrames = 0;
let previousOverlayUpdate = performance.now();
let fps: number | undefined;
function gameLoop(now: number): void {
  renderer.render(state);
  sampleFrameRate(now);

  if (now - previousOverlayUpdate >= OVERLAY_INTERVAL_MS) {
    previousOverlayUpdate = now;
    updateOverlay();
  }

  window.requestAnimationFrame(gameLoop);
}

/**
 * Average the frame rate over a short window; the instantaneous value flickers
 * too much to read against the ≥ 55 FPS acceptance criterion.
 */
function sampleFrameRate(now: number): void {
  const isAfterGap =
    previousFrame === undefined || now - previousFrame > FPS_SAMPLE_GAP_MS;
  previousFrame = now;
  if (isAfterGap) {
    // First frame, or first after a hidden tab or long stall: start a fresh
    // window so the pause is not averaged in and read as ~0 FPS.
    sampleStart = now;
    sampleFrames = 0;
    fps = undefined;
    return;
  }

  sampleFrames += 1;
  const sampleDuration = now - sampleStart;
  if (sampleDuration >= FPS_SAMPLE_WINDOW_MS) {
    fps = (sampleFrames * 1000) / sampleDuration;
    sampleFrames = 0;
    sampleStart = now;
  }
}

function updateOverlay(): void {
  fpsElement.textContent = `FPS: ${fps === undefined ? '--' : fps.toFixed(0)}`;
  yawElement.textContent = `Camera yaw: ${toDegrees(state.camera.yaw).toFixed(0)}°`;
  targetElement.textContent = `Target: ${formatTarget(state.camera.target)}`;
}

window.requestAnimationFrame(gameLoop);

function getRequiredElement<ElementType extends Element>(
  selector: string,
): ElementType {
  const element = document.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

function formatTarget(target: RenderState['camera']['target']): string {
  return `(${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)})`;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
