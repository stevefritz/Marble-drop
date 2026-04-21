// handler.js — input event handling (touch/mouse), tool routing, cannon interaction
'use strict';

import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { snapToDot } from '../engine/grid.js';
import { distToSeg, distToCurve } from '../utils/math.js';
import { tryFireRocket } from '../weapons/rocket.js';
import { tryFireLaser } from '../weapons/laser.js';
import { placeCannon, setTool } from '../input/tools.js';
import { removeTutorialLock } from '../ui/buttons.js';

const CANNON_AIM_RADIUS = 50;

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
    if (Math.hypot(state.pegs[i].x - x, state.pegs[i].y - y) < CONFIG.PEG_RADIUS + ED) {
      state.pegs.splice(i, 1); return;
    }
  }
  for (let i = state.curves.length - 1; i >= 0; i--) {
    const c = state.curves[i];
    if (distToCurve(x, y, c) < CONFIG.WALL_HALF_W + ED ||
        Math.hypot(c.cx - x, c.cy - y) < CONFIG.HANDLE_RADIUS + ED) {
      state.curves.splice(i, 1); return;
    }
  }
  for (let i = state.walls.length - 1; i >= 0; i--) {
    const w = state.walls[i];
    if (distToSeg(x, y, w.ax, w.ay, w.bx, w.by) < CONFIG.WALL_HALF_W + ED) {
      state.walls.splice(i, 1); return;
    }
  }

  // Erase cannon if clicked on it
  if (state.cannonPlaced && state.cannonPos) {
    if (Math.hypot(state.cannonPos.x - x, state.cannonPos.y - y) < CANNON_AIM_RADIUS) {
      state.cannonPos = null;
      state.cannonPlaced = false;
      return;
    }
  }
}

function isNearCannon(x, y) {
  if (!state.cannonPlaced || !state.cannonPos) return false;
  return Math.hypot(state.cannonPos.x - x, state.cannonPos.y - y) < CANNON_AIM_RADIUS;
}

function updateCannonAngle(x, y) {
  if (!state.cannonPos) return;
  const dx = x - state.cannonPos.x;
  const dy = y - state.cannonPos.y;
  if (Math.hypot(dx, dy) > 5) {
    state.cannonAngle = Math.atan2(dy, dx);
  }
}

function onStart(x, y) {
  // Tutorial step 1: only cannon placement allowed
  if (state.tutorialStep === 1) {
    if (placeCannon(x, y)) {
      state.tutorialStep = 2;
    }
    return;
  }
  // Tutorial step 2: only cannon aiming allowed
  if (state.tutorialStep === 2) {
    if (isNearCannon(x, y)) {
      state.isAimingCannon = true;
      updateCannonAngle(x, y);
    }
    return;
  }

  if (state.currentTool === 'rocket') {
    tryFireRocket(x, y);
    return;
  }
  if (state.currentTool === 'laser') {
    tryFireLaser(x, y);
    return;
  }

  // Cannon tool: placement and aiming only, no drawing
  if (state.currentTool === 'cannon') {
    // Lock cannon during firing sequence
    if (state.firingSequence !== null) return;
    if (isNearCannon(x, y)) {
      state.isAimingCannon = true;
      state.showAimHint = false;
      updateCannonAngle(x, y);
      return;
    }
    const wasPlaced = state.cannonPlaced;
    if (placeCannon(x, y)) {
      if (!wasPlaced) {
        state.showAimHint = true;
        state.aimHintTimer = 3.0;
      }
    }
    return;
  }

  // Non-cannon tools: no cannon placement or aiming

  if (state.currentTool === 'peg') {
    const dot = snapToDot(x, y);
    if (dot && !state.pegs.some(p => Math.hypot(p.x - dot.x, p.y - dot.y) < 4)) {
      // Don't place peg on cannon
      if (state.cannonPlaced && state.cannonPos && Math.hypot(dot.x - state.cannonPos.x, dot.y - state.cannonPos.y) < 4) return;
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
      if (Math.hypot(c.cx - x, c.cy - y) <= CONFIG.HANDLE_RADIUS + 12) {
        state.editingCurve = c;
        return;
      }
    }
  }

  // Wall/curve drawing: start draw gesture from grid dot
  const dot = snapToDot(x, y);
  if (dot) {
    if (state.currentTool === 'wall' || state.currentTool === 'curve') {
      state.isDrawing = true;
      state.drawStart = { x: dot.x, y: dot.y };
      state.ghostPos = { x, y };
    }
  }
}

function onMove(x, y) {
  if (state.isAimingCannon) {
    // Stop aiming if firing sequence started mid-drag
    if (state.firingSequence !== null) {
      state.isAimingCannon = false;
      return;
    }
    updateCannonAngle(x, y);
    return;
  }
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
  if (state.isAimingCannon) {
    updateCannonAngle(x, y);
    const wasTutorialAim = state.tutorialStep === 2;
    state.isAimingCannon = false;
    if (wasTutorialAim) {
      // Tutorial complete — unlock everything
      state.tutorialStep = 0;
      state.tutorialToast = 3.0;
      removeTutorialLock();
      // Auto-switch to wall tool (bypass guard since tutorialStep is now 0)
      setTool('wall');
    }
    return;
  }
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
  canvas.addEventListener('mouseleave', e => { if(state.isDrawing||state.editingCurve||state.isAimingCannon){ const p=getPos(e); onEnd(p.x,p.y); } });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); const p=getPos(e); onStart(p.x,p.y); }, opts);
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); const p=getPos(e); onMove(p.x,p.y);  }, opts);
  canvas.addEventListener('touchend',   e => { e.preventDefault(); const p=getPos(e); onEnd(p.x,p.y);   }, opts);
  canvas.addEventListener('touchcancel',e => { state.isDrawing=false; state.editingCurve=null; state.drawStart=null; state.ghostPos=null; state.isAimingCannon=false; }, opts);
}
