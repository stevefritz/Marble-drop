// draw.js — main render loop and core drawing functions
'use strict';

import { state } from '../state.js';
import {
  DOT_RADIUS, WALL_HALF_W, PEG_RADIUS, HANDLE_RADIUS,
  FLASH_DURATION, FIXED_DT, VERSION
} from '../config.js';
import { lighten, darken } from '../utils/color.js';
import { updatePhysics } from '../engine/physics.js';
import { drawGhost, drawRocketParticles, drawSteamParticles } from './effects.js';
import { drawTurret, drawRocket, drawLaserBeam } from './turret.js';
import { updateMagazine, updateHeatUI } from './hud.js';
import { drawCannon } from './cannon.js';

function drawGrid() {
  const ctx = state.ctx;
  ctx.fillStyle = 'rgba(90, 115, 170, 0.38)';
  for (const d of state.dots) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, DOT_RADIUS, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawWalls() {
  const ctx = state.ctx;
  ctx.lineCap = 'round';
  ctx.lineWidth = WALL_HALF_W * 2;
  for (const w of state.walls) {
    const flash = Math.max(0, w.flashTimer || 0) / FLASH_DURATION;
    ctx.save();
    if (flash > 0) {
      ctx.strokeStyle = '#FFFACC';
      ctx.shadowColor = '#FFE030';
      ctx.shadowBlur = 6 + 22 * flash;
    } else {
      const wColor = w.color || '#D4B896';
      ctx.strokeStyle = wColor;
      ctx.shadowColor = wColor + '59';
      ctx.shadowBlur = 5;
    }
    ctx.beginPath();
    ctx.moveTo(w.ax, w.ay);
    ctx.lineTo(w.bx, w.by);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCurves() {
  const ctx = state.ctx;
  const showHandles = state.currentTool === 'curve' || state.currentTool === 'eraser';
  for (const c of state.curves) {
    const flash = Math.max(0, c.flashTimer || 0) / FLASH_DURATION;
    ctx.save();
    if (flash > 0) {
      ctx.strokeStyle = '#CCFFFF';
      ctx.shadowColor = '#00EEFF';
      ctx.shadowBlur = 6 + 22 * flash;
    } else {
      const cColor = c.color || '#88CCEE';
      ctx.strokeStyle = cColor;
      ctx.shadowColor = cColor + '59';
      ctx.shadowBlur = 5;
    }
    ctx.lineWidth = WALL_HALF_W * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.ax, c.ay);
    ctx.quadraticCurveTo(c.cx, c.cy, c.bx, c.by);
    ctx.stroke();
    ctx.restore();

    if (showHandles) {
      const cColor = c.color || '#88CCEE';
      ctx.save();
      ctx.strokeStyle = cColor + '72';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(c.ax, c.ay);
      ctx.lineTo(c.cx, c.cy);
      ctx.lineTo(c.bx, c.by);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(c.cx, c.cy, HANDLE_RADIUS, 0, Math.PI*2);
      ctx.fillStyle = cColor;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function drawPegs() {
  const ctx = state.ctx;
  for (const peg of state.pegs) {
    const pulse = Math.max(0, peg.pulseTimer);
    const extra = pulse > 0 ? Math.sin((pulse / 0.35) * Math.PI) * 7 : 0;
    const r = PEG_RADIUS + extra;

    const pegColor = peg.color || null;
    const baseLight = pegColor ? lighten(pegColor, pulse > 0 ? 60 : 40) : (pulse > 0 ? '#FFE040' : '#FFC820');
    const baseDark  = pegColor ? darken(pegColor, pulse > 0 ? 20 : 40)  : (pulse > 0 ? '#FF9000' : '#CC8800');
    const shadowCol = pegColor ? pegColor : (pulse > 0 ? '#FFD700' : 'rgba(255,185,0,0.4)');

    ctx.save();
    ctx.shadowColor = shadowCol;
    ctx.shadowBlur  = pulse > 0 ? 18 : 7;
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, r, 0, Math.PI*2);

    const grad = ctx.createRadialGradient(peg.x - r*0.3, peg.y - r*0.3, r*0.1, peg.x, peg.y, r);
    grad.addColorStop(0, baseLight);
    grad.addColorStop(1, baseDark);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

function drawBalls() {
  const ctx = state.ctx;
  for (const b of state.balls) {
    const p = b.props;
    const opacity = b.opacity !== undefined ? b.opacity : 1.0;
    const r = (b.atRest || b.gcFading) ? p.radius * (0.7 + 0.3 * opacity) : p.radius;

    ctx.save();
    ctx.globalAlpha = opacity;

    if (!b.atRest && b.trail.length > 1) {
      for (let i = 0; i < b.trail.length; i++) {
        const alpha = (i+1) / b.trail.length * 0.38;
        const tr = r * (i+1) / b.trail.length * 0.9;
        ctx.globalAlpha = opacity * alpha;
        ctx.beginPath();
        ctx.arc(b.trail[i].x, b.trail[i].y, tr, 0, Math.PI*2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = opacity;
    }

    const ageVisual = Math.min(1, Math.max(0, ((b.age || 0) - 30) / 60));

    ctx.shadowColor = p.glow;
    ctx.shadowBlur  = 12 * (1 - ageVisual * 0.6);

    const grad = ctx.createRadialGradient(b.x - r*0.32, b.y - r*0.32, r*0.08, b.x, b.y, r);
    grad.addColorStop(0, lighten(p.color, 40));
    grad.addColorStop(0.6, p.color);
    grad.addColorStop(1, darken(p.color, 25));

    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(b.x - r*0.3, b.y - r*0.32, r*0.32, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${0.48 * (1 - ageVisual * 0.55)})`;
    ctx.fill();

    ctx.restore();
  }
}

export function render(ts) {
  requestAnimationFrame(render);

  const rawDt = Math.min((ts - state.lastTimestamp) / 1000, 0.05);
  state.lastTimestamp = ts;
  state.physicsAccum += rawDt;

  while (state.physicsAccum >= FIXED_DT) {
    updatePhysics(FIXED_DT);
    state.physicsAccum -= FIXED_DT;
  }

  const ctx = state.ctx;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

  drawGrid();
  drawWalls();
  drawCurves();
  drawPegs();
  drawCannon();
  drawBalls();
  drawRocketParticles();
  drawRocket();
  drawLaserBeam();
  drawSteamParticles();
  drawTurret();
  drawGhost();
  updateMagazine();
  updateHeatUI();

  // Version watermark
  ctx.save();
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(VERSION, state.canvas.width - 8, state.canvas.height - 8);
  ctx.restore();
}
