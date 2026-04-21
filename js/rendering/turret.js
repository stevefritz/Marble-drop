// turret.js — turret rendering, rocket sprite, laser beam
'use strict';

import { state } from '../state.js';
import { CONFIG } from '../config.js';

function drawRocketTurretShape(ctx, active) {
  const baseW = 54, baseH = 14;
  const baseGrad = ctx.createLinearGradient(-baseW/2, -baseH/2, -baseW/2, baseH/2);
  baseGrad.addColorStop(0, active ? '#ff8833' : '#4a5a70');
  baseGrad.addColorStop(1, active ? '#cc4400' : '#2a3550');
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.roundRect(-baseW/2, -baseH/2, baseW, baseH, 5);
  ctx.fill();

  ctx.fillStyle = active ? 'rgba(255,220,150,0.3)' : 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(-baseW/2 + 3, -baseH/2 + 2, baseW - 6, 4, 2);
  ctx.fill();

  const boltColor = active ? '#ffaa44' : '#667799';
  for (const bx of [-18, 18]) {
    ctx.beginPath(); ctx.arc(bx, 0, 3.5, 0, Math.PI*2);
    ctx.fillStyle = boltColor; ctx.fill();
    ctx.beginPath(); ctx.arc(bx, 0, 1.5, 0, Math.PI*2);
    ctx.fillStyle = active ? '#ffdd88' : '#99aabb'; ctx.fill();
  }

  const barrelW = 20, barrelH = 30;
  const barrelTop = baseH / 2 - 2;
  const barrelGrad = ctx.createLinearGradient(-barrelW/2, 0, barrelW/2, 0);
  barrelGrad.addColorStop(0,   active ? '#cc4400' : '#2a3550');
  barrelGrad.addColorStop(0.4, active ? '#ff9955' : '#5a6e88');
  barrelGrad.addColorStop(1,   active ? '#cc4400' : '#2a3550');
  ctx.fillStyle = barrelGrad;
  ctx.beginPath();
  ctx.roundRect(-barrelW/2, barrelTop, barrelW, barrelH, [2, 2, 6, 6]);
  ctx.fill();

  ctx.strokeStyle = active ? '#ffaa44' : '#667799';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-barrelW/2 - 2, barrelTop, barrelW + 4, 6, 2);
  ctx.stroke();

  const mouthY = barrelTop + barrelH - 2;
  ctx.beginPath();
  ctx.ellipse(0, mouthY, barrelW/2 - 1, 5, 0, 0, Math.PI*2);
  ctx.fillStyle = active ? '#441100' : '#111822';
  ctx.fill();
  ctx.strokeStyle = active ? '#ff6622' : '#445566';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawLaserTurretShape(ctx, active, overheated) {
  const now = performance.now();
  const pulse = Math.sin(now * 0.006) * 0.5 + 0.5;

  if (overheated) {
    ctx.shadowColor = `rgba(255, ${Math.floor(pulse * 80)}, 0, 0.9)`;
    ctx.shadowBlur = 20 + pulse * 14;
  } else if (active) {
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 16;
  }

  const baseGrad = ctx.createLinearGradient(-27, -7, -27, 7);
  baseGrad.addColorStop(0, overheated ? '#3a0a00' : (active ? '#004444' : '#2a3550'));
  baseGrad.addColorStop(1, overheated ? '#220500' : (active ? '#002222' : '#1a2540'));
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.roundRect(-27, -7, 54, 14, 5);
  ctx.fill();

  ctx.fillStyle = overheated ? 'rgba(255,80,0,0.4)' : (active ? 'rgba(0,255,255,0.2)' : 'rgba(100,200,220,0.1)');
  ctx.beginPath();
  ctx.roundRect(-22, -5, 44, 3, 2);
  ctx.fill();

  const finColor = overheated ? '#cc3300' : (active ? '#006666' : '#334466');
  for (const sx of [-27, 13]) {
    ctx.fillStyle = finColor;
    ctx.beginPath();
    ctx.roundRect(sx, -4, 14, 10, 3);
    ctx.fill();
  }

  const barrelW = 14, barrelH = 32;
  const barrelTop = 7;
  const barrelGrad = ctx.createLinearGradient(-barrelW/2, 0, barrelW/2, 0);
  barrelGrad.addColorStop(0,   overheated ? '#440000' : (active ? '#003333' : '#1a2540'));
  barrelGrad.addColorStop(0.4, overheated ? '#994400' : (active ? '#009999' : '#3a5a78'));
  barrelGrad.addColorStop(1,   overheated ? '#440000' : (active ? '#003333' : '#1a2540'));
  ctx.fillStyle = barrelGrad;
  ctx.beginPath();
  ctx.roundRect(-barrelW/2, barrelTop, barrelW, barrelH, [3, 3, 4, 4]);
  ctx.fill();

  const ringAlpha = overheated ? 0.8 : (active ? 0.55 : 0.2);
  const ringColor = overheated
    ? `rgba(255,${Math.floor(80 + pulse*120)},0,${ringAlpha})`
    : `rgba(0,${Math.floor(180 + pulse*75)},255,${ringAlpha})`;
  for (const ry of [13, 21, 29]) {
    ctx.beginPath();
    ctx.ellipse(0, ry, barrelW/2 + 1, 3, 0, 0, Math.PI*2);
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (active && !overheated) {
    const tipY = barrelTop + barrelH;
    const tipGlow = ctx.createRadialGradient(0, tipY, 1, 0, tipY, 9);
    tipGlow.addColorStop(0, `rgba(0,255,255,${0.7 + pulse * 0.3})`);
    tipGlow.addColorStop(0.5, `rgba(0,180,255,0.4)`);
    tipGlow.addColorStop(1, 'rgba(0,80,200,0)');
    ctx.fillStyle = tipGlow;
    ctx.beginPath();
    ctx.arc(0, tipY, 9, 0, Math.PI*2);
    ctx.fill();
  }

  if (overheated) {
    const tipY = barrelTop + barrelH;
    const tipGlow = ctx.createRadialGradient(0, tipY, 1, 0, tipY, 11);
    tipGlow.addColorStop(0, `rgba(255,${Math.floor(pulse*80)},0,0.9)`);
    tipGlow.addColorStop(1, 'rgba(200,0,0,0)');
    ctx.fillStyle = tipGlow;
    ctx.beginPath();
    ctx.arc(0, tipY, 11, 0, Math.PI*2);
    ctx.fill();
  }
}

export function drawTurret() {
  const ctx = state.ctx;
  const tx = state.canvas.width / 2;
  const ty = 20;
  const active = state.currentTool === 'rocket' || state.currentTool === 'laser';

  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(state.turretAngle - Math.PI / 2);

  if (state.currentTool === 'laser') {
    drawLaserTurretShape(ctx, active, state.laserOverheated);
  } else {
    if (active) {
      ctx.shadowColor = '#FF6600';
      ctx.shadowBlur  = 24;
    }
    drawRocketTurretShape(ctx, active);
  }

  ctx.restore();
}

export function drawRocket() {
  if (state.rockets.length === 0) return;
  const ctx = state.ctx;
  const now = performance.now();
  for (const rocket of state.rockets) {
    const { x, y, vx, vy, trail, opacity } = rocket;
    const angle = Math.atan2(vy, vx);

    ctx.save();

    ctx.shadowColor = '#FF6600';
    ctx.shadowBlur  = 10;
    for (let i = 0; i < trail.length; i++) {
      const t = (i + 1) / trail.length;
      const a = t * 0.55 * opacity;
      const r = 8 * t;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(trail[i].x, trail[i].y, r, 0, Math.PI * 2);
      ctx.fillStyle = i > trail.length * 0.6 ? '#FFAA00' : '#FF6600';
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Fins
    ctx.fillStyle = '#FFCC00';
    ctx.beginPath();
    ctx.moveTo(-10, -9); ctx.lineTo(-18, -18); ctx.lineTo(-18, -10);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, 9); ctx.lineTo(-18, 18); ctx.lineTo(-18, 10);
    ctx.closePath(); ctx.fill();

    // Body
    const bodyGrad = ctx.createLinearGradient(-10, -10, -10, 10);
    bodyGrad.addColorStop(0, '#FF9944');
    bodyGrad.addColorStop(0.5, '#FF6600');
    bodyGrad.addColorStop(1, '#CC3300');
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = '#FF8820';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(-10, -10, 26, 20, 5);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,220,150,0.35)';
    ctx.beginPath();
    ctx.roundRect(-8, -8, 22, 6, 3);
    ctx.fill();

    ctx.fillStyle = 'rgba(180,30,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(0, -10, 4, 20, 0);
    ctx.fill();

    // Porthole
    ctx.beginPath();
    ctx.arc(4, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#88CCFF'; ctx.fill();
    ctx.beginPath();
    ctx.arc(4, 0, 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.arc(2.5, -1.5, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();

    // Nose cone
    const noseGrad = ctx.createLinearGradient(10, -10, 10, 10);
    noseGrad.addColorStop(0, '#FF4444');
    noseGrad.addColorStop(1, '#AA0000');
    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.moveTo(16, -9);
    ctx.quadraticCurveTo(28, -9, 28, 0);
    ctx.quadraticCurveTo(28, 9, 16, 9);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,180,180,0.4)';
    ctx.beginPath();
    ctx.moveTo(17, -7);
    ctx.quadraticCurveTo(25, -7, 25, -1);
    ctx.quadraticCurveTo(25, 1, 22, 2);
    ctx.quadraticCurveTo(17, -1, 17, -7);
    ctx.closePath(); ctx.fill();

    // Flame
    const flicker = Math.sin(now * 0.025) * 0.5 + 0.5;
    const flameLen = 10 + flicker * 8;
    ctx.globalAlpha = opacity * 0.85;
    ctx.fillStyle = '#FFEE44';
    ctx.beginPath();
    ctx.ellipse(-14 - flameLen * 0.5, 0, flameLen * 0.5 + 2, 5 + flicker * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(-13 - flameLen * 0.3, 0, flameLen * 0.3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = opacity;

    ctx.restore();
  }
}

export function drawLaserBeam() {
  if (!state.laserBeam) return;
  const ctx = state.ctx;
  const { x1, y1, x2, y2, alpha } = state.laserBeam;
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.55)';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(100, 240, 255, 0.8)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.shadowBlur = 4;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.restore();
}
