// Voidline Command scene: layered tactical space with a crisp orthographic combat plane and procedural depth.
import { Engine } from "@babylonjs/core/Engines/engine";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { GameWorld } from "./GameWorld";

export interface GameHandle { scene: Scene; dispose: () => void; }

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.008, 0.014, 0.042, 1);
  const camera = new FreeCamera("tactical-camera", new Vector3(0, 0, 12), scene);
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
  camera.setTarget(Vector3.Zero());

  const resizeCamera = () => {
    const aspect = engine.getRenderWidth() / Math.max(1, engine.getRenderHeight());
    const halfHeight = 5.1;
    camera.orthoTop = halfHeight;
    camera.orthoBottom = -halfHeight;
    camera.orthoLeft = -halfHeight * aspect;
    camera.orthoRight = halfHeight * aspect;
  };
  resizeCamera();
  const resizeObserver = engine.onResizeObservable.add(resizeCamera);
  const updateBackdrop = createSpaceBackdrop(scene);

  const demo = new URLSearchParams(window.location.search).has("demo");
  const world = new GameWorld(scene, canvas, demo);
  scene.onBeforeRenderObservable.add(() => {
    const delta = Math.min(0.05, engine.getDeltaTime() / 1000);
    updateBackdrop(delta);
    world.update(delta);
  });

  return {
    scene,
    dispose: () => {
      engine.onResizeObservable.remove(resizeObserver);
      world.dispose();
      scene.dispose();
    },
  };
}

function createSpaceBackdrop(scene: Scene) {
  const planetMaterial = new StandardMaterial("planet-limb", scene);
  planetMaterial.diffuseColor = Color3.FromHexString("#1E2D69");
  planetMaterial.emissiveColor = Color3.FromHexString("#0C1E59");
  planetMaterial.alpha = 0.72;
  planetMaterial.backFaceCulling = false;
  const planet = MeshBuilder.CreateDisc("indigo-horizon", { radius: 8.1, tessellation: 64 }, scene);
  planet.material = planetMaterial;
  planet.position.set(-5.9, -10.6, -3);

  const starMaterials = ["#DCEFFF", "#6BA9FF", "#42E8FF"].map((hex, index) => {
    const material = new StandardMaterial(`star-${index}`, scene);
    const color = Color3.FromHexString(hex);
    material.diffuseColor = color;
    material.emissiveColor = color;
    material.alpha = index === 2 ? 0.72 : 0.9;
    material.backFaceCulling = false;
    return material;
  });
  const stars: Mesh[] = [];
  for (let index = 0; index < 120; index += 1) {
    const star = MeshBuilder.CreateDisc(`starfield-${index}`, { radius: 0.009 + (index % 4) * 0.007, tessellation: 6 }, scene);
    const x = ((index * 47) % 191) / 191 * 18 - 9;
    const y = ((index * 83) % 173) / 173 * 11 - 5.5;
    star.position.set(x, y, -2.8 + (index % 3) * 0.1);
    star.material = starMaterials[index % starMaterials.length];
    stars.push(star);
  }

  const bandMaterial = new StandardMaterial("flightline", scene);
  bandMaterial.diffuseColor = Color3.FromHexString("#42E8FF");
  bandMaterial.emissiveColor = Color3.FromHexString("#42E8FF");
  bandMaterial.alpha = 0.1;
  bandMaterial.backFaceCulling = false;
  for (let index = 0; index < 7; index += 1) {
    const line = MeshBuilder.CreatePlane(`flight-grid-${index}`, { width: 0.008, height: 10.3 }, scene);
    line.material = bandMaterial;
    line.position.set(-7.6 + index * 2.52, 0, -2.4);
  }

  return (delta: number) => {
    stars.forEach((star, index) => {
      star.position.y -= delta * (0.22 + (index % 3) * 0.16);
      if (star.position.y < -5.6) star.position.y = 5.6;
    });
  };
}
