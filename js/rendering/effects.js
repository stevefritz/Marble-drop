// effects.js — ghost preview, particle effects, spawn functions
'use strict';

import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { parseHex } from '../utils/color.js';
import { snapToDot } from '../engine/grid.js';

export function drawGhost() {
  if (!state.isDrawing || !state.drawStart || !state.ghostPos) return;
  const ctx = state.ctx;
  const snapEnd = snapToDot(state.ghostPos.x, state.ghostPos.y);
  const ex = snapEnd ? snapEnd.x : state.ghostPos.x;
  const ey = snapEnd ? snapEnd.y : state.ghostPos.y;

  const [gr, gg, gb] = parseHex(state.currentLineColor);
  ctx.save();
  ctx.setLineDash([9, 8]);
  ctx.lineCap = 'round';
  ctx.lineWidth = CONFIG.WALL_HALF_W * 2;
  ctx.strokeStyle = `rgba(${gr},${gg},${gb},0.55)`;
  ctx.beginPath();
  ctx.moveTo(state.drawStart.x, state.drawStart.y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.restore();

  const hlColor = `rgba(${gr},${gg},${gb},0.85)`;
  ctx.beginPath();
  ctx.arc(state.drawStart.x, state.drawStart.y, CONFIG.DOT_RADIUS + 5, 0, Math.PI*2);
  ctx.fillStyle = hlColor; ctx.fill();
  if (snapEnd) {
    ctx.beginPath();
    ctx.arc(snapEnd.x, snapEnd.y, CONFIG.DOT_RADIUS + 5, 0, Math.PI*2);
    ctx.fillStyle = hlColor; ctx.fill();
  }
}

export function drawRocketParticles() {
  const ctx = state.ctx;
  for (const p of state.rocketParticles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.restore();
  }
}

export function drawSteamParticles() {
  const ctx = state.ctx;
  for (const p of state.laserSteamParticles) {
    const alpha = Math.max(0, (p.life / p.maxLife) * 0.55);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fillStyle = '#AADDFF';
    ctx.shadowColor = '#44AACC';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }
}

export function spawnAbsorptionBurst(x, y, color) {
  const count = 18;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const speed = 100 + Math.random() * 200;
    const life  = 0.3 + Math.random() * 0.25;
    state.rocketParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 50,
      color,
      life,
      maxLife: life,
      size: 5 + Math.random() * 6,
    });
  }
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 120;
    const life  = 0.2 + Math.random() * 0.2;
    state.rocketParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      color: i % 2 === 0 ? '#FF8820' : '#FFDD00',
      life,
      maxLife: life,
      size: 3 + Math.random() * 4,
    });
  }
}

export function spawnSteamParticles(x, y) {
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.7;
    const speed = 25 + Math.random() * 55;
    const life = 0.4 + Math.random() * 0.5;
    state.laserSteamParticles.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y + 30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: 3 + Math.random() * 4,
    });
  }
}

export function updateParticles(dt) {
  // Rocket particles
  for (let i = state.rocketParticles.length - 1; i >= 0; i--) {
    const p = state.rocketParticles[i];
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    p.vy += CONFIG.GRAVITY * 0.25 * dt;
    p.life -= dt;
    if (p.life <= 0) state.rocketParticles.splice(i, 1);
  }

  // Steam particles
  for (let i = state.laserSteamParticles.length - 1; i >= 0; i--) {
    const p = state.laserSteamParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy -= 40 * dt;
    p.vx *= 0.97;
    p.size += 1.5 * dt;
    p.life -= dt;
    if (p.life <= 0) state.laserSteamParticles.splice(i, 1);
  }
}
