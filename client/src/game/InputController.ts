// Voidline Command interaction philosophy: input is immediate, semantic, and independent of rendering.
import { Vector2 } from "@babylonjs/core/Maths/math.vector";

export class InputController {
  private readonly pressed = new Set<string>();
  private pointer: Vector2 | null = null;
  private externalFire = false;
  private startQueued = false;
  private pauseQueued = false;
  private readonly onKeyDown: (event: KeyboardEvent) => void;
  private readonly onKeyUp: (event: KeyboardEvent) => void;
  private readonly onPointerMove: (event: PointerEvent) => void;
  private readonly onPointerDown: (event: PointerEvent) => void;
  private readonly onPointerUp: () => void;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.onKeyDown = (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
      this.pressed.add(event.key.toLowerCase());
      this.pointer = null;
      if (event.key === "Enter") this.startQueued = true;
      if (event.key.toLowerCase() === "p" || event.key === "Escape") this.pauseQueued = true;
    };
    this.onKeyUp = (event) => this.pressed.delete(event.key.toLowerCase());
    this.onPointerMove = (event) => this.updatePointer(event);
    this.onPointerDown = (event) => {
      this.updatePointer(event);
      this.externalFire = true;
      this.canvas.focus();
    };
    this.onPointerUp = () => { this.externalFire = false; };

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  get movement() {
    if (this.pointer) return this.pointer.clone();
    const x = Number(this.pressed.has("d") || this.pressed.has("arrowright")) - Number(this.pressed.has("a") || this.pressed.has("arrowleft"));
    const y = Number(this.pressed.has("w") || this.pressed.has("arrowup")) - Number(this.pressed.has("s") || this.pressed.has("arrowdown"));
    return new Vector2(x, y);
  }

  get firing() { return this.externalFire || this.pressed.has(" "); }
  get hasPointerTarget() { return this.pointer !== null; }
  setExternalFire(active: boolean) { this.externalFire = active; }
  consumeStart() { const value = this.startQueued; this.startQueued = false; return value; }
  consumePause() { const value = this.pauseQueued; this.pauseQueued = false; return value; }

  private updatePointer(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - ((event.clientY - rect.top) / rect.height) * 2;
    this.pointer = new Vector2(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
  }
}
