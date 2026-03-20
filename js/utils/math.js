// math.js — geometry helpers for collision detection
'use strict';

export function closestPtOnSeg(px, py, ax, ay, bx, by) {
  const dx = bx-ax, dy = by-ay;
  const lenSq = dx*dx + dy*dy;
  if (lenSq < 0.001) return { x: ax, y: ay };
  const t = Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / lenSq));
  return { x: ax + t*dx, y: ay + t*dy };
}

export function distToSeg(px, py, ax, ay, bx, by) {
  const cp = closestPtOnSeg(px, py, ax, ay, bx, by);
  return Math.hypot(px - cp.x, py - cp.y);
}

export function bezierPt(t, ax, ay, cx, cy, bx, by) {
  const mt = 1 - t;
  return { x: mt*mt*ax + 2*mt*t*cx + t*t*bx, y: mt*mt*ay + 2*mt*t*cy + t*t*by };
}

export function sampleCurve(c, n) {
  n = n || 20;
  const segs = [];
  let prev = bezierPt(0, c.ax, c.ay, c.cx, c.cy, c.bx, c.by);
  for (let i = 1; i <= n; i++) {
    const pt = bezierPt(i/n, c.ax, c.ay, c.cx, c.cy, c.bx, c.by);
    segs.push({ ax: prev.x, ay: prev.y, bx: pt.x, by: pt.y });
    prev = pt;
  }
  return segs;
}

export function distToCurve(x, y, c) {
  let min = Infinity;
  for (const s of sampleCurve(c, 12)) min = Math.min(min, distToSeg(x, y, s.ax, s.ay, s.bx, s.by));
  return min;
}
