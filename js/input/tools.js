// tools.js — UI tool/color/grid controls, ball spawning
'use strict';

import { state } from '../state.js';
import {
  BALL_PROPS, BALL_COUNTS, MAX_BALLS, LINE_COLORS
} from '../config.js';
import { soundEngine } from '../audio/sound.js';

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

export function setBallColor(color) {
  state.currentBallColor = color;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-' + color).classList.add('active');
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
  const count = BALL_COUNTS[state.ballCountIdx];
  const props = { ...BALL_PROPS[state.currentBallColor] };
  const totalW = state.gridSpacing * (state.gridCols - 1);
  const br = props.radius;

  for (let i = 0; i < count; i++) {
    if (state.balls.length >= MAX_BALLS) break;
    const t = count === 1 ? 0.5 : i / (count - 1);
    const jx = (Math.random() - 0.5) * state.gridSpacing * 0.9;
    const jy = (Math.random() - 0.5) * 18;
    const vy = 130 * props.speed + Math.random() * 40;
    const rawX = state.gridOffsetX + t * totalW + jx;
    state.balls.push({
      id: state.nextBallId++,
      x: Math.max(br, Math.min(state.canvas.width - br, rawX)),
      y: state.gridOffsetY - 28 + jy,
      vx: (Math.random() - 0.5) * 55,
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
    state.score = 0;
    document.getElementById('score-lcd').textContent = '00000';
  }
}
