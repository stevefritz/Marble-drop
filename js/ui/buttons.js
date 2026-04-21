// buttons.js — wire up all HTML button event listeners (replaces inline onclick)
'use strict';

import { state } from '../state.js';
import {
  setTool, setLineColor, setBallWeight, setBallBounce,
  changeBallCount, dropBalls, clearAll, toggleSound, updateColorSwatch
} from '../input/tools.js';

export function applyTutorialLock() {
  document.getElementById('tool-palette').classList.add('tutorial-locked');
  document.getElementById('drop-btn').classList.add('tutorial-locked');
  document.getElementById('hopper-bar').classList.add('tutorial-locked');
}

export function removeTutorialLock() {
  document.getElementById('tool-palette').classList.remove('tutorial-locked');
  document.getElementById('drop-btn').classList.remove('tutorial-locked');
  document.getElementById('hopper-bar').classList.remove('tutorial-locked');
}

export function setupButtons() {
  // Ball property sliders
  document.getElementById('slider-weight').addEventListener('input', (e) => setBallWeight(e.target.value));
  document.getElementById('slider-bounce').addEventListener('input', (e) => setBallBounce(e.target.value));

  // Ball count buttons
  document.getElementById('btn-count-minus').addEventListener('click', () => changeBallCount(-1));
  document.getElementById('btn-count-plus').addEventListener('click',  () => changeBallCount(1));

  // Weapon toggle buttons (hopper bar)
  document.getElementById('weapon-rocket').addEventListener('click', () => setTool('rocket'));
  document.getElementById('weapon-laser').addEventListener('click',  () => setTool('laser'));

  // Sound toggle
  document.getElementById('mute-btn').addEventListener('click', () => toggleSound());

  // Fire button
  document.getElementById('drop-btn').addEventListener('click', () => dropBalls());

  // Tool palette
  document.getElementById('btn-cannon').addEventListener('click', () => setTool('cannon'));
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

  // Initialize color swatch
  updateColorSwatch();

  // Tutorial: start when welcome modal is dismissed
  document.addEventListener('tutorial-start', () => {
    state.tutorialStep = 1;
    applyTutorialLock();
  });
}
