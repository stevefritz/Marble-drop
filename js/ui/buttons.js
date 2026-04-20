// buttons.js — wire up all HTML button event listeners (replaces inline onclick)
'use strict';

import {
  setTool, setBallColor, setLineColor,
  changeBallCount, dropBalls, clearAll, toggleSound
} from '../input/tools.js';

export function setupButtons() {
  // Ball color buttons
  document.getElementById('btn-yellow').addEventListener('click', () => setBallColor('yellow'));
  document.getElementById('btn-red').addEventListener('click',    () => setBallColor('red'));
  document.getElementById('btn-blue').addEventListener('click',   () => setBallColor('blue'));
  document.getElementById('btn-green').addEventListener('click',  () => setBallColor('green'));

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
  // Clear all
  document.getElementById('clear-btn').addEventListener('click', () => clearAll());

  // Line color buttons
  document.getElementById('lc-white').addEventListener('click',  () => setLineColor('white'));
  document.getElementById('lc-red').addEventListener('click',    () => setLineColor('red'));
  document.getElementById('lc-blue').addEventListener('click',   () => setLineColor('blue'));
  document.getElementById('lc-green').addEventListener('click',  () => setLineColor('green'));
  document.getElementById('lc-orange').addEventListener('click', () => setLineColor('orange'));
  document.getElementById('lc-purple').addEventListener('click', () => setLineColor('purple'));

}
