# Development Memory

## 2026-08-20 — Project Setup

- Initialized a static React/Vite WebDev host at `/home/ubuntu/space-jet-war`.
- Selected the **Voidline Command** art direction and documented it in `ideas.md`.
- Generated the visual target and four game assets; their persistent WebDev asset URLs are listed in `ASSETS.md`.
- The game will use React as a lifecycle-safe full-screen host and Babylon.js as the gameplay canvas. Gameplay modules must stay framework-independent under `client/src/game/`.
- Verification will use the WebDev preview and deterministic `?demo` mode, not temporary links.

## 2026-08-20 — First Visual Verification

- The first full-screen demo capture rendered only the deep-space clear color, revealing that the orthographic camera was viewing the initial plane meshes from their culled side. The camera now sits on the positive Z axis, and sprite, glow, planet, star, and flightline materials render both faces.
- The corrected capture confirmed that the perimeter HUD, Voidline wordmark, telemetry, score, shield, pause control, and bottom command strip render at desktop scale. A further capture is required after the two-sided material change to confirm active game entities and parallax details.
- The visual review’s accepted decisions were appended to `ideas.md`: the first frame must show the full tactical signature system; cyan is functional player/friendly signal only; and copy retains a clipped command tone.

## 2026-08-20 — Layering Verification

- A subsequent desktop demo capture confirmed that two-sided procedural stars, cyan/red projectiles, vertical flightlines, and the cropped indigo planet horizon now render behind the HUD. Background depth was then moved to negative Z so it no longer competes with game entities.
- The generated entity URLs still displayed their temporary generation placeholders during this capture. The runtime references the permanent asset URLs directly, as required; procedural signal dots and geometry continue to make the active gameplay state readable while those hosted images finish replacing their placeholders.

## 2026-08-20 — Responsive and Combat Verification

- The responsive mobile demo keeps the brand, compact score/shield telemetry, pause action, status message, overdrive readout, and fire control within the viewport while removing low-priority flight telemetry.
- The desktop demo now visibly contains a cyan player interceptor with four-corner targeting brackets, a red hostile interceptor, cyan/red projectiles, stars, vertical flightlines, a cropped planet horizon, and the perimeter command HUD. This establishes the intended first-frame tactical theater while retaining permanent generated image textures for final asset resolution.

## 2026-08-20 — Release Validation

- `pnpm check` passes after the final procedural interceptor and targeting-bracket refinement.
- A final `pnpm build` passes. Vite reports an advisory chunk-size warning from the Babylon.js runtime bundle, but the production output is generated successfully.
- Recent browser-console output contains no error, warning, or uncaught-exception entries for the active demo run.

## 2026-08-20 — Pointer Steering Correction

- The pointer target was previously ignored whenever firing was active, so holding the primary mouse button could freeze cursor-based steering. The player now smoothly interpolates toward the cursor target on every frame, including during firing.
- `pnpm check` and the production build pass after the correction. The desktop mission view remains intact and recent browser-console output reports no runtime errors.

## 2026-08-20 — Horizontal Pointer Axis Correction

- The game camera’s visible horizontal direction is opposite the raw browser-space X coordinate in the active setup. The pointer conversion now inverts that axis before steering, so cursor movement to the right directs the interceptor right on screen.
- The corrected mapping passes `pnpm check` and a production build; recent browser-console review contains no runtime errors.

## 2026-08-20 — Keyboard Direction Correction

- The game camera mirrors the world’s horizontal axis on screen. The keyboard vector now applies that same horizontal inversion: `A` and Left move the interceptor left; `D` and Right move it right. The existing vertical mapping already keeps `W`/Up moving up and `S`/Down moving down.
- `pnpm check` and the production build both pass after the update, and recent browser-console review contains no runtime errors.
