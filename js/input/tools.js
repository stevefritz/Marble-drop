// tools.js — UI tool/color/grid controls, ball spawning
'use strict';

import { state } from '../state.js';
import {
  BALL_COUNTS, MAX_BALLS, LINE_COLORS
} from '../config.js';
import { soundEngine } from '../audio/sound.js';
import { setupGrid } from '../engine/grid.js';

export function setTool(tool) {
  state.currentTool = tool;

  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.weapon-btn').forEach(b => b.classList.remove('active', 'laser-weapon-active'));

  if (tool === 'rocket' || tool === 'laser') {
    document.getElementById('btn-rocket').classList.add('active');
    if (tool === 'laser') {
      document.getElementById('weapon-laser').classList.add('active', 'laser-weapon-active');
      document.getElementById('heat-wrap').style.display = 'flex';
    } else {
      document.getElementById('weapon-rocket').classList.add('active');
      document.getElementById('heat-wrap').style.display = 'none';
    }
  } else {
    document.getElementById('btn-' + tool).classList.add('active');
    document.getElementById('heat-wrap').style.display = 'none';
  }

  state.isDrawing = false; state.drawStart = null; state.ghostPos = null; state.editingCurve = null;
}

export function setGridSize(size) {
  state.currentGridSize = size;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  const ids = { small: 'S', medium: 'M', large: 'L' };
  document.getElementById('size-' + ids[size]).classList.add('active');
  setupGrid();
}

export function computeBallColor(weight, bounce) {
  const w = weight / 100;
  const b = bounce / 100;
  const r  = Math.round(80 + (1 - b) * 175);
  const g  = Math.round(80 + b * 140 + (1 - w) * 40);
  const bl = Math.round(80 + w * 175);
  return { color: `rgb(${r},${g},${bl})`, glow: `rgba(${r},${g},${bl},0.6)` };
}

function updateSwatch() {
  const { color, glow } = computeBallColor(state.ballWeight, state.ballBounce);
  const swatch = document.getElementById('color-swatch');
  if (swatch) {
    swatch.style.background = color;
    swatch.style.boxShadow = `0 0 12px ${glow}, 0 0 4px ${glow}`;
  }
}

export function initBallProps() {
  updateSwatch();
}

export function setBallWeight(v) {
  state.ballWeight = v;
  updateSwatch();
}

export function setBallBounce(v) {
  state.ballBounce = v;
  updateSwatch();
}

export function setCannonPower(v) {
  state.cannonPower = v;
}

export function setLineColor(name) {
  state.currentLineColor = LINE_COLORS[name] || '#FFFFFF';
  document.querySelectorAll('.line-color-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('lc-' + name).classList.add('active');
}

export function changeBallCount(dir) {
  state.ballCountIdx = Math.max(0, Math.min(BALL_COUNTS.length - 1, state.ballCountIdx + dir));
  document.getElementById('count-display').textContent = BALL_COUNTS[state.ballCountIdx];
}

function spawnBalls() {
  if (!state.cannonPlaced || !state.cannonPos) return;

  const count = BALL_COUNTS[state.ballCountIdx];
  const { color, glow } = computeBallColor(state.ballWeight, state.ballBounce);
  const mass = 0.5 + (state.ballWeight / 100) * 3.5;
  const restitution = 0.3 + (state.ballBounce / 100) * 0.68;
  const props = { color, glow, mass, restitution, radius: 8 };

  // Power maps to 0.5x–3.0x of base 130 px/s
  const baseSpeed = 130 * (0.5 + (state.cannonPower / 100) * 2.5);

  for (let i = 0; i < count; i++) {
    if (state.balls.length >= MAX_BALLS) break;
    const spread = (Math.random() - 0.5) * (10 * Math.PI / 180);  // ±5° jitter
    const angle = state.cannonAngle + spread;
    const speedJitter = 1 + (Math.random() - 0.5) * 0.2;  // ±10% velocity
    const speed = baseSpeed * speedJitter;
    state.balls.push({
      id: state.nextBallId++,
      x: state.cannonPos.x,
      y: state.cannonPos.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      props,
      trail: [],
      atRest: false,
      restTimer: 0,
      fadeTimer: 0,
      opacity: 1.0,
      gcTimer: 0,
      gcFading: false,
      age: 0,
    });
  }
}

export function dropBalls() {
  if (state.balls.length >= MAX_BALLS) return;
  if (!state.firstDropTime) {
    state.firstDropTime = performance.now();
    state.chargeStart = state.firstDropTime;
    state.isFirstCharge = true;
  }
  soundEngine.playDrop();
  spawnBalls();
  const btn = document.getElementById('drop-btn');
  btn.style.transform = 'scale(0.90)';
  setTimeout(() => { btn.style.transform = ''; }, 160);
}

export function toggleSound() {
  const muted = soundEngine.toggleMute();
  const btn = document.getElementById('mute-btn');
  btn.textContent = muted ? '🔇' : '🔊';
  btn.classList.toggle('muted', muted);
}

export function clearAll() {
  if (state.walls.length + state.curves.length + state.pegs.length + state.balls.length === 0) return;
  if (confirm('Clear everything and start over?')) {
    state.walls = []; state.curves = []; state.pegs = []; state.balls = [];
    state.isDrawing = false; state.drawStart = null; state.ghostPos = null; state.editingCurve = null;
    state.rockets = []; state.rocketParticles = [];
    state.magazineCount = 0; state.chargeStart = null; state.isFirstCharge = true;
    state.firstDropTime = null;
    state.laserHeat = 0;
    state.laserOverheated = false;
    state.laserOverheatTimer = 0;
    state.lastLaserFireTime = -999;
    state.laserBeam = null;
    state.laserSteamParticles = [];
    state.turretAngle = Math.PI / 2;
    state.cannonPos = null;
    state.cannonPlaced = false;
    state.cannonAngle = -Math.PI / 4;
    state.isAimingCannon = false;
    state.score = 0;
    document.getElementById('score-lcd').textContent = '00000';
  }
}
