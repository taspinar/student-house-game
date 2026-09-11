import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { CAMERA_DISTANCE, CAMERA_PITCH, cameraOffset } from './camera-math';

export interface RenderState {
  camera: {
    target: {
      x: number;
      y: number;
      z: number;
    };
    yaw: number;
  };
}

export interface RenderAdapter<State> {
  dispose(): void;
  render(state: State): void;
  resize(): void;
}

const MAX_DEVICE_PIXEL_RATIO = 2;

/**
 * Half-extent of the sun's orthographic shadow frustum, in light space. It must
 * contain every shadow caster and the receivers around them; ground outside it
 * simply receives no shadow, so it need not cover the whole ground plane. Later
 * features that add casters (the house) must size it for them; a frustum that
 * follows the camera target belongs with the camera-module work (#9).
 */
const SHADOW_FRUSTUM_EXTENT = 16;

export function createSceneRenderer(
  canvas: HTMLCanvasElement,
): RenderAdapter<RenderState> {
  const scene = new Scene();
  scene.background = new Color('#8db7d5');

  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  const renderer = new WebGLRenderer({ antialias: true, canvas });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  addLighting(scene);
  addPlaceholderScene(scene);

  const target = new Vector3();

  function resize(): void {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // Re-read the device pixel ratio here: it changes when the window moves
    // between displays or the browser zoom level changes.
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO),
    );
    renderer.setSize(width, height, false);
  }

  function render(state: RenderState): void {
    target.set(
      state.camera.target.x,
      state.camera.target.y,
      state.camera.target.z,
    );
    positionCamera(camera, target, state.camera.yaw);
    renderer.render(scene, camera);
  }

  function dispose(): void {
    renderer.dispose();
  }

  resize();
  return { dispose, render, resize };
}

function addLighting(scene: Scene): void {
  const hemisphere = new HemisphereLight('#d9efff', '#3b4a32', 2.2);
  scene.add(hemisphere);

  const sun = new DirectionalLight('#fff1d6', 2.5);
  sun.castShadow = true;
  sun.position.set(7, 12, 5);
  sun.shadow.mapSize.set(1024, 1024);
  // Softens the PCF shadow edges; PCFSoftShadowMap is deprecated in three 0.185.
  sun.shadow.radius = 3;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -SHADOW_FRUSTUM_EXTENT;
  sun.shadow.camera.right = SHADOW_FRUSTUM_EXTENT;
  sun.shadow.camera.top = SHADOW_FRUSTUM_EXTENT;
  sun.shadow.camera.bottom = -SHADOW_FRUSTUM_EXTENT;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);
}

function addPlaceholderScene(scene: Scene): void {
  const ground = new Mesh(
    new PlaneGeometry(30, 30),
    new MeshStandardMaterial({ color: '#496849', roughness: 1 }),
  );
  ground.receiveShadow = true;
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const blocks = new Group();
  blocks.add(createBox('#f3c979', 5, 2.5, 3, -2.5, 1.25, 0));
  blocks.add(createBox('#547ea4', 2.5, 1.5, 2.5, 2.5, 0.75, -1.5));
  blocks.add(createBox('#cc785e', 1.5, 3.5, 1.5, 2.5, 1.75, 2.5));
  scene.add(blocks);
}

function createBox(
  color: string,
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
): Mesh {
  const box = new Mesh(
    new BoxGeometry(width, height, depth),
    new MeshStandardMaterial({ color, roughness: 0.85 }),
  );
  box.castShadow = true;
  box.receiveShadow = true;
  box.position.set(x, y, z);
  return box;
}

function positionCamera(
  camera: PerspectiveCamera,
  target: Vector3,
  yaw: number,
): void {
  const offset = cameraOffset(yaw, CAMERA_PITCH, CAMERA_DISTANCE);
  camera.position.set(
    target.x + offset.x,
    target.y + offset.y,
    target.z + offset.z,
  );
  camera.lookAt(target);
}
