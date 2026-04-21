// rocket.js — rocket firing and magazine management
'use strict';

import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { soundEngine } from '../audio/sound.js';
import { flashMagazineEmpty } from '../rendering/hud.js';

export function tryFireRocket(tx, ty) {
  if (state.magazineCount <= 0) {
    soundEngine.playMagazineEmpty();
    flashMagazineEmpty();
    return;
  }

  const sx = state.canvas.width / 2;
  const sy = 18;
  const dx = tx - sx, dy = ty - sy;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  state.turretAngle = Math.atan2(dy, dx);

  state.magazineCount--;

  if (state.chargeStart === null && state.firstDropTime !== null) {
    state.chargeStart = performance.now();
  }

  state.rockets.push({
    x: sx, y: sy,
    vx: (dx / len) * CONFIG.ROCKET_SPEED,
    vy: (dy / len) * CONFIG.ROCKET_SPEED,
    trail: [],
    opacity: 1.0,
    fading: false,
    fadeTimer: 0,
    age: 0,
  });
  soundEngine.playRocketFire();
}
