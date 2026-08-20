# Space Jet War — Architecture

## Runtime Layers

```text
React host
└── GameCanvas (one lifecycle-safe Babylon Engine and one full-screen canvas)
    └── createGameScene(engine, canvas)
        └── GameWorld
            ├── InputController
            ├── Player
            ├── EnemyManager
            ├── ProjectileManager
            ├── PickupManager
            ├── EffectsManager
            └── HudController
```

## Ownership

`GameCanvas` is the React picture frame. It creates and destroys Babylon’s engine exactly once for the mounted canvas, delegates scene creation to `createGameScene`, and delegates all gameplay to the returned `GameHandle`.

`createGameScene` owns Babylon scene setup: an orthographic camera, unlit space materials, a layered procedural starfield, and the `GameWorld` update loop. Its `GameHandle` starts cleanly, exposes only the Babylon scene to the render loop, and disposes DOM UI, input listeners, meshes, and observable callbacks when the component unmounts.

`GameWorld` owns the session state machine (`menu`, `playing`, `paused`, `gameover`), score, shield, wave, and per-frame simulation. It coordinates gameplay objects but does not embed rules in Babylon mesh metadata.

`Player` owns its visual mesh, position, shield state, short invulnerability window, and firing cadence. `EnemyManager` owns a small collection of `Enemy` objects and formation/wave scheduling. `ProjectileManager` uses a compact data-oriented collection because many bullets share the same update and lifetime behavior. `PickupManager` owns energy-core lifetime and player collection rules. `EffectsManager` owns short-lived impact rings and thruster glow primitives.

`InputController` maps raw events to semantic actions—move vector, firing held, pause, start/restart—and does not contain game rules. `HudController` uses a DOM overlay separate from the game canvas to render status, menus, controls, and accessible interactive buttons.

## Data Flow

Input intent travels from `InputController` to `GameWorld`, which directs the `Player`. The player and enemy manager emit projectile spawn requests to `ProjectileManager`; collision outcomes return to `GameWorld`, which changes score, shield, wave, and pickup state. `HudController` receives a compact view model from `GameWorld` every frame or on state change.

## Technical Choices

The combat plane uses an orthographic top-down camera and lightweight Babylon planes/discs rather than physics or imported 3D models. Generated PNG cutouts load as alpha textures on planes. Each player and enemy also owns a small procedural vector silhouette so the craft remain readable at arcade scale, even while an image texture is still downloading. Stars, shots, impact rings, player targeting brackets, HUD framing, and planet horizon are procedural geometry, keeping rendering fast and the visual target achievable. `?demo` enables deterministic autopilot input for visual verification.
