# Game Plan: Space Jet War

## Main Build

Build a full-screen, single-player browser arcade shooter in Babylon.js. The player pilots a Voidline interceptor across a scrolling tactical starfield, steers with pointer, keyboard, or touch input, fires cyan plasma, destroys red drone formations, collects amber energy cores, and survives escalating waves. The play session should include a clear start state, active combat state, pause command, shield/score/wave HUD, temporary rapid-fire pickup, game-over result, and replay action.

- **Assets needed:** One in-game visual target; player interceptor cutout; enemy-drone cutout; amber energy-core cutout; transparent Voidline brand mark. The planet horizon, star layers, plasma bolts, engine trails, impact rings, HUD framing, and enemy targeting brackets use procedural meshes, particles, or canvas-like primitives.
- **Verify:**
  - Arrow keys/WASD, pointer movement, and touch movement all steer the player in the expected direction without leaving the playfield.
  - Keyboard Space, pointer/touch press, and the on-screen fire control produce cyan bolts at a stable cadence; a rapid-fire core visibly increases that cadence before returning to normal.
  - Enemy formations enter from above, drift and fire hostile red bolts; projectile collisions consistently decrement shield or remove the target, with a visible impact burst.
  - Destroying drones raises score; clearing an intended wave advances the displayed wave count; losing all shield opens a replay-capable game-over state.
  - The HUD remains legible without overlap at desktop and mobile viewport sizes; pause/restart controls are keyboard reachable.
  - Generated textures load, have no obvious placeholder artifacts, and preserve a clear player/enemy/pickup color distinction.
  - No browser console errors appear during an active captured run.
  - The `?demo` mode visibly demonstrates autonomous combat for screenshot verification.
  - Visual target consistency: near-black tactical space, cyan player signal, amber reward signal, red threat signal, upper enemy formations, lower player stance, thin angular HUD, and restrained planet-horizon depth.

