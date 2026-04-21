// config.js — all tunable constants in a single mutable object for runtime debug access
'use strict';

export const BALL_PROPS = {
  yellow: { color: '#FFCC00', glow: '#FFE566', speed: 1.0, mass: 1.0,  restitution: 0.62, radius: 8 },
  red:    { color: '#FF3333', glow: '#FF8866', speed: 1.8, mass: 1.0,  restitution: 0.52, radius: 8 },
  blue:   { color: '#3366FF', glow: '#66AAFF', speed: 1.0, mass: 3.0,  restitution: 0.40, radius: 8 },
  green:  { color: '#22BB22', glow: '#66EE66', speed: 1.0, mass: 0.75, restitution: 0.96, radius: 8 },
};

export const CONFIG = {
  GRAVITY: 680,
  FIXED_DT: 1/60,
  MAX_BALLS: 200,
  WALL_HALF_W: 5,
  PEG_RADIUS: 14,
  DOT_RADIUS: 5,
  HANDLE_RADIUS: 11,
  SNAP_RADIUS: 42,
  REST_SPEED: 40,
  REST_TIME: 0.6,

  ROCKET_SPEED: 700,
  ROCKET_LOCK_DURATION: 5000,
  ROCKET_RADIUS: 14,
  ROCKET_FADE_TIME: 0.5,
  ROCKET_LIFESPAN: 10,
  MAGAZINE_CAPACITY: 3,
  MAGAZINE_CHARGE_TIME: 5000,

  LASER_HEAT_PER_SHOT: 8,
  LASER_HEAT_MAX: 100,
  LASER_HEAT_DECAY: 8,
  LASER_OVERHEAT_COOLDOWN: 2,
  LASER_FIRE_COOLDOWN: 0.1,
  LASER_BEAM_DURATION: 0.2,

  BUMPER_FACTOR_WALL: 1.35,
  BUMPER_FACTOR_CURVE: 1.25,
  BUMPER_FACTOR_PEG: 1.30,
  CURVE_TANG_BOOST: 50,
  MAX_BALL_SPEED: 1200,
  FLASH_DURATION: 0.15,
  FADE_DURATION: 2.0,

  CANNON_BASE_SPEED: 850,
  CANNON_FIRE_RATE: 200,
};

export const BALL_COUNTS = [1, 5, 10, 25, 50];

export const LINE_COLORS = {
  white:  '#FFFFFF',
  red:    '#FF4444',
  blue:   '#4488FF',
  green:  '#44CC44',
  orange: '#FF8800',
  purple: '#CC44FF',
};

export const VERSION = 'v4.0';
