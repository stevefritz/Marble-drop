// cannon.js — cannon sprite drawing and trajectory ghost
'use strict';

import { state } from '../state.js';

const BASE_RADIUS = 22;   // half of ~44px base
const BARREL_LEN  = 36;   // px from center to muzzle
const BARREL_W    = 14;   // barrel width

function clampCannonAngle(angle) {
  // Block straight-down zone: [45°, 135°] in screen coords (y-down)
  // i.e. [π/4, 3π/4] — gives 270° usable arc
  const lo = Math.PI / 4;
  const hi = 3 * Math.PI / 4;
  if (angle > lo && angle < hi) {
    const distLo = angle - lo;
    const distHi = hi - angle;
    return distLo < distHi ? lo : hi;
  }
  return angle;
}

export { clampCannonAngle };

function drawCannonBase(ctx) {
  // Outer glow
  ctx.shadowColor = '#FF8800';
  ctx.shadowBlur = 18;

  // Base circle
  const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, BASE_RADIUS);
  grad.addColorStop(0, '#4a5a78');
  grad.addColorStop(1, '#1e2e48');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, BASE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Border ring
  ctx.strokeStyle = '#FF8800';
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, 0, BASE_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // Inner highlight
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(-5, -5, BASE_RADIUS * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Bolts (rivets) at cardinal positions
  const boltColor = '#FF9933';
  const boltInner = '#FFCC66';
  for (const [bx, by] of [[-14, 0], [14, 0], [0, -14], [0, 14]]) {
    ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fillStyle = boltColor; ctx.fill();
    ctx.beginPath(); ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = boltInner; ctx.fill();
  }
}

function drawCannonBarrel(ctx) {
  // Barrel extends from center outward in local +x direction.
  // ctx is already rotated to cannonAngle by caller.
  // Highlight stays at -y (local "top"), which always looks clean after rotation.

  // Barrel body
  const barrelGrad = ctx.createLinearGradient(0, -BARREL_W / 2, 0, BARREL_W / 2);
  barrelGrad.addColorStop(0, '#3a4c66');
  barrelGrad.addColorStop(0.45, '#5a7a9a');
  barrelGrad.addColorStop(1, '#2a3a55');
  ctx.fillStyle = barrelGrad;
  ctx.shadowColor = '#FF8800';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.roundRect(BASE_RADIUS - 4, -BARREL_W / 2, BARREL_LEN, BARREL_W, [2, 6, 6, 2]);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Barrel highlight stripe
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.roundRect(BASE_RADIUS - 2, -BARREL_W / 2 + 2, BARREL_LEN - 6, 3, 2);
  ctx.fill();

  // Muzzle ring (at tip)
  const muzzleX = BASE_RADIUS - 4 + BARREL_LEN;
  ctx.strokeStyle = '#FF9933';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(muzzleX - 4, -BARREL_W / 2 - 1, 6, BARREL_W + 2, 2);
  ctx.stroke();

  // Muzzle opening
  ctx.fillStyle = '#0d1520';
  ctx.beginPath();
  ctx.ellipse(muzzleX + 1, 0, 4, BARREL_W / 2 - 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FF6600';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawCannon() {
  if (!state.cannonPlaced || !state.cannonPos) return;

  const ctx = state.ctx;
  const { x, y } = state.cannonPos;
  const angle = state.cannonAngle;

  ctx.save();
  ctx.translate(x, y);

  // Draw barrel first (behind base)
  ctx.save();
  ctx.rotate(angle);
  drawCannonBarrel(ctx);
  ctx.restore();

  // Draw base on top
  drawCannonBase(ctx);

  ctx.restore();

  // Draw trajectory ghost line
  drawTrajectoryGhost(ctx, x, y, angle);
}

function drawTrajectoryGhost(ctx, cx, cy, angle) {
  // Start from barrel tip
  const tipDist = BASE_RADIUS - 4 + BARREL_LEN;
  const tx = cx + Math.cos(angle) * tipDist;
  const ty = cy + Math.sin(angle) * tipDist;

  // Extend ~200px in aim direction
  const ghostLen = 200;
  const ex = tx + Math.cos(angle) * ghostLen;
  const ey = ty + Math.sin(angle) * ghostLen;

  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(255, 160, 60, 0.55)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#FF8800';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.restore();
}
