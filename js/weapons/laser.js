// laser.js — laser firing, beam collision, overheat mechanic
'use strict';

import { state } from '../state.js';
import {
  LASER_HEAT_PER_SHOT, LASER_HEAT_MAX, LASER_OVERHEAT_COOLDOWN,
  LASER_FIRE_COOLDOWN, LASER_BEAM_DURATION
} from '../config.js';
import { soundEngine } from '../audio/sound.js';
import { distToSeg } from '../utils/math.js';
import { spawnAbsorptionBurst, spawnSteamParticles } from '../rendering/effects.js';
import { addScore } from '../rendering/hud.js';

export function tryFireLaser(tx, ty) {
  if (state.laserOverheated) return;

  const now = performance.now() / 1000;
  if (now - state.lastLaserFireTime < LASER_FIRE_COOLDOWN) return;
  state.lastLaserFireTime = now;

  const sx = state.canvas.width / 2;
  const sy = 20;
  const dx = tx - sx, dy = ty - sy;
  state.turretAngle = Math.atan2(dy, dx);

  const W = state.canvas.width, H = state.canvas.height;
  let tMin = Infinity;
  if (dx !== 0) {
    const tLeft  = (0 - sx) / dx; if (tLeft  > 0) tMin = Math.min(tMin, tLeft);
    const tRight = (W - sx) / dx; if (tRight > 0) tMin = Math.min(tMin, tRight);
  }
  if (dy !== 0) {
    const tTop    = (0 - sy) / dy; if (tTop    > 0) tMin = Math.min(tMin, tTop);
    const tBottom = (H - sy) / dy; if (tBottom > 0) tMin = Math.min(tMin, tBottom);
  }
  const ex = sx + tMin * dx;
  const ey = sy + tMin * dy;

  const prevHeat = state.laserHeat;
  state.laserHeat += LASER_HEAT_PER_SHOT;
  const wasWarning = prevHeat >= LASER_HEAT_MAX * 0.75;

  if (state.laserHeat >= LASER_HEAT_MAX) {
    state.laserHeat = LASER_HEAT_MAX;
    state.laserOverheated = true;
    state.laserOverheatTimer = LASER_OVERHEAT_COOLDOWN;
    soundEngine.playOverheatTriggered();
    spawnSteamParticles(sx, sy);
  } else {
    soundEngine.playLaserFire();
    if (wasWarning) soundEngine.playOverheatWarning();
  }

  const absorbedIdx = [];
  for (let i = state.balls.length - 1; i >= 0; i--) {
    const b = state.balls[i];
    if (b.gcFading) continue;
    if (distToSeg(b.x, b.y, sx, sy, ex, ey) < b.props.radius + 4) {
      absorbedIdx.push(i);
    }
  }
  for (const i of absorbedIdx) {
    const b = state.balls[i];
    spawnAbsorptionBurst(b.x, b.y, b.props.color);
    soundEngine.playRocketAbsorb(b.props.color);
    state.balls.splice(i, 1);
    addScore(10);
  }

  state.laserBeam = { x1: sx, y1: sy, x2: ex, y2: ey, alpha: 1.0, timer: LASER_BEAM_DURATION };
}
