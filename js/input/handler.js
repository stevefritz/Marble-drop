// handler.js — input event handling (touch/mouse), tool routing
'use strict';

import { state } from '../state.js';
import { PEG_RADIUS, WALL_HALF_W, HANDLE_RADIUS } from '../config.js';
import { snapToDot } from '../engine/grid.js';
import { distToSeg, distToCurve } from '../utils/math.js';
import { tryFireRocket } from '../weapons/rocket.js';
import { tryFireLaser } from '../weapons/laser.js';

function getPos(e) {
  const rect = state.canvas.getBoundingClientRect();
  const scaleX = state.canvas.width  / rect.width;
  const scaleY = state.canvas.height / rect.height;
  let cx, cy;
  if (e.changedTouches && e.changedTouches.length > 0) {
    cx = e.changedTouches[0].clientX;
    cy = e.changedTouches[0].clientY;
  } else if (e.touches && e.touches.length > 0) {
    cx = e.touches[0].clientX;
    cy = e.touches[0].clientY;
  } else {
    cx = e.clientX;
    cy = e.clientY;
  }
  return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
}

function eraseAt(x, y) {
  const ED = 24;

  for (let i = state.pegs.length - 1; i >= 0; i--) {
    if (Math.hypot(state.pegs[i].x - x, state.pegs[i].y - y) < PEG_RADIUS + ED) {
      state.pegs.splice(i, 1); return;
    }
  }
  for (let i = state.curves.length - 1; i >= 0; i--) {
    const c = state.curves[i];
    if (distToCurve(x, y, c) < WALL_HALF_W + ED ||
        Math.hypot(c.cx - x, c.cy - y) < HANDLE_RADIUS + ED) {
      state.curves.splice(i, 1); return;
    }
  }
  for (let i = state.walls.length - 1; i >= 0; i--) {
    const w = state.walls[i];
    if (distToSeg(x, y, w.ax, w.ay, w.bx, w.by) < WALL_HALF_W + ED) {
      state.walls.splice(i, 1); return;
    }
  }
}

function onStart(x, y) {
  if (state.currentTool === 'rocket') {
    tryFireRocket(x, y);
    return;
  }
  if (state.currentTool === 'laser') {
    tryFireLaser(x, y);
    return;
  }

  if (state.currentTool === 'peg') {
    const dot = snapToDot(x, y);
    if (dot && !state.pegs.some(p => Math.hypot(p.x - dot.x, p.y - dot.y) < 4)) {
      state.pegs.push({ x: dot.x, y: dot.y, pulseTimer: 0, color: state.currentLineColor });
    }
    return;
  }

  if (state.currentTool === 'eraser') {
    eraseAt(x, y);
    return;
  }

  if (state.currentTool === 'curve') {
    for (const c of state.curves) {
      if (Math.hypot(c.cx - x, c.cy - y) <= HANDLE_RADIUS + 12) {
        state.editingCurve = c;
        return;
      }
    }
  }

  const dot = snapToDot(x, y);
  if (dot) {
    state.isDrawing = true;
    state.drawStart = { x: dot.x, y: dot.y };
    state.ghostPos = { x, y };
  }
}

function onMove(x, y) {
  if (state.editingCurve) {
    state.editingCurve.cx = x;
    state.editingCurve.cy = y;
    return;
  }
  if (state.isDrawing) {
    state.ghostPos = { x, y };
  }
}

function onEnd(x, y) {
  if (state.editingCurve) { state.editingCurve = null; return; }
  if (!state.isDrawing) return;
  state.isDrawing = false;

  const endDot = snapToDot(x, y);
  if (endDot && state.drawStart && Math.hypot(endDot.x - state.drawStart.x, endDot.y - state.drawStart.y) > 6) {
    const { x: ax, y: ay } = state.drawStart;
    const { x: bx, y: by } = endDot;
    if (state.currentTool === 'wall') {
      state.walls.push({ ax, ay, bx, by, color: state.currentLineColor });
    } else if (state.currentTool === 'curve') {
      state.curves.push({ ax, ay, bx, by, cx: (ax+bx)/2, cy: (ay+by)/2, color: state.currentLineColor });
    }
  }
  state.drawStart = null;
  state.ghostPos = null;
}

export function setupInput() {
  const canvas = state.canvas;
  const opts = { passive: false };
  canvas.addEventListener('mousedown',  e => { e.preventDefault(); const p=getPos(e); onStart(p.x,p.y); });
  canvas.addEventListener('mousemove',  e => { e.preventDefault(); const p=getPos(e); onMove(p.x,p.y);  });
  canvas.addEventListener('mouseup',    e => { e.preventDefault(); const p=getPos(e); onEnd(p.x,p.y);   });
  canvas.addEventListener('mouseleave', e => { if(state.isDrawing||state.editingCurve){ const p=getPos(e); onEnd(p.x,p.y); } });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); const p=getPos(e); onStart(p.x,p.y); }, opts);
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); const p=getPos(e); onMove(p.x,p.y);  }, opts);
  canvas.addEventListener('touchend',   e => { e.preventDefault(); const p=getPos(e); onEnd(p.x,p.y);   }, opts);
  canvas.addEventListener('touchcancel',e => { state.isDrawing=false; state.editingCurve=null; state.drawStart=null; state.ghostPos=null; }, opts);
}
