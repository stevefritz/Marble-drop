// sound.js — SoundEngine class and singleton instance
'use strict';

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
    this.activeCount = 0;
    this.MAX_CONCURRENT = 9;
    this.lastPlay = { wall: 0, peg: 0, curve: 0, ball: 0, rest: 0 };
    this.cooldowns = { wall: 30, peg: 20, curve: 30, ball: 50, rest: 100 };

    const init = () => this._ensureContext();
    document.addEventListener('mousedown',  init, { once: true });
    document.addEventListener('touchstart', init, { once: true, passive: true });
  }

  _ensureContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
  }

  _canPlay(type) {
    if (this.muted || !this.audioCtx || this.audioCtx.state === 'suspended') return false;
    if (this.activeCount >= this.MAX_CONCURRENT) return false;
    const nowMs = this.audioCtx.currentTime * 1000;
    if (nowMs - (this.lastPlay[type] || 0) < (this.cooldowns[type] || 30)) return false;
    this.lastPlay[type] = nowMs;
    return true;
  }

  _track(node) {
    this.activeCount++;
    node.onended = () => { this.activeCount = Math.max(0, this.activeCount - 1); };
  }

  playWallHit() {
    if (!this._canPlay('wall')) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.05);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.30, t + 0.002);
    gain.gain.setValueAtTime(0.30, t + 0.05);
    gain.gain.linearRampToValueAtTime(0, t + 0.07);
    osc.start(t); osc.stop(t + 0.08); this._track(osc);
  }

  playPegHit() {
    if (!this._canPlay('peg')) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const freq = 400 + Math.random() * 400;

    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.start(t); osc.stop(t + 0.05); this._track(osc);

    if (this.activeCount < this.MAX_CONCURRENT) {
      const osc2 = ctx.createOscillator(), gain2 = ctx.createGain();
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, t);
      gain2.gain.setValueAtTime(0.001, t);
      gain2.gain.linearRampToValueAtTime(0.08, t + 0.001);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc2.start(t); osc2.stop(t + 0.04); this._track(osc2);
    }
  }

  playCurveHit() {
    if (!this._canPlay('curve')) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.03);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.002);
    gain.gain.linearRampToValueAtTime(0, t + 0.04);
    osc.start(t); osc.stop(t + 0.05); this._track(osc);
  }

  playBallHit() {
    if (!this._canPlay('ball')) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const bufSize = Math.floor(ctx.sampleRate * 0.02);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 2000; bpf.Q.value = 1.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.02);
    src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
    src.start(t); this._track(src);
  }

  playDrop() {
    this._ensureContext();
    if (this.muted || !this.audioCtx) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.30);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.20, t + 0.01);
    gain.gain.setValueAtTime(0.20, t + 0.25);
    gain.gain.linearRampToValueAtTime(0, t + 0.32);
    osc.start(t); osc.stop(t + 0.35);
    this.activeCount++;
    osc.onended = () => { this.activeCount = Math.max(0, this.activeCount - 1); };
  }

  playRest() {
    if (!this._canPlay('rest')) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.005);
    gain.gain.linearRampToValueAtTime(0, t + 0.03);
    osc.start(t); osc.stop(t + 0.04); this._track(osc);
  }

  playRocketFire() {
    this._ensureContext();
    if (this.muted || !this.audioCtx) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.10);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.005);
    gain.gain.setValueAtTime(0.22, t + 0.08);
    gain.gain.linearRampToValueAtTime(0, t + 0.14);
    osc.start(t); osc.stop(t + 0.15); this._track(osc);
  }

  playRocketAbsorb(color) {
    if (!this._canPlay('peg')) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const freqMap = { '#FFCC00': 900, '#FF3333': 1200, '#3366FF': 600, '#22BB22': 750 };
    const freq = freqMap[color] || 800;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.06);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.30, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.start(t); osc.stop(t + 0.08); this._track(osc);
  }

  playRocketReady() {
    if (this.muted) return;
    this._ensureContext();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.06);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t); osc.stop(t + 0.28); this._track(osc);
  }

  playMagazineLoad() {
    if (this.muted) return;
    this._ensureContext();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const osc1 = ctx.createOscillator(), g1 = ctx.createGain();
    osc1.connect(g1); g1.connect(ctx.destination);
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(300, t);
    osc1.frequency.linearRampToValueAtTime(180, t + 0.015);
    g1.gain.setValueAtTime(0.001, t);
    g1.gain.linearRampToValueAtTime(0.15, t + 0.003);
    g1.gain.linearRampToValueAtTime(0, t + 0.02);
    osc1.start(t); osc1.stop(t + 0.025); this._track(osc1);
    const osc2 = ctx.createOscillator(), g2 = ctx.createGain();
    osc2.connect(g2); g2.connect(ctx.destination);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(480, t + 0.04);
    osc2.frequency.linearRampToValueAtTime(260, t + 0.06);
    g2.gain.setValueAtTime(0, t);
    g2.gain.setValueAtTime(0.001, t + 0.04);
    g2.gain.linearRampToValueAtTime(0.20, t + 0.043);
    g2.gain.linearRampToValueAtTime(0, t + 0.07);
    osc2.start(t + 0.04); osc2.stop(t + 0.08); this._track(osc2);
  }

  playMagazineEmpty() {
    this._ensureContext();
    if (this.muted || !this.audioCtx) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(55, t + 0.04);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.004);
    gain.gain.linearRampToValueAtTime(0, t + 0.06);
    osc.start(t); osc.stop(t + 0.07); this._track(osc);
  }

  playLaserFire() {
    this._ensureContext();
    if (this.muted || !this.audioCtx) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const ws = ctx.createWaveShaper();
    const n = 256, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = (Math.PI + 80) * x / (Math.PI + 80 * Math.abs(x));
    }
    ws.curve = curve;
    osc.connect(ws); ws.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.06);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.005);
    gain.gain.setValueAtTime(0.22, t + 0.04);
    gain.gain.linearRampToValueAtTime(0, t + 0.08);
    osc.start(t); osc.stop(t + 0.09); this._track(osc);
  }

  playOverheatWarning() {
    this._ensureContext();
    if (this.muted || !this.audioCtx) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const bufSize = Math.floor(ctx.sampleRate * 0.07);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 1400; bpf.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.10, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.07);
    src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
    src.start(t); this._track(src);
  }

  playOverheatTriggered() {
    this._ensureContext();
    if (this.muted || !this.audioCtx) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.30);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
    gain.gain.setValueAtTime(0.22, t + 0.25);
    gain.gain.linearRampToValueAtTime(0, t + 0.32);
    osc.start(t); osc.stop(t + 0.35); this._track(osc);
  }

  playLaserReady() {
    if (this.muted) return;
    this._ensureContext();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    for (const [freq, delay] of [[440, 0], [660, 0.08], [880, 0.16]]) {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);
      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(0.14, t + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.18);
      osc.start(t + delay); osc.stop(t + delay + 0.20); this._track(osc);
    }
  }

  playScoreUp() {
    if (this.muted || !this.audioCtx || this.audioCtx.state === 'suspended') return;
    const ctx = this.audioCtx, t = ctx.currentTime;
    const osc1 = ctx.createOscillator(), gain1 = ctx.createGain();
    osc1.connect(gain1); gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(400, t);
    gain1.gain.setValueAtTime(0.001, t);
    gain1.gain.linearRampToValueAtTime(0.18, t + 0.003);
    gain1.gain.setValueAtTime(0.18, t + 0.025);
    gain1.gain.linearRampToValueAtTime(0, t + 0.04);
    osc1.start(t); osc1.stop(t + 0.05); this._track(osc1);
    const osc2 = ctx.createOscillator(), gain2 = ctx.createGain();
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, t + 0.03);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.setValueAtTime(0.001, t + 0.03);
    gain2.gain.linearRampToValueAtTime(0.22, t + 0.033);
    gain2.gain.setValueAtTime(0.22, t + 0.055);
    gain2.gain.linearRampToValueAtTime(0, t + 0.07);
    osc2.start(t + 0.03); osc2.stop(t + 0.08); this._track(osc2);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export const soundEngine = new SoundEngine();
