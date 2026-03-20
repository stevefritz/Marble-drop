// hud.js — magazine display, heat gauge, score
'use strict';

import { state } from '../state.js';
import {
  MAGAZINE_CAPACITY, ROCKET_LOCK_DURATION, MAGAZINE_CHARGE_TIME,
  LASER_HEAT_MAX
} from '../config.js';
import { soundEngine } from '../audio/sound.js';

export function addScore(pts) {
  state.score += pts;
  const lcd = document.getElementById('score-lcd');
  lcd.textContent = String(state.score).padStart(5, '0');
  lcd.classList.remove('plink');
  void lcd.offsetWidth;
  lcd.classList.add('plink');
  soundEngine.playScoreUp();
}

export function flashMagazineEmpty() {
  for (let i = 0; i < MAGAZINE_CAPACITY; i++) {
    const slot = document.getElementById('mag-' + i);
    if (!slot) continue;
    slot.classList.remove('empty-flash');
    void slot.offsetWidth;
    slot.classList.add('empty-flash');
    setTimeout(() => slot.classList.remove('empty-flash'), 500);
  }
}

export function updateMagazine() {
  const now = performance.now();

  if (state.firstDropTime && state.chargeStart !== null && state.magazineCount < MAGAZINE_CAPACITY) {
    const chargeTime = state.isFirstCharge ? ROCKET_LOCK_DURATION : MAGAZINE_CHARGE_TIME;
    const elapsed = now - state.chargeStart;
    if (elapsed >= chargeTime) {
      state.magazineCount++;
      state.isFirstCharge = false;
      soundEngine.playMagazineLoad();
      if (state.magazineCount < MAGAZINE_CAPACITY) {
        state.chargeStart = now;
      } else {
        state.chargeStart = null;
      }
    }
  }

  const btn   = document.getElementById('btn-rocket');
  const label = document.getElementById('rocket-label');
  if (state.currentTool === 'laser') {
    label.textContent = state.laserOverheated ? '⚡ COOLING' : '⚡ Laser';
  } else {
    label.textContent = `🚀 ${state.magazineCount}/${MAGAZINE_CAPACITY}`;
  }
  btn.style.opacity = '1.0';
  btn.style.cursor  = 'pointer';

  const chargeTime = state.isFirstCharge ? ROCKET_LOCK_DURATION : MAGAZINE_CHARGE_TIME;
  const chargePct  = (state.firstDropTime && state.chargeStart !== null)
    ? Math.min(1, (now - state.chargeStart) / chargeTime)
    : 0;

  for (let i = 0; i < MAGAZINE_CAPACITY; i++) {
    const slot = document.getElementById('mag-' + i);
    const fill = document.getElementById('mag-fill-' + i);
    if (!slot || !fill) continue;

    const isCharged  = i < state.magazineCount;
    const isCharging = !isCharged && i === state.magazineCount && state.firstDropTime && state.chargeStart !== null;

    slot.classList.toggle('charged',  isCharged);
    slot.classList.toggle('charging', isCharging);

    if (isCharging) {
      fill.style.height = `${chargePct * 100}%`;
    } else {
      fill.style.height = '0%';
    }
  }
}

export function updateHeatUI() {
  if (state.currentTool !== 'laser') return;
  const heatBar = document.getElementById('heat-bar-inner');
  const heatLabel = document.getElementById('heat-label-text');
  if (!heatBar) return;

  const pct = state.laserHeat / LASER_HEAT_MAX;
  heatBar.style.width = `${pct * 100}%`;

  let color, labelText;
  if (state.laserOverheated) {
    const flash = Math.sin(Date.now() * 0.012) > 0;
    color = flash ? '#FF2200' : '#881100';
    labelText = 'OVERHEAT';
  } else if (pct > 0.85) {
    color = '#FF2200';
    labelText = 'CRITICAL';
  } else if (pct > 0.65) {
    color = '#FF6600';
    labelText = 'HOT';
  } else if (pct > 0.40) {
    color = '#FFCC00';
    labelText = 'WARM';
  } else {
    color = '#00CC44';
    labelText = 'Heat';
  }
  heatBar.style.background = color;
  if (heatLabel) heatLabel.textContent = labelText;
}
