import { isMusicOn, setMusicOn } from './save';

/**
 * 优先 wx.createWebAudioContext 复刻 H5 旋律/笑声；不可用则静音但保留开关。
 */
export default class AudioManager {
  constructor() {
    this.enabled = isMusicOn();
    this.playing = false;
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.loopTimer = 0;
    this.available = typeof wx.createWebAudioContext === 'function';

    this.melody = [
      [0, 523.25, 0.28],
      [0.5, 659.25, 0.28],
      [1, 783.99, 0.28],
      [1.5, 659.25, 0.28],
      [2, 587.33, 0.28],
      [2.5, 698.46, 0.28],
      [3, 783.99, 0.55],
      [4, 659.25, 0.28],
      [4.5, 783.99, 0.28],
      [5, 880.0, 0.28],
      [5.5, 783.99, 0.28],
      [6, 659.25, 0.28],
      [6.5, 587.33, 0.28],
      [7, 523.25, 0.7],
    ];
    this.bass = [
      [0, 130.81, 0.9],
      [2, 174.61, 0.9],
      [4, 196.0, 0.9],
      [6, 130.81, 0.9],
    ];
  }

  ensure() {
    if (!this.available) return false;
    if (!this.ctx) {
      try {
        this.ctx = wx.createWebAudioContext();
        this.master = this.ctx.createGain();
        this.sfx = this.ctx.createGain();
        this.master.gain.value = 0;
        this.sfx.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
        this.sfx.connect(this.ctx.destination);
      } catch (e) {
        this.available = false;
        return false;
      }
    }
    return true;
  }

  playTone(freq, start, duration, type, volume, dest) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  scheduleLoop() {
    if (!this.ctx || !this.playing || !this.enabled) return;
    const start = this.ctx.currentTime + 0.04;
    this.melody.forEach(([time, freq, duration]) => {
      this.playTone(freq, start + time, duration, 'triangle', 0.2, this.master);
    });
    this.bass.forEach(([time, freq, duration]) => {
      this.playTone(freq, start + time, duration, 'sine', 0.1, this.master);
    });
    this.loopTimer = setTimeout(() => this.scheduleLoop(), 8000);
  }

  start() {
    if (!this.ensure()) return;
    if (this.ctx.resume) this.ctx.resume();
    if (!this.enabled) {
      this.master.gain.setValueAtTime(0, this.ctx.currentTime);
      this.playing = false;
      return;
    }
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(0.18, this.ctx.currentTime);
    if (!this.playing) {
      this.playing = true;
      this.scheduleLoop();
    }
  }

  soften() {
    if (!this.ctx || !this.master) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(
      this.enabled ? 0.08 : 0,
      this.ctx.currentTime + 0.4
    );
  }

  toggle() {
    this.enabled = !this.enabled;
    setMusicOn(this.enabled);
    if (!this.ensure()) return this.enabled;
    if (this.ctx.resume) this.ctx.resume();
    clearTimeout(this.loopTimer);
    if (this.enabled) {
      this.playing = false;
      this.start();
    } else {
      this.playing = false;
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  playLaugh() {
    if (!this.ensure()) return;
    if (this.ctx.resume) this.ctx.resume();
    const start = this.ctx.currentTime;
    const giggles = [
      [0.0, 620, 0.09],
      [0.11, 780, 0.08],
      [0.21, 860, 0.1],
      [0.34, 720, 0.14],
    ];
    giggles.forEach(([time, freq, duration]) => {
      this.playTone(freq, start + time, duration, 'triangle', 0.28, this.sfx);
      this.playTone(freq * 0.5, start + time, duration, 'sine', 0.12, this.sfx);
    });
  }
}
