// debug.js — toggleable overlay panel for live-tuning CONFIG constants
'use strict';

import { CONFIG } from '../config.js';

const STORAGE_KEY = 'marble-drop-debug';

// Default values snapshot (for reset)
const DEFAULTS = Object.freeze({ ...CONFIG });

// Slider definitions grouped by category
const GROUPS = [
  {
    name: 'Physics',
    items: [
      { key: 'GRAVITY',        min: 0,    max: 2000, step: 10 },
      { key: 'MAX_BALL_SPEED', min: 200,  max: 3000, step: 50 },
      { key: 'FIXED_DT',      display: true },
      { key: 'REST_SPEED',    min: 5,    max: 200,  step: 5 },
      { key: 'REST_TIME',     min: 0.1,  max: 3.0,  step: 0.1 },
      { key: 'FADE_DURATION', min: 0.5,  max: 10,   step: 0.5 },
    ],
  },
  {
    name: 'Cannon',
    items: [
      { key: 'CANNON_BASE_SPEED', min: 100,  max: 2000, step: 50 },
      { key: 'CANNON_FIRE_RATE',  min: 50,   max: 1000, step: 50, label: 'Fire rate (ms)' },
    ],
  },
  {
    name: 'Collisions',
    items: [
      { key: 'BUMPER_FACTOR_WALL',  min: 1.0, max: 3.0, step: 0.05 },
      { key: 'BUMPER_FACTOR_CURVE', min: 1.0, max: 3.0, step: 0.05 },
      { key: 'BUMPER_FACTOR_PEG',   min: 1.0, max: 3.0, step: 0.05 },
      { key: 'CURVE_TANG_BOOST',    min: 0,   max: 200, step: 10 },
      { key: 'WALL_HALF_W',         min: 2,   max: 15,  step: 1 },
      { key: 'PEG_RADIUS',          min: 5,   max: 30,  step: 1 },
    ],
  },
  {
    name: 'Rockets',
    items: [
      { key: 'ROCKET_SPEED',         min: 200,  max: 1500,  step: 50 },
      { key: 'ROCKET_LIFESPAN',      min: 2,    max: 30,    step: 1 },
      { key: 'MAGAZINE_CHARGE_TIME', min: 1000, max: 30000, step: 1000 },
      { key: 'ROCKET_RADIUS',        min: 5,    max: 30,    step: 1 },
    ],
  },
  {
    name: 'Laser',
    items: [
      { key: 'LASER_HEAT_PER_SHOT',     min: 1,    max: 30,   step: 1 },
      { key: 'LASER_HEAT_MAX',           min: 20,   max: 200,  step: 10 },
      { key: 'LASER_HEAT_DECAY',         min: 1,    max: 30,   step: 1 },
      { key: 'LASER_OVERHEAT_COOLDOWN',  min: 0.5,  max: 10,   step: 0.5 },
      { key: 'LASER_FIRE_COOLDOWN',      min: 0.01, max: 1.0,  step: 0.01 },
    ],
  },
];

let panel = null;
let visible = false;

function formatValue(val) {
  if (typeof val === 'number') {
    return val % 1 === 0 ? String(val) : val.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  }
  return String(val);
}

function saveOverrides() {
  const overrides = {};
  for (const key of Object.keys(DEFAULTS)) {
    if (CONFIG[key] !== DEFAULTS[key]) {
      overrides[key] = CONFIG[key];
    }
  }
  if (Object.keys(overrides).length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const overrides = JSON.parse(raw);
    for (const [key, val] of Object.entries(overrides)) {
      if (key in CONFIG) CONFIG[key] = val;
    }
  } catch (_) {}
}

function createPanel() {
  const el = document.createElement('div');
  el.id = 'debug-panel';
  el.style.cssText = `
    position: fixed; bottom: 0; left: 0; z-index: 9998;
    width: 320px; max-height: 70vh; overflow-y: auto;
    background: rgba(22,33,62,0.95); border: 1px solid #0f3460;
    border-radius: 0 12px 0 0; font: 12px system-ui, sans-serif;
    color: #ccc; padding: 0; display: none; user-select: none;
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px; border-bottom: 1px solid #0f3460;
    position: sticky; top: 0; background: rgba(22,33,62,0.98); z-index: 1;
  `;
  const title = document.createElement('span');
  title.textContent = 'DEBUG';
  title.style.cssText = 'font-weight: bold; font-size: 13px; color: #6a8abf; letter-spacing: 1px;';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '\u00d7';
  closeBtn.style.cssText = `
    background: none; border: none; color: #6a8abf; font-size: 18px;
    cursor: pointer; padding: 0 4px; line-height: 1;
  `;
  closeBtn.addEventListener('click', () => togglePanel());
  header.appendChild(title);
  header.appendChild(closeBtn);
  el.appendChild(header);

  // Content
  const content = document.createElement('div');
  content.style.cssText = 'padding: 8px 12px;';

  for (const group of GROUPS) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 12px;';

    const groupHeader = document.createElement('div');
    groupHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;';
    const groupTitle = document.createElement('span');
    groupTitle.textContent = group.name;
    groupTitle.style.cssText = 'font-size: 11px; font-weight: bold; color: #4a7abf; text-transform: uppercase; letter-spacing: 0.5px;';
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.style.cssText = `
      background: rgba(100,140,200,0.15); border: 1px solid #2a4a7a;
      color: #6a8abf; font-size: 10px; padding: 2px 8px; border-radius: 4px; cursor: pointer;
    `;
    resetBtn.addEventListener('click', () => {
      for (const item of group.items) {
        if (item.display) continue;
        CONFIG[item.key] = DEFAULTS[item.key];
        const slider = el.querySelector(`[data-key="${item.key}"]`);
        const valSpan = el.querySelector(`[data-val="${item.key}"]`);
        if (slider) slider.value = DEFAULTS[item.key];
        if (valSpan) valSpan.textContent = formatValue(DEFAULTS[item.key]);
      }
      saveOverrides();
    });
    groupHeader.appendChild(groupTitle);
    groupHeader.appendChild(resetBtn);
    section.appendChild(groupHeader);

    for (const item of group.items) {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-bottom: 4px;';

      const label = document.createElement('span');
      label.textContent = item.label || item.key;
      label.style.cssText = 'font-size: 11px; color: #6a8abf; min-width: 100px; flex-shrink: 0;';

      if (item.display) {
        const valSpan = document.createElement('span');
        valSpan.textContent = formatValue(CONFIG[item.key]);
        valSpan.style.cssText = 'font-size: 12px; color: white; margin-left: auto;';
        row.appendChild(label);
        row.appendChild(valSpan);
      } else {
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = item.min;
        slider.max = item.max;
        slider.step = item.step;
        slider.value = CONFIG[item.key];
        slider.dataset.key = item.key;
        slider.style.cssText = 'flex: 1; min-width: 0; accent-color: #4a7abf;';

        const valSpan = document.createElement('span');
        valSpan.textContent = formatValue(CONFIG[item.key]);
        valSpan.dataset.val = item.key;
        valSpan.style.cssText = 'font-size: 12px; color: white; text-align: right; min-width: 50px;';

        slider.addEventListener('input', () => {
          const v = Number(slider.value);
          CONFIG[item.key] = v;
          valSpan.textContent = formatValue(v);
          saveOverrides();
        });

        row.appendChild(label);
        row.appendChild(slider);
        row.appendChild(valSpan);
      }

      section.appendChild(row);
    }

    content.appendChild(section);
  }

  // Master reset button
  const masterReset = document.createElement('button');
  masterReset.textContent = 'Reset All';
  masterReset.style.cssText = `
    width: 100%; padding: 8px; margin-top: 8px; border: none; border-radius: 6px;
    background: #cc2222; color: white; font-size: 12px; font-weight: bold;
    cursor: pointer; letter-spacing: 0.5px;
  `;
  masterReset.addEventListener('click', () => {
    for (const key of Object.keys(DEFAULTS)) {
      CONFIG[key] = DEFAULTS[key];
    }
    localStorage.removeItem(STORAGE_KEY);
    // Update all sliders
    for (const group of GROUPS) {
      for (const item of group.items) {
        if (item.display) continue;
        const slider = el.querySelector(`[data-key="${item.key}"]`);
        const valSpan = el.querySelector(`[data-val="${item.key}"]`);
        if (slider) slider.value = DEFAULTS[item.key];
        if (valSpan) valSpan.textContent = formatValue(DEFAULTS[item.key]);
      }
    }
  });
  content.appendChild(masterReset);

  el.appendChild(content);
  return el;
}

function togglePanel() {
  visible = !visible;
  if (panel) panel.style.display = visible ? 'block' : 'none';
}

export function initDebugPanel() {
  // Apply any persisted overrides silently on load
  loadOverrides();

  // Create panel DOM
  panel = createPanel();
  document.body.appendChild(panel);

  // Keyboard toggle: backtick or Ctrl+D
  document.addEventListener('keydown', (e) => {
    if (e.key === '`' || (e.ctrlKey && e.key === 'd')) {
      e.preventDefault();
      togglePanel();
    }
  });
}
