# Marble Drop Builder — Codebase Analysis

> Generated: 2026-04-17 | Version: v3.4 | Branch: codebase-analysis

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Module Map & Dependency Graph](#2-module-map--dependency-graph)
3. [State Management](#3-state-management)
4. [Game Mechanics & Physics](#4-game-mechanics--physics)
5. [Weapon Systems](#5-weapon-systems)
6. [Rendering Pipeline](#6-rendering-pipeline)
7. [Input Handling](#7-input-handling)
8. [Audio Engine](#8-audio-engine)
9. [UI / HTML Structure](#9-ui--html-structure)
10. [Config Constants Reference](#10-config-constants-reference)

---

## 1. Architecture Overview

Marble Drop Builder is a browser-based canvas game deployed as a **zero-build static site** (GitHub Pages). There is no bundler, no npm, no transpilation. The browser loads ES modules natively.

**Entry point:** `<script type="module" src="js/main.js">` in `index.html`.

### Boot sequence (`main.js`)

1. `window.addEventListener('load', init)` fires after the DOM is ready.
2. `init()` grabs the `<canvas>` and `2d` context, writes them into `state.canvas`/`state.ctx`.
3. `resizeCanvas()` reads the container dimensions and calls `setupGrid()`.
4. `setupInput()` wires all canvas touch/mouse listeners.
5. `setupButtons()` wires all HTML button `addEventListener` calls.
6. A `ResizeObserver` (or `resize` fallback) keeps the canvas sized to its container.
7. `state.lastTimestamp = performance.now()` seeds the frame timer.
8. `requestAnimationFrame(render)` starts the game loop.

### Key architectural decisions

| Decision | Rationale |
|---|---|
| Single `state.js` object | All modules share one import; no prop-drilling, no global `window.*` vars |
| `config.js` constants never mutated | Config is read-only across entire codebase |
| No circular dependencies | Dependency graph flows strictly downward (see §2) |
| Fixed 60 fps physics timestep | Accumulator pattern in `render()` — deterministic simulation regardless of display refresh rate |
| Native ES modules | Works on iPad Safari without a build step |

---

## 2. Module Map & Dependency Graph

### File listing with responsibilities

| File | Exports | Imports from |
|---|---|---|
| `js/main.js` | (entry, no exports) | `state`, `config.BALL_COUNTS`, `grid.setupGrid`, `handler.setupInput`, `buttons.setupButtons`, `draw.render` |
| `js/config.js` | All game constants (see §10) | — |
| `js/state.js` | `state` object | — |
| `js/utils/color.js` | `parseHex`, `lighten`, `darken` | — |
| `js/utils/math.js` | `closestPtOnSeg`, `distToSeg`, `bezierPt`, `sampleCurve`, `distToCurve` | — |
| `js/audio/sound.js` | `soundEngine` singleton | — |
| `js/engine/grid.js` | `setupGrid`, `snapToDot` | `state`, `config.SNAP_RADIUS` |
| `js/engine/collision.js` | `reflectSeg` | `config.WALL_HALF_W`, `config.MAX_BALL_SPEED`, `config.FLASH_DURATION`, `math.closestPtOnSeg` |
| `js/rendering/effects.js` | `drawGhost`, `drawRocketParticles`, `drawSteamParticles`, `spawnAbsorptionBurst`, `spawnSteamParticles`, `updateParticles` | `state`, `config.DOT_RADIUS`, `config.WALL_HALF_W`, `config.GRAVITY`, `color.parseHex`, `grid.snapToDot` |
| `js/rendering/hud.js` | `addScore`, `flashMagazineEmpty`, `updateMagazine`, `updateHeatUI` | `state`, `config.MAGAZINE_CAPACITY`, `config.ROCKET_LOCK_DURATION`, `config.MAGAZINE_CHARGE_TIME`, `config.LASER_HEAT_MAX`, `sound.soundEngine` |
| `js/rendering/turret.js` | `drawTurret`, `drawRocket`, `drawLaserBeam` | `state`, `config.ROCKET_RADIUS` |
| `js/engine/physics.js` | `updatePhysics` | `state`, many config constants, `collision.reflectSeg`, `math.sampleCurve`, `sound.soundEngine`, `effects.spawnAbsorptionBurst`, `effects.spawnSteamParticles`, `effects.updateParticles`, `hud.addScore` |
| `js/rendering/draw.js` | `render` | `state`, config constants, `color.lighten`, `color.darken`, `physics.updatePhysics`, `effects.*`, `turret.*`, `hud.updateMagazine`, `hud.updateHeatUI` |
| `js/weapons/rocket.js` | `tryFireRocket` | `state`, `config.ROCKET_SPEED`, `sound.soundEngine`, `hud.flashMagazineEmpty` |
| `js/weapons/laser.js` | `tryFireLaser` | `state`, laser config constants, `sound.soundEngine`, `math.distToSeg`, `effects.spawnAbsorptionBurst`, `effects.spawnSteamParticles`, `hud.addScore` |
| `js/input/handler.js` | `setupInput` | `state`, peg/wall/handle config, `grid.snapToDot`, `math.distToSeg`, `math.distToCurve`, `weapons/rocket.tryFireRocket`, `weapons/laser.tryFireLaser` |
| `js/input/tools.js` | `setTool`, `setGridSize`, `setBallColor`, `setLineColor`, `changeBallCount`, `dropBalls`, `toggleSound`, `clearAll` | `state`, `config.BALL_PROPS`, `config.BALL_COUNTS`, `config.MAX_BALLS`, `config.LINE_COLORS`, `sound.soundEngine`, `grid.setupGrid` |
| `js/ui/buttons.js` | `setupButtons` | `tools.*` (all 8 exports) |

### Dependency graph (simplified)

```
index.html
└── main.js
    ├── state.js          (shared by everyone)
    ├── config.js         (shared by everyone)
    ├── engine/grid.js
    │   └── state, config
    ├── input/handler.js
    │   ├── state, config
    │   ├── engine/grid.js
    │   ├── utils/math.js
    │   ├── weapons/rocket.js
    │   │   ├── state, config
    │   │   ├── audio/sound.js
    │   │   └── rendering/hud.js
    │   └── weapons/laser.js
    │       ├── state, config
    │       ├── audio/sound.js
    │       ├── utils/math.js
    │       ├── rendering/effects.js
    │       └── rendering/hud.js
    ├── ui/buttons.js
    │   └── input/tools.js
    │       ├── state, config
    │       ├── audio/sound.js
    │       └── engine/grid.js
    └── rendering/draw.js
        ├── state, config
        ├── utils/color.js
        ├── engine/physics.js
        │   ├── state, config
        │   ├── engine/collision.js
        │   │   ├── config
        │   │   └── utils/math.js
        │   ├── utils/math.js
        │   ├── audio/sound.js
        │   ├── rendering/effects.js
        │   └── rendering/hud.js
        ├── rendering/effects.js
        │   ├── state, config
        │   ├── utils/color.js
        │   └── engine/grid.js
        ├── rendering/turret.js
        │   └── state, config
        └── rendering/hud.js
            ├── state, config
            └── audio/sound.js
```

**Leaf modules** (no game-logic imports): `config.js`, `state.js`, `utils/color.js`, `utils/math.js`, `audio/sound.js`

---

## 3. State Management

All mutable game state lives in `js/state.js` as a single exported plain object. Every module imports it with `import { state } from '../state.js'` and reads/writes `state.*` directly.

### Full field inventory

#### Canvas / rendering context
| Field | Type | Purpose |
|---|---|---|
| `state.canvas` | `HTMLCanvasElement` | The `<canvas>` element, set in `init()` |
| `state.ctx` | `CanvasRenderingContext2D` | 2D drawing context |

#### Grid geometry
| Field | Type | Purpose |
|---|---|---|
| `state.dots` | `Array<{x,y}>` | All snap-point positions; recomputed by `setupGrid()` |
| `state.gridSpacing` | `number` | Pixel distance between adjacent dots |
| `state.gridOffsetX` | `number` | Left margin of the grid (centering offset) |
| `state.gridOffsetY` | `number` | Top margin of the grid |
| `state.gridCols` | `number` | Number of columns in current grid |
| `state.gridRows` | `number` | Number of rows in current grid |

#### Game objects
| Field | Type | Purpose |
|---|---|---|
| `state.walls` | `Array<{ax,ay,bx,by,color,flashTimer}>` | Straight wall segments |
| `state.curves` | `Array<{ax,ay,bx,by,cx,cy,color,flashTimer}>` | Quadratic Bézier curves; (cx,cy) is the control point |
| `state.pegs` | `Array<{x,y,pulseTimer,color}>` | Circular pegs; `pulseTimer` drives hit animation |
| `state.balls` | `Array<BallObject>` | All active balls (see ball object structure below) |

**Ball object fields:**
```
{ id, x, y, vx, vy, props, trail, atRest, restTimer, fadeTimer, opacity, gcTimer, gcFading, age }
```
- `props` — reference to the ball type's property record from `BALL_PROPS`
- `trail` — last 6 positions for motion blur rendering
- `atRest` — true when ball has settled; triggers fade-out via `fadeTimer`
- `restTimer` — accumulates time spent below `REST_SPEED`; rest triggers at `REST_TIME` (0.6s)
- `fadeTimer` — counts up after rest; ball removed when `opacity` reaches 0 (over `FADE_DURATION` 2s)
- `gcTimer` — counts time spent in bottom 10% of grid; GC triggers at 3s
- `gcFading` — true during GC fade (1.5s)
- `age` — total seconds alive; reduces bumper boost over time (aging factor)

#### Score
| Field | Type | Purpose |
|---|---|---|
| `state.score` | `number` | Cumulative score; displayed in LCD |

#### Tool / UI state
| Field | Type | Purpose |
|---|---|---|
| `state.currentTool` | `string` | Active tool: `'wall'`, `'curve'`, `'peg'`, `'eraser'`, `'rocket'`, `'laser'` |
| `state.currentGridSize` | `string` | `'small'`, `'medium'`, or `'large'` |
| `state.currentBallColor` | `string` | `'yellow'`, `'red'`, `'blue'`, or `'green'` |
| `state.currentLineColor` | `string` | Hex color string for walls/curves/pegs |
| `state.ballCountIdx` | `number` | Index into `BALL_COUNTS` array `[1,5,10,25,50]` |

#### Drawing / editing
| Field | Type | Purpose |
|---|---|---|
| `state.isDrawing` | `boolean` | True while user is dragging out a wall/curve |
| `state.drawStart` | `{x,y}\|null` | Snapped start dot of the current stroke |
| `state.ghostPos` | `{x,y}\|null` | Current cursor position during draw; drives ghost preview |
| `state.editingCurve` | `curve\|null` | Curve whose control handle is being dragged |

#### Physics timing
| Field | Type | Purpose |
|---|---|---|
| `state.lastTimestamp` | `number` | `performance.now()` of the last frame; used to compute `rawDt` |
| `state.physicsAccum` | `number` | Accumulated real time waiting to be consumed as fixed steps |
| `state.nextBallId` | `number` | Monotonic counter; each spawned ball gets a unique `id` |

#### Rocket system
| Field | Type | Purpose |
|---|---|---|
| `state.rockets` | `Array<RocketObject>` | All in-flight rockets |
| `state.rocketParticles` | `Array<ParticleObject>` | Explosion/absorption particles |
| `state.firstDropTime` | `number\|null` | `performance.now()` of first ball drop; triggers magazine charging |
| `state.magazineCount` | `number` | Currently charged rockets ready to fire (0–3) |
| `state.chargeStart` | `number\|null` | `performance.now()` when current charge cycle began |
| `state.isFirstCharge` | `boolean` | True until first charge completes; first cycle uses `ROCKET_LOCK_DURATION` (15s) |

#### Laser system
| Field | Type | Purpose |
|---|---|---|
| `state.currentWeapon` | `string` | `'rocket'` or `'laser'` (legacy field; `currentTool` is the live selector) |
| `state.laserHeat` | `number` | Current heat level 0–100 |
| `state.laserOverheated` | `boolean` | Locks laser when heat reaches 100 |
| `state.laserOverheatTimer` | `number` | Countdown from `LASER_OVERHEAT_COOLDOWN` (4s) |
| `state.lastLaserFireTime` | `number` | Seconds timestamp of last laser shot; enforces `LASER_FIRE_COOLDOWN` (0.1s) |
| `state.laserBeam` | `{x1,y1,x2,y2,alpha,timer}\|null` | Visual beam; fades over `LASER_BEAM_DURATION` (0.2s) |
| `state.laserSteamParticles` | `Array<ParticleObject>` | Steam particles emitted during overheat |

#### Turret
| Field | Type | Purpose |
|---|---|---|
| `state.turretAngle` | `number` | Current turret aim direction in radians; updated on each weapon fire |

---

## 4. Game Mechanics & Physics

### Fixed-timestep accumulator

In `render()` (`rendering/draw.js:176`):
```js
const rawDt = Math.min((ts - state.lastTimestamp) / 1000, 0.05); // capped at 50ms
state.physicsAccum += rawDt;
while (state.physicsAccum >= FIXED_DT) {     // FIXED_DT = 1/60
    updatePhysics(FIXED_DT);
    state.physicsAccum -= FIXED_DT;
}
```
Physics always steps at exactly 1/60s. Variable-rate displays (90Hz, 120Hz) simply run more or fewer steps per visual frame. The 50ms cap prevents spiral-of-death after tab focus loss.

### Ball properties by color

| Color | Speed mult | Mass | Restitution | Description |
|---|---|---|---|---|
| Yellow | 1.0× | 1.0 | 0.62 | Normal |
| Red | 1.8× | 1.0 | 0.52 | Fast (higher initial vy) |
| Blue | 1.0× | 3.0 | 0.40 | Heavy (loses more energy) |
| Green | 1.0× | 0.75 | 0.96 | Bouncy (nearly elastic) |

Initial velocity: `vy = 130 * props.speed + random(0..40)` px/s, `vx = random(−27.5..27.5)` px/s.

### Gravity

`GRAVITY = 680` px/s². Applied per substep: `b.vy += GRAVITY * subDt`.

### Substep collision

Fast-moving balls use 2 substeps per physics tick to prevent tunneling:
```js
const substeps = (spd0 * dt > br * 0.85) ? 2 : 1;
```
This fires when the ball would travel more than 85% of its radius in one tick.

### Wall / Curve collision (`collision.js: reflectSeg`)

1. Find closest point on segment to ball center.
2. If `dist < radius + WALL_HALF_W`, push ball out along the normal.
3. Reflect velocity: `v -= (1+restitution) * dot(v, n) * n`.
4. Apply a 0.5% drag: `v *= 0.995`.
5. Apply `bumperFactor` (wall=1.35, curve=1.25) as an energy boost.
6. For curves only: apply `CURVE_TANG_BOOST = 50` px/s along the tangent direction to add lateral spin.
7. Clamp to `MAX_BALL_SPEED = 900` px/s.
8. Set `flashTarget.flashTimer = FLASH_DURATION (0.15s)` for the visual flash.

### Peg collision (`physics.js:79`)

1. Circle-circle: `dist < ballRadius + PEG_RADIUS (14)`.
2. Push ball out along normal.
3. Reflect velocity with restitution.
4. Apply `agedPegBoost` (starts at 1.30, decays with ball age).
5. Add a random ±8° angle jitter to prevent infinite loops.
6. Clamp to `MAX_BALL_SPEED`.
7. Set `peg.pulseTimer = 0.35` for visual pulse.

### Ball-ball collision (`physics.js:147`)

1. Circle-circle overlap detection.
2. Separate by pushing each ball by half the overlap.
3. Compute elastic impulse scaled by mass ratio.
4. Partial inelasticity: impulse multiplied by 0.3 (slow collisions) or 0.55 (fast).
5. `MIN_COLL_SPEED = 80` px/s enforced post-collision to prevent freeze.
6. Y-component of impulse is further dampened by 0.75 to reduce excessive bouncing.
7. Wakes a resting ball if hit: resets `atRest`, `restTimer`, `fadeTimer`, `opacity`.

### Canvas boundary bounces

- **Bottom** (`y + r > H`): reflect `vy`, apply `vx *= 0.85` floor friction.
- **Top** (`y - r < 0`): reflect `vy`.
- **Left/Right**: reflect `vx`.
- **Emergency GC**: if `y > H + 120`, ball is immediately removed.

### Rest detection

```
speed < REST_SPEED (40 px/s) → restTimer += dt
restTimer > REST_TIME (0.6s) → atRest = true
```
Once at rest, the ball fades out over `FADE_DURATION = 2.0s`.

### Aging & bumper decay

Bumper boosts decay as balls age:
```js
const ageFactor = 1 + (b.age / 60) * 0.5;
agedWallBoost  = 1 + (BUMPER_FACTOR_WALL  - 1) / ageFactor;
```
At `age=0` the boost is full (`1.35`). At `age=120s` it halves toward 1.0. This prevents very old balls from bouncing indefinitely.

### GC zone

Balls in the bottom 10% of the grid (`y > gcZoneY`) for 3+ seconds start fading at 1.5s/opacity. GC-fading balls are skipped in rocket collision detection.

---

## 5. Weapon Systems

### Rocket system

**Magazine:**
- Capacity: `MAGAZINE_CAPACITY = 3` slots.
- Charging begins when the first `DROP` is pressed (`state.firstDropTime` is set).
- First charge cycle: `ROCKET_LOCK_DURATION = 15000ms` (15s).
- Subsequent cycles: `MAGAZINE_CHARGE_TIME = 10000ms` (10s) per rocket.
- Charging restarts after each successful fire, if the magazine is not full.
- Visual: `mag-slot` fills from bottom via CSS `charge-fill` height; `.charged` class adds glow.

**Firing (`weapons/rocket.js: tryFireRocket`):**
1. Check `magazineCount > 0`; if empty, play empty sound + flash all slots.
2. Compute direction from turret origin `(canvas.width/2, 18)` to tap point.
3. Update `state.turretAngle` for the turret sprite.
4. Decrement `magazineCount`; restart `chargeStart` if magazine was full.
5. Push rocket object: `{ x, y, vx, vy, trail:[], opacity:1, fading:false, fadeTimer:0, age:0 }`.
6. Play rocket fire sound.

**In-flight (`physics.js:197`):**
- Speed: `ROCKET_SPEED = 700` px/s. Direction is constant (no guidance).
- Bounces off all 4 canvas edges (absolute velocity flip).
- Lifespan: `ROCKET_LIFESPAN = 10s`. Last 3 seconds: opacity fades to 0.4 as warning.
- After 10s, enters `fading` state and is removed over `ROCKET_FADE_TIME = 0.5s`.
- Trail: last 8 positions stored; drawn as shrinking orange/yellow circles.
- Ball destruction: if `dist(rocket, ball) < ROCKET_RADIUS + ball.radius`, ball is removed, burst spawned, `+10` score added.

### Laser system

**Heat mechanics:**
- Each shot adds `LASER_HEAT_PER_SHOT = 15` to `state.laserHeat`.
- Heat range: 0–`LASER_HEAT_MAX = 100`.
- At 100: `laserOverheated = true`, `laserOverheatTimer = LASER_OVERHEAT_COOLDOWN = 4s`.
- During overheat: laser is locked, steam particles emit, turret glows red.
- After 4s: heat resets to 0, `laserOverheated = false`, play laser-ready chime.
- Passive decay when not overheated: `LASER_HEAT_DECAY = 8` units/second.
- Fire cooldown: `LASER_FIRE_COOLDOWN = 0.1s` minimum between shots.

**Firing (`weapons/laser.js: tryFireLaser`):**
1. Guard: skip if `laserOverheated` or within cooldown.
2. Update `state.lastLaserFireTime` and `state.turretAngle`.
3. Compute beam endpoint: ray from turret `(canvas.width/2, 20)` to canvas edge (smallest `t` solving edge intersection).
4. Accumulate heat; trigger overheat if ≥ 100.
5. If heat was already ≥ 75% before this shot, play overheat warning sound.
6. **Hitscan:** iterate all balls; remove any whose center is within `ball.radius + 4` of the beam segment (uses `distToSeg`). Each destroyed ball adds `+10` score.
7. Store `state.laserBeam = { x1, y1, x2, y2, alpha:1.0, timer:LASER_BEAM_DURATION (0.2s) }`.

**Heat UI levels:**
| Heat % | Bar color | Label |
|---|---|---|
| 0–40% | `#00CC44` green | Heat |
| 40–65% | `#FFCC00` yellow | WARM |
| 65–85% | `#FF6600` orange | HOT |
| 85–100% | `#FF2200` red | CRITICAL |
| Overheated | Flashing red | OVERHEAT |

---

## 6. Rendering Pipeline

The game loop (`rendering/draw.js: render`) is called every animation frame via `requestAnimationFrame`.

### Frame sequence

```
render(ts)
  1. Compute rawDt, run physics accumulator loop → updatePhysics(FIXED_DT) × N
  2. ctx.fillRect('#1a1a2e')           — clear canvas (dark navy background)
  3. drawGrid()                         — grid dots (semi-transparent blue)
  4. drawWalls()                        — straight wall segments with glow/flash
  5. drawCurves()                       — quadratic Bézier curves + control handles (if curve/eraser tool active)
  6. drawPegs()                         — circular pegs with radial gradient + pulse animation
  7. drawBalls()                        — balls with motion trail, radial gradient, specular highlight
  8. drawRocketParticles()              — explosion/absorption burst particles
  9. drawRocket()                       — in-flight rocket sprites (with trail, fins, flame flicker)
 10. drawLaserBeam()                    — 3-pass beam (wide glow + medium + thin white core)
 11. drawSteamParticles()               — overheat steam puffs
 12. drawTurret()                       — top-center turret sprite (rocket or laser, active/inactive states)
 13. drawGhost()                        — dashed preview line during wall/curve drawing
 14. updateMagazine()                   — DOM updates: slot CSS classes, charge fill height, button label
 15. updateHeatUI()                     — DOM updates: heat bar width/color, label text
 16. Version watermark                  — VERSION string bottom-right corner
```

### Drawing detail notes

**Walls** (`drawWalls`): `lineWidth = WALL_HALF_W * 2 = 10`. Flash lerps from normal color to `#FFFACC` yellow-white with bloom shadow.

**Curves** (`drawCurves`): Rendered as `ctx.quadraticCurveTo`. Control handle shown as a circle with dashed arm lines when the `curve` or `eraser` tool is active.

**Pegs** (`drawPegs`): Radial gradient from `lighten(color, 40)` to `darken(color, 40)`. Pulse from `peg.pulseTimer` adds up to +7px radius using `sin(pulseTimer/0.35 * π)`. Shadow blur triples during pulse.

**Balls** (`drawBalls`): Each ball renders its `trail` (last 6 positions) as progressively smaller, more transparent circles for a motion blur effect. The ball itself uses a 3-stop radial gradient. A fixed specular highlight (white circle at offset −0.3, −0.32 from center) simulates lighting. `ageVisual` field (computed from `b.age`: 0 at spawn, max 1 at 90s) dims both the glow and specular as the ball ages.

**Turret** (`drawTurret`): Positioned at `(canvas.width/2, 20)` (top center). Rotated to `turretAngle - π/2`. Two shapes: `drawRocketTurretShape` (base plate + barrel + bolts) and `drawLaserTurretShape` (fins + barrel with energy rings + animated glow). Overheated state shifts all colors to red/orange.

**Laser beam** (`drawLaserBeam`): Three strokes on the same line for a layered glow effect:
1. 9px wide `rgba(0,220,255,0.55)` with 18px shadow blur
2. 4px wide `rgba(100,240,255,0.8)` with 8px shadow blur
3. 2px wide `#FFFFFF` core

**Ghost preview** (`drawGhost`, `effects.js`): Shown when `state.isDrawing`. Dashed line from `drawStart` to the snap-corrected cursor position. Highlighted dots at start and (if snapping) end.

**Particles** (`updateParticles`, `effects.js`): Rocket particles have 25% gravity (GRAVITY × 0.25). Steam particles have upward drift (vy decrements by 40/s), lateral drag (`vx *= 0.97`), and grow in size over time.

---

## 7. Input Handling

### Event wiring (`input/handler.js: setupInput`)

All listeners are added to `state.canvas`. Both touch and mouse events are handled; `e.preventDefault()` is called on all to suppress default browser scroll/zoom behavior on mobile.

| Event | Handler |
|---|---|
| `mousedown` | `onStart(x, y)` |
| `mousemove` | `onMove(x, y)` |
| `mouseup` | `onEnd(x, y)` |
| `mouseleave` | `onEnd(x, y)` if drawing |
| `touchstart` | `onStart(x, y)` |
| `touchmove` | `onMove(x, y)` |
| `touchend` | `onEnd(x, y)` |
| `touchcancel` | Reset all draw state |

### Coordinate scaling (`getPos`)

Canvas logical size (set by `resizeCanvas`) may differ from CSS display size. `getPos` corrects for this:
```js
const scaleX = state.canvas.width  / rect.width;
const scaleY = state.canvas.height / rect.height;
return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
```
Handles both `changedTouches`, `touches`, and mouse events.

### Tool routing (`onStart`)

```
currentTool === 'rocket'  → tryFireRocket(x, y)
currentTool === 'laser'   → tryFireLaser(x, y)
currentTool === 'peg'     → snap to dot, push peg if not duplicate
currentTool === 'eraser'  → eraseAt(x, y)
currentTool === 'curve'   → check handle proximity → editingCurve; else start drawing
currentTool === 'wall'    → snap to dot → isDrawing = true
```

### Snap-to-grid (`engine/grid.js: snapToDot`)

`SNAP_RADIUS = 42` px (or half gridSpacing, whichever is smaller). Returns the closest dot within snap radius, or `null` if none qualifies.

Walls and curves snap both start and end points. Pegs snap the placement point. Snap is applied in both `onStart` and `onEnd`.

### Eraser (`eraseAt`)

Erase radius is `24` px (ED constant). Priority order: pegs first, then curves (or their control handle), then walls. Removes the first matching element and returns — one element per tap.

### Curve control handle editing

If the user touches within `HANDLE_RADIUS + 12 = 23` px of a curve's control point, `state.editingCurve` is set to that curve. `onMove` then updates `(cx, cy)` directly, giving live interactive reshaping.

---

## 8. Audio Engine

All audio is synthesized in real time using the **Web Audio API** (`AudioContext`). No audio files are loaded. The single `SoundEngine` class instance (`soundEngine`) is exported from `audio/sound.js`.

### Context initialization

The `AudioContext` is created lazily on the **first user interaction** (mousedown or touchstart) to comply with browser autoplay policies. If the context is suspended, it is resumed on each interaction.

### Concurrent voice limiting

`MAX_CONCURRENT = 9` active oscillator/buffer-source nodes. Each node increments `activeCount` on start and decrements via `onended`. Any sound that would exceed the limit is silently dropped.

### Per-type cooldowns (milliseconds)

| Sound type | Cooldown | Purpose |
|---|---|---|
| `wall` | 30ms | Prevents wall-hit spam |
| `peg` | 20ms | Peg ping |
| `curve` | 30ms | Curve bounce |
| `ball` | 50ms | Ball-ball collision |
| `rest` | 100ms | Ball settling thud |

Cooldowns are tracked in `lastPlay[type]` using `audioCtx.currentTime * 1000` (not `Date.now()`).

### Sound catalog

| Method | Synthesis technique | Description |
|---|---|---|
| `playWallHit()` | Sine osc, 150→80 Hz, 70ms | Thud when ball hits wall |
| `playPegHit()` | Sine osc, 400–800 Hz random, 50ms + optional harmonic | Bright ping, randomized pitch |
| `playCurveHit()` | Sine osc, 200→120 Hz, 50ms | Softer thud for curve bounce |
| `playBallHit()` | White noise → bandpass (2kHz, Q=1.5), 20ms | Soft click for ball-ball collision |
| `playDrop()` | Sawtooth, 800→200 Hz, 350ms | Drop button activation swoosh |
| `playRest()` | Sine, 60 Hz, 40ms | Very low thud when ball settles |
| `playRocketFire()` | Sawtooth, 200→600 Hz, 150ms | Rocket launch whoosh |
| `playRocketAbsorb(color)` | Sine, color-mapped freq → 40%, 80ms | Ball absorption pop (color-pitched: yellow=900, red=1200, blue=600, green=750 Hz) |
| `playRocketReady()` | Sine, 660→880 Hz, 280ms | Magazine slot ready chime |
| `playMagazineLoad()` | Square osc ×2, 300→180 + 480→260 Hz, 2-note sequence | Magazine loading click-clack |
| `playMagazineEmpty()` | Sine, 90→55 Hz, 70ms | Low dull thud when magazine empty |
| `playLaserFire()` | Sawtooth through waveshaper distortion, 2000→500 Hz, 90ms | Sci-fi laser zap |
| `playOverheatWarning()` | White noise → bandpass (1.4kHz, Q=2), 70ms | Hiss warning before overheat |
| `playOverheatTriggered()` | Sawtooth, 800→100 Hz, 350ms | Power-down sound on overheat |
| `playLaserReady()` | 3× sine tones (440, 660, 880 Hz) staggered 80ms | Rising 3-note ready chime |
| `playScoreUp()` | 2× sine (400+600 Hz) staggered 30ms, 80ms | Score increment ding |

### Mute toggle

`soundEngine.toggleMute()` flips `this.muted`. When muted, `_canPlay()` returns `false` for cooldown-gated sounds. `playDrop()`, `playRocketFire()`, `playMagazineLoad()`, etc. have their own mute guards since they bypass `_canPlay`.

---

## 9. UI / HTML Structure

The entire UI is defined in `index.html`. All CSS lives in a `<style>` block in the `<head>`. There is no external stylesheet. All button wiring uses `addEventListener` in `ui/buttons.js`.

### Layout structure

```
#app  (flex column, full viewport)
├── #hopper-bar  (top bar, flex row, min-height 74px, background #16213e)
│   ├── .color-label "Color:"
│   ├── .color-section
│   │   ├── #btn-yellow  (circular color button, 54×54px)
│   │   ├── #btn-red
│   │   ├── #btn-blue
│   │   └── #btn-green
│   ├── .divider-v
│   ├── .count-section
│   │   ├── .count-label "Balls:"
│   │   ├── #btn-count-minus  (−)
│   │   ├── #count-display  (current ball count)
│   │   └── #btn-count-plus  (+)
│   ├── #score-wrap
│   │   ├── #score-lcd  (green LCD display, font Courier New, 5-digit 0-padded)
│   │   └── .score-label "Score"
│   ├── .divider-v
│   ├── #magazine-wrap
│   │   ├── #magazine-slots
│   │   │   ├── #mag-0  (.mag-slot)
│   │   │   │   ├── #mag-fill-0  (.charge-fill, height driven by JS)
│   │   │   │   └── .slot-icon "🚀"
│   │   │   ├── #mag-1  (same structure)
│   │   │   └── #mag-2  (same structure)
│   │   └── .score-label "Rockets"
│   ├── .divider-v
│   ├── #weapon-wrap
│   │   ├── .weapon-btns
│   │   │   ├── #weapon-rocket  "🚀 Rocket"
│   │   │   └── #weapon-laser   "⚡ Laser"
│   │   └── #heat-wrap  (display:none when rocket active)
│   │       ├── #heat-bar-outer
│   │       │   └── #heat-bar-inner  (width% driven by JS)
│   │       └── #heat-label-text  "Heat" / "WARM" / "HOT" / "CRITICAL" / "OVERHEAT"
│   ├── #mute-btn  "🔊" / "🔇"
│   └── #drop-btn  "DROP!"
│
└── #main-area  (flex row, flex:1)
    ├── #canvas-container  (flex:1)
    │   └── #gameCanvas  (touch-action:none)
    └── #tool-palette  (width 164px, right panel)
        ├── .palette-label "Tools"
        ├── #btn-wall    "▐ Wall"
        ├── #btn-curve   "~ Curve"
        ├── #btn-peg     "● Peg"
        ├── #btn-eraser  "X Erase"
        ├── .palette-divider
        ├── #btn-rocket  (contains #rocket-label: "🚀 N/3" or "⚡ Laser" or "⚡ COOLING")
        ├── .palette-divider
        ├── #clear-btn   "Clear All"
        ├── .palette-divider
        ├── .palette-label "Line Color"
        ├── .line-color-grid
        │   ├── #lc-white, #lc-red, #lc-blue, #lc-green, #lc-orange, #lc-purple
        ├── .palette-divider
        ├── .palette-label "Grid Size"
        └── .size-btns
            ├── #size-S, #size-M, #size-L
```

### Dynamic DOM updates (JavaScript-driven)

| Element | Updated by | What changes |
|---|---|---|
| `#score-lcd` | `hud.addScore()` | `textContent` (padded score), `plink` CSS class animation |
| `#count-display` | `tools.changeBallCount()`, `main.init()` | `textContent` |
| `.mag-slot` #0–2 | `hud.updateMagazine()` | `.charged`, `.charging` CSS classes |
| `.charge-fill` #0–2 | `hud.updateMagazine()` | `style.height` (0–100%) |
| `#heat-bar-inner` | `hud.updateHeatUI()` | `style.width`, `style.background` |
| `#heat-label-text` | `hud.updateHeatUI()` | `textContent` |
| `#heat-wrap` | `tools.setTool()` | `style.display` (flex/none) |
| `#rocket-label` | `hud.updateMagazine()` | `textContent` (count or laser state) |
| `#mute-btn` | `tools.toggleSound()` | `textContent`, `.muted` class |
| `.tool-btn.active` | `tools.setTool()` | `.active` CSS class |
| `.color-btn.active` | `tools.setBallColor()` | `.active` CSS class |
| `.line-color-btn.active` | `tools.setLineColor()` | `.active` CSS class |
| `.size-btn.active` | `tools.setGridSize()` | `.active` CSS class |
| `.weapon-btn.active` | `tools.setTool()` | `.active`, `.laser-weapon-active` classes |

---

## 10. Config Constants Reference

All constants are in `js/config.js` and are never mutated at runtime.

### Grid
| Constant | Value | Purpose |
|---|---|---|
| `GRID_SIZES` | `{small:{8,6}, medium:{12,9}, large:{16,12}}` | Target col/row counts (actual count computed from canvas size) |
| `SNAP_RADIUS` | `42` px | Max distance for snap-to-dot; capped at half gridSpacing |
| `DOT_RADIUS` | `5` px | Visual size of grid dots |
| `HANDLE_RADIUS` | `11` px | Click/touch radius of curve control handles |

### Physics
| Constant | Value | Purpose |
|---|---|---|
| `GRAVITY` | `680` px/s² | Downward acceleration applied each substep |
| `FIXED_DT` | `1/60` s | Physics timestep (≈16.67ms) |
| `MAX_BALLS` | `200` | Hard cap on ball array length |
| `WALL_HALF_W` | `5` px | Half-width of walls/curves; collision distance adds this to ball radius |
| `PEG_RADIUS` | `14` px | Collision radius of pegs (visual draw radius also, +pulse offset) |
| `REST_SPEED` | `40` px/s | Speed threshold to start rest timer |
| `REST_TIME` | `0.6` s | Time below `REST_SPEED` before ball is marked `atRest` |
| `MAX_BALL_SPEED` | `900` px/s | Hard clamp on ball speed after any collision |

### Ball types (`BALL_PROPS`)
| Color | `speed` | `mass` | `restitution` | `radius` |
|---|---|---|---|---|
| yellow | 1.0 | 1.0 | 0.62 | 8px |
| red | 1.8 | 1.0 | 0.52 | 8px |
| blue | 1.0 | 3.0 | 0.40 | 8px |
| green | 1.0 | 0.75 | 0.96 | 8px |

### Visual / animation
| Constant | Value | Purpose |
|---|---|---|
| `FLASH_DURATION` | `0.15` s | How long a wall/curve flash lasts after a hit |
| `FADE_DURATION` | `2.0` s | Time for a resting ball to fade out |

### Bumper factors
| Constant | Value | Applied to |
|---|---|---|
| `BUMPER_FACTOR_WALL` | `1.35` | Speed multiplier on wall bounce |
| `BUMPER_FACTOR_CURVE` | `1.25` | Speed multiplier on curve bounce |
| `BUMPER_FACTOR_PEG` | `1.30` | Speed multiplier on peg bounce |
| `CURVE_TANG_BOOST` | `50` px/s | Added tangential velocity on curve hit |

### Rockets
| Constant | Value | Purpose |
|---|---|---|
| `ROCKET_SPEED` | `700` px/s | Launch speed |
| `ROCKET_LOCK_DURATION` | `15000` ms | First charge cycle delay (locks after first drop) |
| `ROCKET_RADIUS` | `14` px | Collision radius for ball destruction |
| `ROCKET_FADE_TIME` | `0.5` s | Fade-out duration after lifespan expires |
| `ROCKET_LIFESPAN` | `10` s | Time before rocket starts fading |
| `MAGAZINE_CAPACITY` | `3` | Number of rocket slots |
| `MAGAZINE_CHARGE_TIME` | `10000` ms | Time to recharge one slot (after first drop) |

### Laser
| Constant | Value | Purpose |
|---|---|---|
| `LASER_HEAT_PER_SHOT` | `15` units | Heat added per shot |
| `LASER_HEAT_MAX` | `100` units | Overheat threshold |
| `LASER_HEAT_DECAY` | `8` units/s | Passive cooldown rate |
| `LASER_OVERHEAT_COOLDOWN` | `4` s | Lockout duration after overheat |
| `LASER_FIRE_COOLDOWN` | `0.1` s | Minimum interval between shots |
| `LASER_BEAM_DURATION` | `0.2` s | Visual beam display time |

### Line colors
```js
LINE_COLORS = { white: '#FFFFFF', red: '#FF4444', blue: '#4488FF',
                green: '#44CC44', orange: '#FF8800', purple: '#CC44FF' }
```

### Ball count options
```js
BALL_COUNTS = [1, 5, 10, 25, 50]
```

### Version
```js
VERSION = 'v3.4'
```
Displayed as a watermark in the bottom-right corner of the canvas.

---

*End of analysis. This document was generated from a full read of all 18 JS source files and `index.html` as of commit `2e29332` (v3.4).*
