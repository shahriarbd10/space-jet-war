// Voidline Command HUD: off-axis tactical instrumentation with concise mission-language feedback.
import { assets } from "./assets";

export type HudState = "menu" | "playing" | "paused" | "gameover";

export interface HudSnapshot {
  score: number;
  shield: number;
  wave: number;
  state: HudState;
  overdrive: number;
  message: string;
}

interface HudActions {
  start: () => void;
  pause: () => void;
  fire: (active: boolean) => void;
}

export class HudController {
  private readonly root: HTMLDivElement;
  private readonly scoreEl: HTMLElement;
  private readonly shieldEl: HTMLElement;
  private readonly waveEl: HTMLElement;
  private readonly overdriveEl: HTMLElement;
  private readonly messageEl: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly panelKicker: HTMLElement;
  private readonly panelTitle: HTMLElement;
  private readonly panelCopy: HTMLElement;
  private readonly startButton: HTMLButtonElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly actions: HudActions;

  constructor(actions: HudActions) {
    this.actions = actions;
    this.root = document.createElement("div");
    this.root.id = "voidline-hud";
    this.root.innerHTML = `
      <div class="hud-grain" aria-hidden="true"></div>
      <section class="hud-brand" aria-label="Space Jet War">
        <img src="${assets.mark}" alt="" />
        <div><span>VOIDLINE</span><strong>JET WAR</strong></div>
      </section>
      <section class="hud-systems" aria-label="Mission telemetry">
        <div class="hud-readout"><span>SCORE</span><strong data-score>000000</strong></div>
        <div class="hud-readout"><span>WAVE</span><strong data-wave>01</strong></div>
        <div class="hud-readout shield"><span>SHIELD</span><strong data-shield>100%</strong><i><b data-shield-bar></b></i></div>
      </section>
      <section class="hud-left-telemetry" aria-label="Flight telemetry">
        <span>INT. VECTOR</span><b>ARC-09</b><span>VECTOR LINK</span><b class="cyan">LOCKED</b>
      </section>
      <p class="hud-message" data-message>SECTOR STANDBY</p>
      <div class="hud-overdrive" data-overdrive>OVERDRIVE READY</div>
      <button class="hud-pause" type="button" data-pause aria-label="Pause or resume mission">II</button>
      <section class="mission-panel" data-panel aria-live="polite">
        <span data-panel-kicker>INTERCEPT PROTOCOL</span>
        <h1 data-panel-title>SPACE<br/><em>JET WAR</em></h1>
        <p data-panel-copy>Hold the flightline. Break the incoming swarm before it reaches the relay.</p>
        <button class="mission-launch" type="button" data-start><span>LAUNCH INTERCEPT</span><b>↗</b></button>
        <small><kbd>WASD</kbd><kbd>ARROWS</kbd> STEER &nbsp; <kbd>SPACE</kbd> FIRE &nbsp; <kbd>P</kbd> PAUSE</small>
      </section>
      <section class="hud-footer" aria-label="Controls">
        <span>MOVE / AIM <b>WASD · ARROWS · POINTER</b></span>
        <button class="hud-fire" type="button" data-fire aria-label="Fire plasma bolts">FIRE <b>▴</b></button>
      </section>`;
    document.body.appendChild(this.root);

    this.scoreEl = this.require("[data-score]");
    this.shieldEl = this.require("[data-shield]");
    this.waveEl = this.require("[data-wave]");
    this.overdriveEl = this.require("[data-overdrive]");
    this.messageEl = this.require("[data-message]");
    this.panel = this.require("[data-panel]");
    this.panelKicker = this.require("[data-panel-kicker]");
    this.panelTitle = this.require("[data-panel-title]");
    this.panelCopy = this.require("[data-panel-copy]");
    this.startButton = this.require("[data-start]");
    this.pauseButton = this.require("[data-pause]");

    this.startButton.addEventListener("click", actions.start);
    this.pauseButton.addEventListener("click", actions.pause);
    const fireButton = this.require("[data-fire]");
    fireButton.addEventListener("pointerdown", () => actions.fire(true));
    window.addEventListener("pointerup", this.releaseFire);
  }

  update(snapshot: HudSnapshot) {
    this.scoreEl.textContent = snapshot.score.toString().padStart(6, "0");
    this.waveEl.textContent = snapshot.wave.toString().padStart(2, "0");
    this.shieldEl.textContent = `${Math.ceil(snapshot.shield)}%`;
    this.require<HTMLElement>("[data-shield-bar]").style.width = `${snapshot.shield}%`;
    this.messageEl.textContent = snapshot.message;
    this.overdriveEl.textContent = snapshot.overdrive > 0 ? `OVERDRIVE ${snapshot.overdrive.toFixed(1)}s` : "OVERDRIVE READY";
    this.overdriveEl.classList.toggle("active", snapshot.overdrive > 0);
    this.pauseButton.textContent = snapshot.state === "paused" ? "▶" : "II";
    this.panel.classList.toggle("show", snapshot.state !== "playing");

    if (snapshot.state === "menu") {
      this.panelKicker.textContent = "INTERCEPT PROTOCOL";
      this.panelTitle.innerHTML = "SPACE<br/><em>JET WAR</em>";
      this.panelCopy.textContent = "Hold the flightline. Break the incoming swarm before it reaches the relay.";
      this.startButton.innerHTML = "<span>LAUNCH INTERCEPT</span><b>↗</b>";
    } else if (snapshot.state === "paused") {
      this.panelKicker.textContent = "MISSION HOLD";
      this.panelTitle.innerHTML = "SYSTEM<br/><em>PAUSED</em>";
      this.panelCopy.textContent = "Reacquire your vector when the relay is clear.";
      this.startButton.innerHTML = "<span>RESUME MISSION</span><b>↗</b>";
    } else if (snapshot.state === "gameover") {
      this.panelKicker.textContent = "RELAY BREACH";
      this.panelTitle.innerHTML = "VECTOR<br/><em>LOST</em>";
      this.panelCopy.textContent = `Final combat score: ${snapshot.score.toString().padStart(6, "0")}. Re-arm and return to the flightline.`;
      this.startButton.innerHTML = "<span>RE-LAUNCH INTERCEPT</span><b>↗</b>";
    }
  }

  dispose() {
    window.removeEventListener("pointerup", this.releaseFire);
    this.root.remove();
  }

  private releaseFire = () => this.actions.fire(false);
  private require<T extends HTMLElement = HTMLElement>(selector: string) {
    const el = this.root.querySelector<T>(selector);
    if (!el) throw new Error(`HUD element not found: ${selector}`);
    return el;
  }
}

