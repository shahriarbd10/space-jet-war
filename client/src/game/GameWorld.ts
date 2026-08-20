// Voidline Command gameplay: an orthographic, readable arcade dogfight with tactical color semantics.
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { assets } from "./assets";
import { HudController, type HudState } from "./HudController";
import { InputController } from "./InputController";

type Owner = "player" | "enemy";
type Projectile = { mesh: Mesh; velocity: Vector3; owner: Owner; life: number; damage: number };
type Effect = { mesh: Mesh; life: number; maxLife: number; scale: number };

const CYAN = Color3.FromHexString("#42E8FF");
const RED = Color3.FromHexString("#FF4D5A");
const AMBER = Color3.FromHexString("#FFB84A");

class Player {
  readonly mesh: Mesh;
  shield = 100;
  fireCooldown = 0;
  invulnerable = 0;
  overdrive = 0;

  constructor(scene: Scene, material: StandardMaterial, vectorMaterial: StandardMaterial) {
    this.mesh = MeshBuilder.CreatePlane("player-interceptor", { size: 1.55 }, scene);
    this.mesh.material = material;
    this.mesh.position = new Vector3(0, -3.55, 0);
    createJetSilhouette(scene, this.mesh, vectorMaterial, 0.88, true);
    createTargetBracket(scene, this.mesh, CYAN);
  }

  reset() {
    this.mesh.position.copyFromFloats(0, -3.55, 0);
    this.shield = 100;
    this.fireCooldown = 0;
    this.invulnerable = 0;
    this.overdrive = 0;
    this.mesh.visibility = 1;
  }

  update(delta: number, input: InputController, demoTime: number | null, fire: (position: Vector3) => void) {
    const move = input.movement;
    if (demoTime !== null) {
      this.mesh.position.x = Math.sin(demoTime * 0.84) * 5.2;
      this.mesh.position.y = -3.15 + Math.cos(demoTime * 1.2) * 0.45;
    } else if (input.hasPointerTarget) {
      if (!input.firing) {
        this.mesh.position.x = move.x * 7.7;
        this.mesh.position.y = move.y * 4.25;
      }
    } else if (Math.abs(move.x) > 0.02 || Math.abs(move.y) > 0.02) {
      this.mesh.position.x += move.x * 9 * delta;
      this.mesh.position.y += move.y * 7 * delta;
    }
    this.mesh.position.x = Math.max(-7.55, Math.min(7.55, this.mesh.position.x));
    this.mesh.position.y = Math.max(-4.4, Math.min(3.6, this.mesh.position.y));
    this.mesh.rotation.z = Math.max(-0.35, Math.min(0.35, -move.x * 0.34));
    this.fireCooldown -= delta;
    this.invulnerable = Math.max(0, this.invulnerable - delta);
    this.overdrive = Math.max(0, this.overdrive - delta);
    this.mesh.visibility = this.invulnerable > 0 && Math.floor(this.invulnerable * 14) % 2 === 0 ? 0.35 : 1;
    const shouldFire = input.firing || demoTime !== null;
    if (shouldFire && this.fireCooldown <= 0) {
      fire(this.mesh.position.add(new Vector3(0, 0.8, -0.25)));
      this.fireCooldown = this.overdrive > 0 ? 0.11 : 0.24;
    }
  }

  hit(damage: number) {
    if (this.invulnerable > 0) return false;
    this.shield = Math.max(0, this.shield - damage);
    this.invulnerable = 0.55;
    return true;
  }
}

class Enemy {
  readonly mesh: Mesh;
  private age = 0;
  private shotTimer: number;
  readonly health: number;

  constructor(scene: Scene, material: StandardMaterial, vectorMaterial: StandardMaterial, x: number, y: number, index: number, wave: number) {
    this.mesh = MeshBuilder.CreatePlane(`drone-${wave}-${index}`, { size: 0.98 + (index % 3 === 0 ? 0.14 : 0) }, scene);
    this.mesh.material = material;
    this.mesh.position = new Vector3(x, y, 0.1);
    createJetSilhouette(scene, this.mesh, vectorMaterial, 0.64, false);
    this.shotTimer = 1.15 + (index % 4) * 0.27;
    this.health = index % 5 === 0 && wave > 1 ? 2 : 1;
  }

  update(delta: number, fire: (position: Vector3) => void) {
    this.age += delta;
    this.mesh.position.y -= (0.35 + Math.min(0.24, this.age * 0.01)) * delta;
    this.mesh.position.x += Math.sin(this.age * 1.9 + this.mesh.position.y) * 0.44 * delta;
    this.mesh.rotation.z = Math.sin(this.age * 2.4) * 0.18;
    this.shotTimer -= delta;
    if (this.shotTimer <= 0 && this.mesh.position.y < 4.75) {
      this.shotTimer = 1.7 + (Math.sin(this.age * 3) + 1) * 0.45;
      fire(this.mesh.position.add(new Vector3(0, -0.54, -0.1)));
    }
  }

  dispose() { this.mesh.dispose(); }
}

export class GameWorld {
  private readonly input: InputController;
  private readonly hud: HudController;
  private readonly player: Player;
  private readonly playerMaterial: StandardMaterial;
  private readonly enemyMaterial: StandardMaterial;
  private readonly pickupMaterial: StandardMaterial;
  private readonly cyanMaterial: StandardMaterial;
  private readonly redMaterial: StandardMaterial;
  private readonly amberMaterial: StandardMaterial;
  private state: HudState = "menu";
  private score = 0;
  private wave = 1;
  private kills = 0;
  private nextWaveDelay = -1;
  private message = "SECTOR STANDBY";
  private messageTimer = 0;
  private demoTime: number | null;
  private readonly enemies: Enemy[] = [];
  private readonly projectiles: Projectile[] = [];
  private pickup: Mesh | null = null;
  private readonly effects: Effect[] = [];

  constructor(private readonly scene: Scene, canvas: HTMLCanvasElement, demo: boolean) {
    this.input = new InputController(canvas);
    this.playerMaterial = this.makeSpriteMaterial("player-mat", assets.player, CYAN);
    this.enemyMaterial = this.makeSpriteMaterial("enemy-mat", assets.enemy, RED);
    this.pickupMaterial = this.makeSpriteMaterial("pickup-mat", assets.pickup, AMBER);
    this.cyanMaterial = this.makeGlowMaterial("plasma-cyan", CYAN);
    this.redMaterial = this.makeGlowMaterial("plasma-red", RED);
    this.amberMaterial = this.makeGlowMaterial("plasma-amber", AMBER);
    this.player = new Player(scene, this.playerMaterial, this.cyanMaterial);
    this.hud = new HudController({ start: () => this.start(), pause: () => this.togglePause(), fire: (active) => this.input.setExternalFire(active) });
    this.demoTime = demo ? 0 : null;
    if (demo) this.start();
    this.updateHud();
  }

  update(delta: number) {
    if (this.input.consumePause()) this.togglePause();
    if ((this.state === "menu" || this.state === "gameover") && this.input.consumeStart()) this.start();
    if (this.state === "paused") { this.updateHud(); return; }
    if (this.state !== "playing") { this.updateEffects(delta); this.updateHud(); return; }

    if (this.demoTime !== null) this.demoTime += delta;
    this.messageTimer = Math.max(0, this.messageTimer - delta);
    if (this.messageTimer === 0 && this.message !== "ENGAGE HOSTILES") this.message = "ENGAGE HOSTILES";

    this.player.update(delta, this.input, this.demoTime, (position) => this.spawnProjectile(position, "player"));
    for (const enemy of this.enemies) enemy.update(delta, (position) => this.spawnProjectile(position, "enemy"));
    this.updateProjectiles(delta);
    this.updatePickup(delta);
    this.updateEffects(delta);
    this.removeEscapedEnemies();
    this.advanceWave(delta);
    if (this.player.shield <= 0) this.endGame();
    this.updateHud();
  }

  start() {
    if (this.state === "paused") { this.state = "playing"; this.setMessage("INTERCEPT RESUMED", 1.2); return; }
    this.clearActors();
    this.player.reset();
    this.score = 0;
    this.wave = 1;
    this.kills = 0;
    this.state = "playing";
    this.nextWaveDelay = -1;
    this.setMessage("ENGAGE HOSTILES", 1.5);
    this.spawnWave();
  }

  togglePause() {
    if (this.state === "playing") { this.state = "paused"; this.setMessage("MISSION HOLD", 999); }
    else if (this.state === "paused") { this.state = "playing"; this.setMessage("INTERCEPT RESUMED", 1.1); }
  }

  dispose() {
    this.input.dispose();
    this.hud.dispose();
    this.clearActors();
  }

  private spawnWave() {
    const count = 5 + this.wave * 2;
    for (let index = 0; index < count; index += 1) {
      const row = Math.floor(index / 5);
      const col = index % 5;
      const x = -5.6 + col * 2.8 + (row % 2 ? 0.65 : 0);
      const y = 5.3 + row * 1.25;
      this.enemies.push(new Enemy(this.scene, this.enemyMaterial, this.redMaterial, x, y, index, this.wave));
    }
    this.setMessage(`WAVE ${this.wave.toString().padStart(2, "0")} INBOUND`, 1.7);
  }

  private spawnProjectile(position: Vector3, owner: Owner) {
    const mesh = MeshBuilder.CreateDisc(`${owner}-bolt`, { radius: owner === "player" ? 0.09 : 0.11, tessellation: 10 }, this.scene);
    mesh.material = owner === "player" ? this.cyanMaterial : this.redMaterial;
    mesh.position.copyFrom(position);
    mesh.position.z = -0.25;
    this.projectiles.push({ mesh, owner, velocity: new Vector3(0, owner === "player" ? 13 : -7, 0), life: 2.2, damage: owner === "player" ? 1 : 13 });
  }

  private updateProjectiles(delta: number) {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      projectile.life -= delta;
      projectile.mesh.position.addInPlace(projectile.velocity.scale(delta));
      let remove = projectile.life <= 0 || Math.abs(projectile.mesh.position.y) > 6.3;
      if (!remove && projectile.owner === "player") {
        const enemyIndex = this.enemies.findIndex((enemy) => Vector3.DistanceSquared(enemy.mesh.position, projectile.mesh.position) < 0.42);
        if (enemyIndex >= 0) {
          const enemy = this.enemies[enemyIndex];
          const destroyedPosition = enemy.mesh.position.clone();
          enemy.dispose();
          this.enemies.splice(enemyIndex, 1);
          this.score += 125;
          this.kills += 1;
          this.emitEffect(destroyedPosition, CYAN, 0.7);
          if (this.kills % 5 === 0 && !this.pickup) this.spawnPickup(destroyedPosition);
          remove = true;
        }
      } else if (!remove && projectile.owner === "enemy" && Vector3.DistanceSquared(this.player.mesh.position, projectile.mesh.position) < 0.55) {
        if (this.player.hit(projectile.damage)) {
          this.emitEffect(projectile.mesh.position, RED, 1.1);
          this.setMessage("SHIELD STRIKE", 0.65);
        }
        remove = true;
      }
      if (remove) { projectile.mesh.dispose(); this.projectiles.splice(index, 1); }
    }
  }

  private spawnPickup(position: Vector3) {
    this.pickup = MeshBuilder.CreatePlane("energy-core", { size: 0.78 }, this.scene);
    this.pickup.material = this.pickupMaterial;
    this.pickup.position.copyFrom(position);
    this.pickup.position.z = 0.1;
  }

  private updatePickup(delta: number) {
    if (!this.pickup) return;
    this.pickup.position.y -= 1.25 * delta;
    this.pickup.rotation.z += delta * 1.9;
    if (Vector3.DistanceSquared(this.pickup.position, this.player.mesh.position) < 0.92) {
      this.player.overdrive = 7;
      this.score += 300;
      this.emitEffect(this.pickup.position, AMBER, 1.3);
      this.setMessage("OVERDRIVE CORE ACQUIRED", 1.5);
      this.pickup.dispose();
      this.pickup = null;
    } else if (this.pickup.position.y < -5.5) { this.pickup.dispose(); this.pickup = null; }
  }

  private emitEffect(position: Vector3, color: Color3, scale: number) {
    const mesh = MeshBuilder.CreateDisc("impact-ring", { radius: 0.22, tessellation: 16 }, this.scene);
    mesh.material = color.equals(RED) ? this.redMaterial : color.equals(AMBER) ? this.amberMaterial : this.cyanMaterial;
    mesh.position.copyFrom(position);
    mesh.position.z = -0.35;
    this.effects.push({ mesh, life: 0.34, maxLife: 0.34, scale });
  }

  private updateEffects(delta: number) {
    for (let index = this.effects.length - 1; index >= 0; index -= 1) {
      const effect = this.effects[index];
      effect.life -= delta;
      const progress = 1 - effect.life / effect.maxLife;
      effect.mesh.scaling.setAll(1 + progress * effect.scale * 5);
      effect.mesh.visibility = Math.max(0, 1 - progress);
      if (effect.life <= 0) { effect.mesh.dispose(); this.effects.splice(index, 1); }
    }
  }

  private removeEscapedEnemies() {
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      if (this.enemies[index].mesh.position.y < -5.25) {
        this.enemies[index].dispose();
        this.enemies.splice(index, 1);
        this.player.hit(18);
        this.setMessage("PERIMETER BREACH", 1.1);
      }
    }
  }

  private advanceWave(delta: number) {
    if (this.enemies.length > 0) return;
    if (this.nextWaveDelay < 0) {
      this.nextWaveDelay = 1.4;
      this.setMessage("SECTOR CLEAR", 1.25);
      return;
    }
    this.nextWaveDelay -= delta;
    if (this.nextWaveDelay <= 0) { this.wave += 1; this.nextWaveDelay = -1; this.spawnWave(); }
  }

  private endGame() {
    this.state = "gameover";
    this.setMessage("RELAY BREACH", 999);
    this.player.mesh.visibility = 0;
    this.emitEffect(this.player.mesh.position, RED, 2.2);
  }

  private clearActors() {
    this.enemies.forEach((enemy) => enemy.dispose());
    this.enemies.length = 0;
    this.projectiles.forEach((projectile) => projectile.mesh.dispose());
    this.projectiles.length = 0;
    this.effects.forEach((effect) => effect.mesh.dispose());
    this.effects.length = 0;
    this.pickup?.dispose();
    this.pickup = null;
  }

  private setMessage(message: string, duration: number) { this.message = message; this.messageTimer = duration; }
  private updateHud() {
    this.hud.update({ score: this.score, shield: this.player.shield, wave: this.wave, state: this.state, overdrive: this.player.overdrive, message: this.message });
  }

  private makeSpriteMaterial(name: string, url: string, color: Color3) {
    const material = new StandardMaterial(name, this.scene);
    const texture = new Texture(url, this.scene, true, false);
    texture.hasAlpha = true;
    material.diffuseTexture = texture;
    material.useAlphaFromDiffuseTexture = true;
    material.emissiveColor = color.scale(0.26);
    material.specularColor = Color3.Black();
    material.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
    material.backFaceCulling = false;
    return material;
  }

  private makeGlowMaterial(name: string, color: Color3) {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.emissiveColor = color;
    material.specularColor = Color3.Black();
    material.alpha = 0.94;
    material.backFaceCulling = false;
    return material;
  }
}

function createJetSilhouette(scene: Scene, parent: Mesh, material: StandardMaterial, scale: number, facesUp: boolean) {
  const body = MeshBuilder.CreateDisc("vector-body", { radius: scale, tessellation: 3 }, scene);
  body.material = material;
  body.rotation.z = facesUp ? Math.PI / 2 : -Math.PI / 2;
  body.scaling.set(0.72, 1.2, 1);
  body.position.z = 0.45;
  body.parent = parent;

  const wingL = MeshBuilder.CreateDisc("vector-wing-left", { radius: scale * 0.54, tessellation: 3 }, scene);
  wingL.material = material;
  wingL.rotation.z = facesUp ? Math.PI * 1.18 : -Math.PI * 0.18;
  wingL.position.set(-scale * 0.42, facesUp ? -scale * 0.02 : scale * 0.02, 0.43);
  wingL.parent = parent;

  const wingR = MeshBuilder.CreateDisc("vector-wing-right", { radius: scale * 0.54, tessellation: 3 }, scene);
  wingR.material = material;
  wingR.rotation.z = facesUp ? -Math.PI * 0.18 : Math.PI * 1.18;
  wingR.position.set(scale * 0.42, facesUp ? -scale * 0.02 : scale * 0.02, 0.43);
  wingR.parent = parent;
}

function createTargetBracket(scene: Scene, parent: Mesh, color: Color3) {
  const corners = [
    [[-1.0, 0.72], [-0.7, 0.72], [-1.0, 0.72], [-1.0, 0.42]],
    [[1.0, 0.72], [0.7, 0.72], [1.0, 0.72], [1.0, 0.42]],
    [[-1.0, -0.72], [-0.7, -0.72], [-1.0, -0.72], [-1.0, -0.42]],
    [[1.0, -0.72], [0.7, -0.72], [1.0, -0.72], [1.0, -0.42]],
  ];
  corners.forEach((points, index) => {
    const line = MeshBuilder.CreateLines(`target-bracket-${index}`, { points: points.map(([x, y]) => new Vector3(x, y, 0.5)) }, scene);
    line.color = color;
    line.alpha = 0.72;
    line.parent = parent;
  });
}
