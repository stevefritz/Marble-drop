// buttons.js — wire up all HTML button event listeners (replaces inline onclick)
'use strict';

import {
  setTool, setLineColor, setGridSize,
  changeBallCount, dropBalls, clearAll, toggleSound,
  setBallWeight, setBallBounce, setCannonPower
} from '../input/tools.js';

export function setupButtons() {
  // Ball property sliders
  document.getElementById('slider-weight').addEventListener('input', e => setBallWeight(Number(e.target.value)));
  document.getElementById('slider-bounce').addEventListener('input', e => setBallBounce(Number(e.target.value)));
  document.getElementById('slider-power').addEventListener('input',  e => setCannonPower(Number(e.target.value)));

  // Ball count buttons
  document.getElementById('btn-count-minus').addEventListener('click', () => changeBallCount(-1));
  document.getElementById('btn-count-plus').addEventListener('click',  () => changeBallCount(1));

  // Weapon toggle buttons (hopper bar)
  document.getElementById('weapon-rocket').addEventListener('click', () => setTool('rocket'));
  document.getElementById('weapon-laser').addEventListener('click',  () => setTool('laser'));

  // Sound toggle
  document.getElementById('mute-btn').addEventListener('click', () => toggleSound());

  // Drop button
  document.getElementById('drop-btn').addEventListener('click', () => dropBalls());

  // Tool palette
  document.getElementById('btn-wall').addEventListener('click',   () => setTool('wall'));
  document.getElementById('btn-curve').addEventListener('click',  () => setTool('curve'));
  document.getElementById('btn-peg').addEventListener('click',    () => setTool('peg'));
  document.getElementById('btn-eraser').addEventListener('click', () => setTool('eraser'));
  document.getElementById('btn-cannon').addEventListener('click', () => setTool('cannon'));
  document.getElementById('btn-rocket').addEventListener('click', () => setTool('rocket'));

  // Clear all
  document.getElementById('clear-btn').addEventListener('click', () => clearAll());

  // Line color buttons
  document.getElementById('lc-white').addEventListener('click',  () => setLineColor('white'));
  document.getElementById('lc-red').addEventListener('click',    () => setLineColor('red'));
  document.getElementById('lc-blue').addEventListener('click',   () => setLineColor('blue'));
  document.getElementById('lc-green').addEventListener('click',  () => setLineColor('green'));
  document.getElementById('lc-orange').addEventListener('click', () => setLineColor('orange'));
  document.getElementById('lc-purple').addEventListener('click', () => setLineColor('purple'));

  // Grid size buttons
  document.getElementById('size-S').addEventListener('click', () => setGridSize('small'));
  document.getElementById('size-M').addEventListener('click', () => setGridSize('medium'));
  document.getElementById('size-L').addEventListener('click', () => setGridSize('large'));
}
