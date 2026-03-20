// grid.js — grid setup and dot snapping
'use strict';

import { state } from '../state.js';
import { SNAP_RADIUS } from '../config.js';

export function setupGrid() {
  const padX = 12;
  const padY = 22;
  const availW = state.canvas.width  - padX * 2;
  const availH = state.canvas.height - padY * 2;
  const targetSpacing = { small: 80, medium: 55, large: 38 }[state.currentGridSize];
  state.gridCols = Math.max(4, Math.round(availW / targetSpacing) + 1);
  state.gridRows = Math.max(3, Math.round(availH / targetSpacing) + 1);
  state.gridSpacing = Math.min(availW / (state.gridCols - 1), availH / (state.gridRows - 1));
  state.gridOffsetX = (state.canvas.width  - state.gridSpacing * (state.gridCols - 1)) / 2;
  state.gridOffsetY = (state.canvas.height - state.gridSpacing * (state.gridRows - 1)) / 2;

  state.dots = [];
  for (let r = 0; r < state.gridRows; r++) {
    for (let c = 0; c < state.gridCols; c++) {
      state.dots.push({ x: state.gridOffsetX + c * state.gridSpacing, y: state.gridOffsetY + r * state.gridSpacing });
    }
  }
}

export function snapToDot(x, y) {
  const snapR = Math.min(SNAP_RADIUS, state.gridSpacing * 0.5);
  let best = null, bestDist = snapR;
  for (const d of state.dots) {
    const dist = Math.hypot(d.x - x, d.y - y);
    if (dist < bestDist) { bestDist = dist; best = d; }
  }
  return best;
}
