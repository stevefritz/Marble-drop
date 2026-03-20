# Marble Drop Builder

A browser-based marble/ball physics sandbox game. GitHub Pages static site — no build step, no bundler, no npm.

## Architecture

ES modules loaded via `<script type="module" src="js/main.js">`. All state lives in a single shared object (`state.js`). No global variables on `window`.

### File Structure

```
index.html                — HTML markup + CSS only (no JS)
js/
  main.js                 — init(), resizeCanvas(), bootstrap (entry point)
  config.js               — ALL constants (GRAVITY, BALL_PROPS, GRID_SIZES, etc.)
  state.js                — ALL shared mutable state as a single exported object
  utils/
    color.js              — parseHex(), lighten(), darken()
    math.js               — closestPtOnSeg(), distToSeg(), bezierPt(), sampleCurve(), distToCurve()
  audio/
    sound.js              — SoundEngine class + singleton export (all synthesized sounds)
  engine/
    physics.js            — updatePhysics() — ball, rocket, laser physics + particle updates
    collision.js          — reflectSeg() — segment reflection for ball-wall/curve collisions
    grid.js               — setupGrid(), snapToDot()
  rendering/
    draw.js               — render() game loop + drawGrid/Walls/Curves/Pegs/Balls
    effects.js            — drawGhost(), particle drawing, spawnAbsorptionBurst(), spawnSteamParticles()
    turret.js             — drawTurret(), drawRocket(), drawLaserBeam() + turret shapes
    hud.js                — updateMagazine(), updateHeatUI(), addScore(), flashMagazineEmpty()
  weapons/
    rocket.js             — tryFireRocket()
    laser.js              — tryFireLaser()
  input/
    handler.js            — onStart/Move/End(), setupInput(), getPos(), eraseAt()
    tools.js              — setTool(), setBallColor(), setLineColor(), setGridSize(),
                            changeBallCount(), dropBalls(), spawnBalls(), clearAll(), toggleSound()
  ui/
    buttons.js            — addEventListener wiring for all HTML buttons (no inline onclick)
```

### Key Patterns

- **State hub**: `import { state } from '../state.js'` — every module reads/writes `state.*`
- **Config**: `import { GRAVITY, ... } from '../config.js'` — constants never mutated
- **Sound**: `import { soundEngine } from '../audio/sound.js'` — singleton instance
- **No circular deps**: dependency graph flows cleanly downward
- **No build step**: native ES modules with relative imports, works in all modern browsers including iPad Safari

### Version

Version string is in `config.js` as `VERSION`. Displayed as watermark on canvas bottom-right.

## Development Notes

- CSS stays in index.html `<style>` block (not split out)
- All button handlers use `addEventListener` in `ui/buttons.js` (no inline `onclick`)
- Count buttons have IDs `btn-count-minus` and `btn-count-plus`
- Physics runs at fixed 60fps timestep with accumulator pattern
- Ball GC: balls in bottom 10% of grid for 3+ seconds fade out
- Rockets bounce off all edges, 10s lifespan, 3-round magazine with charge timer
- Laser: hitscan through all balls to canvas edge, overheat mechanic
