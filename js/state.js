// state.js — single source of truth for all mutable game state
'use strict';

export const state = {
  canvas: null,
  ctx: null,
  dots: [],
  gridSpacing: 0,
  gridOffsetX: 0,
  gridOffsetY: 0,
  gridCols: 0,
  gridRows: 0,

  walls: [],
  curves: [],
  pegs: [],
  balls: [],

  score: 0,

  currentTool: 'cannon',
  currentLineColor: '#FFFFFF',

  ballWeight: 30,
  ballBounce: 60,

  cannonPos: null,
  cannonAngle: -Math.PI / 2,
  cannonPlaced: false,
  isAimingCannon: false,
  firingSequence: null,
  showAimHint: false,
  aimHintTimer: 0,

  ballCountIdx: 1,

  isDrawing: false,
  drawStart: null,
  ghostPos: null,
  editingCurve: null,

  lastTimestamp: 0,
  physicsAccum: 0,
  nextBallId: 0,

  rockets: [],
  rocketParticles: [],
  firstDropTime: null,
  magazineCount: 1,
  chargeStart: null,
  isFirstCharge: true,

  currentWeapon: 'rocket',
  laserHeat: 0,
  laserOverheated: false,
  laserOverheatTimer: 0,
  lastLaserFireTime: -999,
  laserBeam: null,
  laserSteamParticles: [],
  turretAngle: Math.PI / 2,
};
