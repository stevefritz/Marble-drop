// main.js — entry point: init, resize, bootstrap
'use strict';

import { state } from './state.js';
import { BALL_COUNTS } from './config.js';
import { setupGrid } from './engine/grid.js';
import { setupInput } from './input/handler.js';
import { setupButtons } from './ui/buttons.js';
import { render } from './rendering/draw.js';

function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  let w = container.clientWidth;
  let h = container.clientHeight;
  if (!w || !h) {
    const palette = document.getElementById('tool-palette');
    const hopper  = document.getElementById('hopper-bar');
    w = window.innerWidth  - (palette.offsetWidth  || 164);
    h = window.innerHeight - (hopper.offsetHeight  || 74);
  }
  state.canvas.width  = Math.max(w, 200);
  state.canvas.height = Math.max(h, 200);
  setupGrid();
}

function init() {
  state.canvas = document.getElementById('gameCanvas');
  state.ctx = state.canvas.getContext('2d');

  resizeCanvas();
  setupInput();
  setupButtons();

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => { resizeCanvas(); });
    ro.observe(document.getElementById('canvas-container'));
  } else {
    window.addEventListener('resize', () => { resizeCanvas(); });
  }

  document.getElementById('count-display').textContent = BALL_COUNTS[state.ballCountIdx];

  state.lastTimestamp = performance.now();
  state.firstDropTime = performance.now();
  state.chargeStart = performance.now();
  requestAnimationFrame(render);
}

window.addEventListener('load', init);
