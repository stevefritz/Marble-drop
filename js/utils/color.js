// color.js — hex color parsing and manipulation
'use strict';

export function parseHex(hex) {
  const n = parseInt(hex.replace('#',''), 16);
  return [(n>>16)&255, (n>>8)&255, n&255];
}

export function lighten(hex, amt) {
  const [r,g,b] = parseHex(hex);
  return `rgb(${Math.min(255,r+amt)},${Math.min(255,g+amt)},${Math.min(255,b+amt)})`;
}

export function darken(hex, amt) {
  const [r,g,b] = parseHex(hex);
  return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
}
