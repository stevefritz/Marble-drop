// collision.js — segment reflection for ball-wall/curve collisions
'use strict';

import { WALL_HALF_W, MAX_BALL_SPEED, FLASH_DURATION } from '../config.js';
import { closestPtOnSeg } from '../utils/math.js';

export function reflectSeg(ball, ax, ay, bx, by, bumperFactor, flashTarget, tangBoost) {
  const cp = closestPtOnSeg(ball.x, ball.y, ax, ay, bx, by);
  const dx = ball.x - cp.x, dy = ball.y - cp.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const minD = ball.props.radius + WALL_HALF_W;
  if (dist >= minD || dist < 0.001) return false;

  const nx = dx/dist, ny = dy/dist;
  ball.x += nx * (minD - dist);
  ball.y += ny * (minD - dist);

  const dot = ball.vx*nx + ball.vy*ny;
  if (dot < 0) {
    const r = ball.props.restitution;
    ball.vx -= (1+r) * dot * nx;
    ball.vy -= (1+r) * dot * ny;
    ball.vx *= 0.995;
    ball.vy *= 0.995;
    if (bumperFactor > 1) {
      ball.vx *= bumperFactor;
      ball.vy *= bumperFactor;
    }
    if (tangBoost > 0) {
      const tx = -ny, ty = nx;
      const tangV = ball.vx * tx + ball.vy * ty;
      const dir = tangV >= 0 ? 1 : -1;
      ball.vx += tx * dir * tangBoost;
      ball.vy += ty * dir * tangBoost;
    }
    const spd = Math.hypot(ball.vx, ball.vy);
    if (spd > MAX_BALL_SPEED) {
      const sc = MAX_BALL_SPEED / spd;
      ball.vx *= sc; ball.vy *= sc;
    }
    if (flashTarget) flashTarget.flashTimer = FLASH_DURATION;
  }
  return true;
}
