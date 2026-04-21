// cannon.js — cannon rendering (base, barrel, trajectory ghost line)
'use strict';

import { state } from '../state.js';

const BASE_W = 44;
const BASE_H = 22;
const BARREL_LEN = 36;
const BARREL_W = 16;

export function drawCannon() {
  if (!state.cannonPlaced || !state.cannonPos) return;
  const ctx = state.ctx;
  const { x, y } = state.cannonPos;
  const angle = state.cannonAngle;
  const active = state.currentTool === 'rocket' || state.currentTool === 'laser';

  ctx.save();
  ctx.translate(x, y);

  // --- Draw base (doesn't rotate) ---
  const baseColor = active ? '#3a4a6a' : '#2a3a5a';
  const borderColor = active ? '#5a6a8a' : '#4a5a7a';

  ctx.fillStyle = baseColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-BASE_W / 2, -BASE_H / 2, BASE_W, BASE_H, 8);
  ctx.fill();
  ctx.stroke();

  // Bolts/rivets
  const boltColor = active ? '#8a9aba' : '#6a7a9a';
  for (const bx of [-14, 14]) {
    ctx.beginPath();
    ctx.arc(bx, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = boltColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx, 0, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = active ? '#b0c0e0' : '#8a9aba';
    ctx.fill();
  }

  // --- Draw barrel (rotates with angle) ---
  ctx.save();
  // Flip logic: if aimed below horizontal, mirror so barrel never looks upside-down
  let drawAngle = angle;
  const mirror = (angle > 0 && angle < Math.PI);
  if (mirror) {
    ctx.scale(1, -1);
    drawAngle = -angle;
  }
  ctx.rotate(drawAngle);

  // Active glow
  if (active) {
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 18;
  }

  // Barrel body
  const barrelGrad = ctx.createLinearGradient(0, -BARREL_W / 2, 0, BARREL_W / 2);
  barrelGrad.addColorStop(0, active ? '#ff8855' : '#3a4a6a');
  barrelGrad.addColorStop(0.4, active ? '#cc5522' : '#2a3a5a');
  barrelGrad.addColorStop(1, active ? '#ff8855' : '#3a4a6a');
  ctx.fillStyle = barrelGrad;
  ctx.beginPath();
  ctx.roundRect(0, -BARREL_W / 2, BARREL_LEN, BARREL_W, [2, 6, 6, 2]);
  ctx.fill();

  // Barrel border
  ctx.strokeStyle = active ? '#ff9955' : '#4a5a7a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Muzzle highlight at tip
  ctx.beginPath();
  ctx.arc(BARREL_LEN, 0, BARREL_W / 2 + 1, -Math.PI / 2, Math.PI / 2);
  ctx.strokeStyle = active ? '#ffaa66' : '#5a6a8a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Muzzle opening
  ctx.beginPath();
  ctx.ellipse(BARREL_LEN, 0, 3, BARREL_W / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = active ? '#331100' : '#1a2a3a';
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.restore();

  // --- Dashed trajectory ghost line ---
  drawTrajectoryLine(ctx, x, y, angle);
}

function drawTrajectoryLine(ctx, cx, cy, angle) {
  const tipDist = BARREL_LEN + 4;
  const tipX = cx + Math.cos(angle) * tipDist;
  const tipY = cy + Math.sin(angle) * tipDist;
  const lineLen = 120;
  const endX = tipX + Math.cos(angle) * lineLen;
  const endY = tipY + Math.sin(angle) * lineLen;

  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();
}
