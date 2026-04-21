// tools.js — UI tool/color/grid controls, ball spawning, cannon placement
'use strict';

import { state } from '../state.js';
import {
  BALL_COUNTS, MAX_BALLS, LINE_COLORS
} from '../config.js';
import { soundEngine } from '../audio/sound.js';
import { snapToDot } from '../engine/grid.js';

export function computeBallColor(weight, bounce) {
  const w = weight / 100;
  const b = bounce / 100;
  const r = Math.round(80 + (1 - b) * 175);
  const g = Math.round(80 + b * 140 + (1 - w) * 40);
  const bl = Math.round(80 + w * 175);
  return `rgb(${r},${g},${bl})`;
}

export function updateColorSwatch() {
  const swatch = document.getElementById('color-swatch');
  if (!swatch) return;
  const color = computeBallColor(state.ballWeight, state.ballBounce);
  swatch.style.background = color;
  swatch.style.boxShadow = `0 0 12px ${color}`;
}

export function setBallWeight(v) {
  state.ballWeight = Math.max(0, Math.min(100, Number(v)));
  updateColorSwatch();
}

export function setBallBounce(v) {
  state.ballBounce = Math.max(0, Math.min(100, Number(v)));
  updateColorSwatch();
}

export function setTool(tool) {
  state.currentTool = tool;

  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.weapon-btn').forEach(b => b.classList.remove('active', 'laser-weapon-active'));

  if (tool === 'rocket' || tool === 'laser') {
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

export function setLineColor(name) {
  state.currentLineColor = LINE_COLORS[name] || '#FFFFFF';
  document.querySelectorAll('.line-color-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('lc-' + name).classList.add('active');
}

export function changeBallCount(dir) {
  state.ballCountIdx = Math.max(0, Math.min(BALL_COUNTS.length - 1, state.ballCountIdx + dir));
  document.getElementById('count-display').textContent = BALL_COUNTS[state.ballCountIdx];
}

export function placeCannon(x, y) {
  const dot = snapToDot(x, y);
  if (!dot) return false;
  // Don't place on existing pegs
  if (state.pegs.some(p => Math.hypot(p.x - dot.x, p.y - dot.y) < 4)) return false;
  state.cannonPos = { x: dot.x, y: dot.y };
  state.cannonPlaced = true;
  return true;
}

const CANNON_BASE_SPEED = 450;

function spawnOneBall() {
  if (!state.cannonPlaced || !state.cannonPos) return;
  if (state.balls.length >= MAX_BALLS) return;

  const weight = state.ballWeight;
  const bounce = state.ballBounce;
  const mass = 0.5 + (weight / 100) * 3.5;
  const restitution = 0.3 + (bounce / 100) * 0.68;
  const color = computeBallColor(weight, bounce);

  const props = {
    color,
    glow: color,
    speed: 1.0,
    mass,
    restitution,
    radius: 8,
  };

  // ±3° angle jitter
  const jitterAngle = (Math.random() - 0.5) * (6 * Math.PI / 180);
  const angle = state.cannonAngle + jitterAngle;

  const vx = Math.cos(angle) * CANNON_BASE_SPEED;
  const vy = Math.sin(angle) * CANNON_BASE_SPEED;

  state.balls.push({
    id: state.nextBallId++,
    x: state.cannonPos.x,
    y: state.cannonPos.y,
    vx,
    vy,
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

  soundEngine.playDrop();
}

export function dropBalls() {
  if (!state.cannonPlaced || !state.cannonPos) return;
  if (state.balls.length >= MAX_BALLS) return;

  // Cancel any active firing sequence and start fresh
  if (state.firingSequence !== null) {
    clearInterval(state.firingSequence);
    state.firingSequence = null;
  }

  // Lock cannon — stop any in-progress aiming
  state.isAimingCannon = false;

  if (!state.firstDropTime) {
    state.firstDropTime = performance.now();
    state.chargeStart = state.firstDropTime;
    state.isFirstCharge = true;
  }

  const btn = document.getElementById('drop-btn');
  btn.style.transform = 'scale(0.90)';
  setTimeout(() => { btn.style.transform = ''; }, 160);

  const total = BALL_COUNTS[state.ballCountIdx];
  let fired = 0;

  // Fire first ball immediately
  spawnOneBall();
  fired++;

  if (fired >= total) return;

  // Fire remaining balls at 200ms intervals (5/sec)
  state.firingSequence = setInterval(() => {
    if (fired >= total || state.balls.length >= MAX_BALLS) {
      clearInterval(state.firingSequence);
      state.firingSequence = null;
      return;
    }
    spawnOneBall();
    fired++;
    if (fired >= total) {
      clearInterval(state.firingSequence);
      state.firingSequence = null;
    }
  }, 200);
}

export function toggleSound() {
  const muted = soundEngine.toggleMute();
  const btn = document.getElementById('mute-btn');
  btn.textContent = muted ? '🔇' : '🔊';
  btn.classList.toggle('muted', muted);
}

export function clearAll() {
  if (state.walls.length + state.curves.length + state.pegs.length + state.balls.length === 0 && !state.cannonPlaced) return;
  if (confirm('Clear everything and start over?')) {
    if (state.firingSequence !== null) {
      clearInterval(state.firingSequence);
      state.firingSequence = null;
    }
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
    state.score = 0;
    state.cannonPos = null;
    state.cannonPlaced = false;
    state.cannonAngle = -Math.PI / 2;
    state.isAimingCannon = false;
    document.getElementById('score-lcd').textContent = '00000';
    setTool('cannon');
  }
}
