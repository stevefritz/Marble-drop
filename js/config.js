// config.js — all constants, never mutated
'use strict';

export const BALL_PROPS = {
  yellow: { color: '#FFCC00', glow: '#FFE566', speed: 1.0, mass: 1.0,  restitution: 0.62, radius: 8 },
  red:    { color: '#FF3333', glow: '#FF8866', speed: 1.8, mass: 1.0,  restitution: 0.52, radius: 8 },
  blue:   { color: '#3366FF', glow: '#66AAFF', speed: 1.0, mass: 3.0,  restitution: 0.40, radius: 8 },
  green:  { color: '#22BB22', glow: '#66EE66', speed: 1.0, mass: 0.75, restitution: 0.96, radius: 8 },
};

export const GRAVITY        = 680;
export const FIXED_DT       = 1/60;
export const MAX_BALLS      = 200;
export const WALL_HALF_W    = 5;
export const PEG_RADIUS     = 14;
export const DOT_RADIUS     = 5;
export const HANDLE_RADIUS  = 11;
export const SNAP_RADIUS    = 42;
export const REST_SPEED     = 40;
export const REST_TIME      = 0.6;
export const BALL_COUNTS    = [1, 5, 10, 25, 50];

export const ROCKET_SPEED         = 700;
export const ROCKET_LOCK_DURATION = 5000;
export const ROCKET_RADIUS        = 14;
export const ROCKET_FADE_TIME     = 0.5;
export const ROCKET_LIFESPAN      = 10;
export const MAGAZINE_CAPACITY    = 3;
export const MAGAZINE_CHARGE_TIME = 5000;

export const LASER_HEAT_PER_SHOT      = 8;
export const LASER_HEAT_MAX           = 100;
export const LASER_HEAT_DECAY         = 8;
export const LASER_OVERHEAT_COOLDOWN  = 2;
export const LASER_FIRE_COOLDOWN      = 0.1;
export const LASER_BEAM_DURATION      = 0.2;

export const BUMPER_FACTOR_WALL  = 1.35;
export const BUMPER_FACTOR_CURVE = 1.25;
export const BUMPER_FACTOR_PEG   = 1.30;
export const CURVE_TANG_BOOST    = 50;
export const MAX_BALL_SPEED      = 900;
export const FLASH_DURATION      = 0.15;
export const FADE_DURATION       = 2.0;

export const LINE_COLORS = {
  white:  '#FFFFFF',
  red:    '#FF4444',
  blue:   '#4488FF',
  green:  '#44CC44',
  orange: '#FF8800',
  purple: '#CC44FF',
};

export const VERSION = 'v4.0';
