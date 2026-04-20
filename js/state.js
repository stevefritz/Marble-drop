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

  currentTool: 'wall',
  currentGridSize: 'medium',
  currentBallColor: 'yellow',
  currentLineColor: '#FFFFFF',

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
  magazineCount: 0,
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

  cannonPos: null,
  cannonAngle: -Math.PI / 4,
  cannonPlaced: false,
  cannonPower: 50,
  ballWeight: 50,
  ballBounce: 50,
  isAimingCannon: false,
};
