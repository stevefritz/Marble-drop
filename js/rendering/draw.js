// draw.js — main render loop and core drawing functions
'use strict';

import { state } from '../state.js';
import { CONFIG, VERSION } from '../config.js';
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
    ctx.arc(d.x, d.y, CONFIG.DOT_RADIUS, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawWalls() {
  const ctx = state.ctx;
  ctx.lineCap = 'round';
  ctx.lineWidth = CONFIG.WALL_HALF_W * 2;
  for (const w of state.walls) {
    const flash = Math.max(0, w.flashTimer || 0) / CONFIG.FLASH_DURATION;
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
    const flash = Math.max(0, c.flashTimer || 0) / CONFIG.FLASH_DURATION;
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
    ctx.lineWidth = CONFIG.WALL_HALF_W * 2;
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
      ctx.arc(c.cx, c.cy, CONFIG.HANDLE_RADIUS, 0, Math.PI*2);
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
    const r = CONFIG.PEG_RADIUS + extra;

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

function drawAimHint(dt) {
  if (!state.showAimHint || state.aimHintTimer <= 0) return;
  if (!state.cannonPlaced || !state.cannonPos) return;

  state.aimHintTimer -= dt;
  if (state.aimHintTimer <= 0) {
    state.showAimHint = false;
    return;
  }

  const ctx = state.ctx;
  const { x, y } = state.cannonPos;

  // Fade out during last 0.5s
  const alpha = state.aimHintTimer < 0.5 ? state.aimHintTimer / 0.5 : 1.0;

  // Position hint to the right or left of cannon depending on its position
  const onRight = x < state.canvas.width / 2;
  const offsetX = onRight ? 50 : -50;
  const hintX = x + offsetX;
  const hintY = y - 2;
  const text = onRight ? 'Drag to aim \u2192' : '\u2190 Drag to aim';

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Measure text for pill background
  const metrics = ctx.measureText(text);
  const padX = 10;
  const padY = 6;
  const pillW = metrics.width + padX * 2;
  const pillH = 13 + padY * 2;

  // Pill background
  ctx.fillStyle = 'rgba(22, 33, 62, 0.8)';
  ctx.beginPath();
  ctx.roundRect(hintX - pillW / 2, hintY - pillH / 2, pillW, pillH, pillH / 2);
  ctx.fill();

  // Text
  ctx.fillStyle = '#6a8abf';
  ctx.fillText(text, hintX, hintY);

  ctx.restore();
}

export function render(ts) {
  requestAnimationFrame(render);

  const rawDt = Math.min((ts - state.lastTimestamp) / 1000, 0.05);
  state.lastTimestamp = ts;
  state.physicsAccum += rawDt;

  while (state.physicsAccum >= CONFIG.FIXED_DT) {
    updatePhysics(CONFIG.FIXED_DT);
    state.physicsAccum -= CONFIG.FIXED_DT;
  }

  const ctx = state.ctx;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

  drawGrid();
  drawWalls();
  drawCurves();
  drawPegs();
  drawCannon();
  drawAimHint(rawDt);
  drawBalls();
  drawRocketParticles();
  drawRocket();
  drawLaserBeam();
  drawSteamParticles();
  drawTurret();
  drawGhost();
  updateMagazine();
  updateHeatUI();

  // Tutorial overlays
  drawTutorialOverlay(ts, rawDt);

  // Version watermark
  ctx.save();
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(VERSION, state.canvas.width - 8, state.canvas.height - 8);
  ctx.restore();
}

function drawTutorialOverlay(ts, dt) {
  const ctx = state.ctx;
  const step = state.tutorialStep;

  if (step === 1) {
    // Pulsing "Tap a dot to place your cannon" text
    const pulse = 0.6 + 0.4 * Math.sin(ts / 500);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.font = 'bold 23px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Tap a dot to place your cannon', state.canvas.width / 2, state.canvas.height * 0.28);
    ctx.restore();

    // Highlight a few grid dots with pulsing rings
    const ringPulse = 0.3 + 0.5 * Math.sin(ts / 400);
    ctx.save();
    ctx.strokeStyle = `rgba(74, 172, 255, ${ringPulse})`;
    ctx.lineWidth = 2;
    const centerX = state.canvas.width / 2;
    const centerY = state.canvas.height / 2;
    let count = 0;
    for (const d of state.dots) {
      const dist = Math.hypot(d.x - centerX, d.y - centerY);
      if (dist < state.gridSpacing * 3 && count < 9) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 8 + 4 * Math.sin(ts / 600 + d.x), 0, Math.PI * 2);
        ctx.stroke();
        count++;
      }
    }
    ctx.restore();
  }

  if (step === 2 && state.cannonPos) {
    // "Drag to aim" text near cannon
    const pulse = 0.6 + 0.4 * Math.sin(ts / 500);
    const { x, y } = state.cannonPos;
    const onRight = x < state.canvas.width / 2;
    const textX = onRight ? x + 70 : x - 70;
    const textY = y - 30;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Drag to aim', textX, textY);

    // Arrow pointing toward cannon
    const arrowStartX = onRight ? textX - 30 : textX + 30;
    const arrowEndX = onRight ? x + 20 : x - 20;
    const arrowEndY = y - 10;
    ctx.strokeStyle = `rgba(74, 172, 255, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(arrowStartX, textY + 5);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.stroke();
    // Arrowhead
    const angle = Math.atan2(arrowEndY - (textY + 5), arrowEndX - arrowStartX);
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(arrowEndX - 8 * Math.cos(angle - 0.4), arrowEndY - 8 * Math.sin(angle - 0.4));
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(arrowEndX - 8 * Math.cos(angle + 0.4), arrowEndY - 8 * Math.sin(angle + 0.4));
    ctx.stroke();

    // Pulsing arc showing aim range
    const arcPulse = 0.15 + 0.15 * Math.sin(ts / 600);
    ctx.strokeStyle = `rgba(74, 172, 255, ${arcPulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(x, y, 45, -Math.PI, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  // Toast: "Build some obstacles, then FIRE!"
  if (state.tutorialToast > 0) {
    state.tutorialToast -= dt;
    if (state.tutorialToast < 0) state.tutorialToast = 0;

    const alpha = Math.min(1.0, state.tutorialToast / 0.5);
    const text = 'Build some obstacles, then FIRE!';

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(text);
    const padX = 16;
    const padY = 10;
    const pillW = metrics.width + padX * 2;
    const pillH = 16 + padY * 2;
    const cx = state.canvas.width / 2;
    const cy = state.canvas.height * 0.18;

    ctx.fillStyle = 'rgba(22, 33, 62, 0.85)';
    ctx.beginPath();
    ctx.roundRect(cx - pillW / 2, cy - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }
}
