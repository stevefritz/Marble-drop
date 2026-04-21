// physics.js — updatePhysics(), ball movement, gravity, rest detection, aging, GC
'use strict';

import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { reflectSeg } from './collision.js';
import { sampleCurve } from '../utils/math.js';
import { soundEngine } from '../audio/sound.js';
import { spawnAbsorptionBurst, spawnSteamParticles, updateParticles } from '../rendering/effects.js';
import { addScore } from '../rendering/hud.js';

export function updatePhysics(dt) {
  const W = state.canvas.width, H = state.canvas.height;

  const gcZoneY = state.gridOffsetY + state.gridSpacing * (state.gridRows - 1) * 0.9;

  for (let i = state.balls.length - 1; i >= 0; i--) {
    const b = state.balls[i];

    if (b.atRest) {
      b.fadeTimer += dt;
      b.opacity = Math.max(0, 1.0 - b.fadeTimer / CONFIG.FADE_DURATION);
      if (b.opacity <= 0) { state.balls.splice(i, 1); }
      continue;
    }

    if (b.y > gcZoneY) {
      b.gcTimer += dt;
    } else if (!b.gcFading) {
      b.gcTimer = 0;
    }
    if (b.gcTimer >= 3.0 && !b.gcFading) {
      b.gcFading = true;
    }

    if (b.gcFading) {
      b.opacity -= dt / 1.5;
      if (b.opacity <= 0) { state.balls.splice(i, 1); }
      continue;
    }

    b.age += dt;
    const ageFactor    = 1 + (b.age / 60) * 0.5;
    const agedWallBoost  = 1 + (CONFIG.BUMPER_FACTOR_WALL  - 1) / ageFactor;
    const agedCurveBoost = 1 + (CONFIG.BUMPER_FACTOR_CURVE - 1) / ageFactor;
    const agedPegBoost   = 1 + (CONFIG.BUMPER_FACTOR_PEG   - 1) / ageFactor;

    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 6) b.trail.shift();

    const br = b.props.radius;

    const spd0 = Math.hypot(b.vx, b.vy);
    const substeps = (spd0 * dt > br * 0.85) ? 2 : 1;
    const subDt = dt / substeps;

    for (let sub = 0; sub < substeps; sub++) {
      b.vy += CONFIG.GRAVITY * subDt;
      b.x += b.vx * subDt;
      b.y += b.vy * subDt;

      for (const w of state.walls) { if (reflectSeg(b, w.ax, w.ay, w.bx, w.by, agedWallBoost, w)) { if (Math.hypot(b.vx, b.vy) > 60) soundEngine.playWallHit(); } }

      let curveHitThisFrame = false;
      for (const c of state.curves) {
        for (const s of sampleCurve(c, 20)) {
          if (reflectSeg(b, s.ax, s.ay, s.bx, s.by, agedCurveBoost, c, CONFIG.CURVE_TANG_BOOST) && !curveHitThisFrame) {
            if (Math.hypot(b.vx, b.vy) > 60) soundEngine.playCurveHit();
            curveHitThisFrame = true;
          }
        }
      }

      for (const peg of state.pegs) {
        const pdx = b.x - peg.x, pdy = b.y - peg.y;
        const pdist = Math.sqrt(pdx*pdx + pdy*pdy);
        const pminD = b.props.radius + CONFIG.PEG_RADIUS;
        if (pdist < pminD && pdist > 0.001) {
          const pnx = pdx/pdist, pny = pdy/pdist;
          b.x += pnx * (pminD - pdist);
          b.y += pny * (pminD - pdist);
          const pdot = b.vx*pnx + b.vy*pny;
          if (pdot < 0) {
            const preHitSpeed = Math.hypot(b.vx, b.vy);
            const r = b.props.restitution;
            b.vx -= (1+r) * pdot * pnx;
            b.vy -= (1+r) * pdot * pny;
            b.vx *= agedPegBoost;
            b.vy *= agedPegBoost;
            const ps = Math.hypot(b.vx, b.vy);
            if (ps > CONFIG.MAX_BALL_SPEED) { b.vx *= CONFIG.MAX_BALL_SPEED/ps; b.vy *= CONFIG.MAX_BALL_SPEED/ps; }
            const ang = (Math.random()-0.5) * (16 * Math.PI/180);
            const cos = Math.cos(ang), sin = Math.sin(ang);
            const nvx = b.vx*cos - b.vy*sin;
            const nvy = b.vx*sin + b.vy*cos;
            b.vx = nvx; b.vy = nvy;
            peg.pulseTimer = 0.35;
            if (preHitSpeed > 40) soundEngine.playPegHit();
          }
        }
      }

      if (b.y + br > H) {
        b.y = H - br;
        if (b.vy > 0) b.vy = -b.vy * b.props.restitution;
        b.vx *= 0.85;
      }

      if (b.y - br < 0) {
        b.y = br;
        if (b.vy < 0) b.vy = -b.vy * b.props.restitution;
      }

      if (b.x - br < 0) {
        b.x = br;
        if (b.vx < 0) b.vx = -b.vx * b.props.restitution;
      } else if (b.x + br > W) {
        b.x = W - br;
        if (b.vx > 0) b.vx = -b.vx * b.props.restitution;
      }
    }

    if (b.y > H + 120) { state.balls.splice(i, 1); continue; }

    const speed = Math.hypot(b.vx, b.vy);
    if (speed < CONFIG.REST_SPEED) {
      b.restTimer += dt;
      if (b.restTimer > CONFIG.REST_TIME) {
        if (!b.atRest && !b.fading) soundEngine.playRest();
        b.atRest = true;
        b.vx = 0; b.vy = 0;
        b.trail = [];
      }
      b.vx *= 0.90;
      b.vy *= 0.90;
    } else {
      b.restTimer = 0;
    }
  }

  // Ball-ball collisions
  for (let i = 0; i < state.balls.length; i++) {
    for (let j = i+1; j < state.balls.length; j++) {
      const a = state.balls[i], b = state.balls[j];
      if (a.atRest && b.atRest) continue;
      if (a.gcFading || b.gcFading) continue;

      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const minD = a.props.radius + b.props.radius;
      if (dist >= minD || dist < 0.001) continue;

      const nx = dx/dist, ny = dy/dist;
      const overlap = (minD - dist) * 0.5;
      a.x -= nx*overlap; a.y -= ny*overlap;
      b.x += nx*overlap; b.y += ny*overlap;

      const ma = a.props.mass, mb = b.props.mass;
      const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
      const relV = dvx*nx + dvy*ny;
      if (relV > 0) {
        const jitterAngle = (Math.random() - 0.5) * (8 * Math.PI / 180);
        const cosJ = Math.cos(jitterAngle), sinJ = Math.sin(jitterAngle);
        const jnx = nx * cosJ - ny * sinJ;
        const jny = nx * sinJ + ny * cosJ;

        const elasticImpulse = (2 * relV) / (ma + mb);
        const impulse = elasticImpulse * (relV < 30 ? 0.3 : 0.55);

        a.vx -= impulse * mb * jnx; a.vy -= impulse * mb * jny * 0.75;
        b.vx += impulse * ma * jnx; b.vy += impulse * ma * jny * 0.75;

        const MIN_COLL_SPEED = 80;
        const speedA = Math.hypot(a.vx, a.vy);
        const speedB = Math.hypot(b.vx, b.vy);
        if (speedA > 0.01 && speedA < MIN_COLL_SPEED) { const s = MIN_COLL_SPEED / speedA; a.vx *= s; a.vy *= s; }
        if (speedB > 0.01 && speedB < MIN_COLL_SPEED) { const s = MIN_COLL_SPEED / speedB; b.vx *= s; b.vy *= s; }

        if (relV > 50) soundEngine.playBallHit();
        if (a.atRest) { a.atRest = false; a.restTimer = 0; a.fadeTimer = 0; a.opacity = 1.0; }
        if (b.atRest) { b.atRest = false; b.restTimer = 0; b.fadeTimer = 0; b.opacity = 1.0; }
      }
    }
  }

  // Peg/wall/curve flash decay
  for (const p of state.pegs) { if (p.pulseTimer > 0) p.pulseTimer -= dt; }
  for (const w of state.walls)  { if (w.flashTimer > 0) w.flashTimer -= dt; }
  for (const c of state.curves) { if (c.flashTimer > 0) c.flashTimer -= dt; }

  // Rocket physics
  for (let ri = state.rockets.length - 1; ri >= 0; ri--) {
    const r = state.rockets[ri];
    r.trail.push({ x: r.x, y: r.y });
    if (r.trail.length > 8) r.trail.shift();

    if (r.fading) {
      r.fadeTimer += dt;
      r.opacity = Math.max(0, 1.0 - r.fadeTimer / CONFIG.ROCKET_FADE_TIME);
      if (r.opacity <= 0) state.rockets.splice(ri, 1);
    } else {
      r.age += dt;
      if (r.age >= CONFIG.ROCKET_LIFESPAN) {
        r.fading = true;
        r.fadeTimer = 0;
        continue;
      }
      const WARN_START = CONFIG.ROCKET_LIFESPAN - 3;
      if (r.age >= WARN_START) {
        const t = (r.age - WARN_START) / 3;
        r.opacity = 1.0 - t * 0.6;
      } else {
        r.opacity = 1.0;
      }

      r.x += r.vx * dt;
      r.y += r.vy * dt;

      const rr = CONFIG.ROCKET_RADIUS;
      if (r.x - rr < 0)       { r.x = rr;     r.vx =  Math.abs(r.vx); }
      else if (r.x + rr > W)  { r.x = W - rr; r.vx = -Math.abs(r.vx); }
      if (r.y - rr < 0)       { r.y = rr;     r.vy =  Math.abs(r.vy); }
      else if (r.y + rr > H)  { r.y = H - rr; r.vy = -Math.abs(r.vy); }

      for (let i = state.balls.length - 1; i >= 0; i--) {
        const b = state.balls[i];
        if (b.gcFading) continue;
        if (Math.hypot(r.x - b.x, r.y - b.y) < CONFIG.ROCKET_RADIUS + b.props.radius) {
          spawnAbsorptionBurst(b.x, b.y, b.props.color);
          soundEngine.playRocketAbsorb(b.props.color);
          state.balls.splice(i, 1);
          addScore(10);
        }
      }
    }
  }

  // Particle updates
  updateParticles(dt);

  // Laser heat decay
  if (state.laserOverheated) {
    state.laserOverheatTimer -= dt;
    if (state.laserOverheatTimer <= 0) {
      state.laserOverheated = false;
      state.laserHeat = 0;
      state.laserOverheatTimer = 0;
      soundEngine.playLaserReady();
      state.laserSteamParticles = [];
    }
  } else if (state.laserHeat > 0) {
    state.laserHeat = Math.max(0, state.laserHeat - CONFIG.LASER_HEAT_DECAY * dt);
  }

  // Laser beam fade
  if (state.laserBeam) {
    state.laserBeam.timer -= dt;
    state.laserBeam.alpha = Math.max(0, state.laserBeam.timer / CONFIG.LASER_BEAM_DURATION);
    if (state.laserBeam.timer <= 0) state.laserBeam = null;
  }

  // Continuous steam emission while overheated
  if (state.laserOverheated && Math.random() < 0.25) {
    spawnSteamParticles(state.canvas.width / 2, 20);
  }
}
