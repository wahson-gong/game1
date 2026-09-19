import './render';
import GameState from './state';
import Rabbit from './rabbit';
import Input from './input';
import AudioManager from './audio';
import Draw from './draw';
import { updateItems } from './items';
import { updatePeels } from './peels';
import { getBestScore, setBestScore } from './save';
import { GAME_SECONDS } from './constants';

const ctx = canvas.getContext('2d');

export default class Main {
  constructor() {
    this.state = new GameState();
    this.rabbit = new Rabbit();
    this.audio = new AudioManager();
    this.draw = new Draw(ctx);
    this.best = getBestScore();
    this.aniId = 0;

    this.input = new Input({
      getRabbit: () => this.rabbit,
      getState: () => this.state,
      hitUI: (x, y) => !!this.draw.hitUI(x, y, this.state.phase, this.state.statsExpanded),
      onUITap: (x, y) => this.handleUI(x, y),
    });

    this.rabbit.resetCenter();
    this.loop = this.loop.bind(this);
    this.aniId = requestAnimationFrame(this.loop);
  }

  handleUI(x, y) {
    const action = this.draw.hitUI(x, y, this.state.phase, this.state.statsExpanded);
    if (!action || action === 'overlay' || action === 'stats') return;

    if (action === 'score') {
      this.state.statsExpanded = !this.state.statsExpanded;
      return;
    }
    if (action === 'music') {
      this.audio.toggle();
      return;
    }
    if (action === 'pause') {
      this.setPaused(!this.state.paused);
      return;
    }
    if (action === 'start' || action === 'restart') {
      this.startGame();
      return;
    }
    if (action === 'resume') {
      this.setPaused(false);
    }
  }

  startGame() {
    this.state.tickEpoch += 1;
    this.state.reset();
    this.state.running = true;
    this.state.paused = false;
    this.state.phase = 'playing';
    this.state.spawnAcc = 0.8;
    this.state.lastTs = 0; // 下一帧用 rAF 时间戳初始化，避免与 Date.now 混用
    this.state.ignoreJumpUntil = 0;
    this.state.ignoreJumpFrames = 17; // ~280ms @60fps
    this.state.timeLeft = GAME_SECONDS;

    this.rabbit.resetCenter();
    this.rabbit.clearStun(this.state);
    this.audio.start();
  }

  setPaused(paused) {
    if (!this.state.running) return;
    this.state.paused = paused;
    this.state.phase = paused ? 'paused' : 'playing';
    if (paused) {
      this.audio.soften();
    } else {
      this.state.lastTs = 0; // 恢复时重置，防止一帧巨大 dt
      this.audio.start();
    }
  }

  endGame() {
    this.state.running = false;
    this.state.paused = false;
    this.state.phase = 'end';
    this.audio.soften();
    this.best = Math.max(this.state.score, getBestScore());
    setBestScore(this.best);
  }

  onCatch(type, score, x, y) {
    this.state.caught[type].count += 1;
    this.state.caught[type].score += score;
    this.state.score = Math.max(0, this.state.score + score);
    this.state.popups.push({ x, y, delta: score, life: 0.8 });

    if (type === 'strawberry') {
      this.state.mood = 'joy';
      this.state.moodTimer = 0.65;
      this.audio.playLaugh();
    } else if (type === 'cake') {
      this.rabbit.stunFromCake(this.state);
    } else {
      this.state.mood = score >= 0 ? 'happy' : 'sad';
      this.state.moodTimer = 0.45;
    }
  }

  update(dt, ts) {
    const state = this.state;
    if (!state.running || state.paused) return;

    if (state.ignoreJumpFrames > 0) {
      state.ignoreJumpFrames -= 1;
    }

    // 倒计时
    state.timeAcc += dt;
    if (state.timeAcc >= 1) {
      state.timeAcc -= 1;
      state.timeLeft -= 1;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        this.endGame();
        return;
      }
    }

    // 云漂动
    state.cloudOffset += 40 * dt;

    this.rabbit.update(dt, state, this.input.keys);
    updateItems(dt, ts, state, this.rabbit, this.onCatch.bind(this));
    updatePeels(dt, state, this.rabbit);

    for (let i = state.popups.length - 1; i >= 0; i -= 1) {
      state.popups[i].life -= dt;
      if (state.popups[i].life <= 0) state.popups.splice(i, 1);
    }

    if (state.moodTimer > 0) {
      state.moodTimer -= dt;
      if (state.moodTimer <= 0 && !state.isStunned()) state.mood = '';
    }
  }

  loop(ts) {
    const state = this.state;
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(0.05, (ts - state.lastTs) / 1000 || 0.016);

    if (state.phase === 'playing') {
      state.lastTs = ts;
      this.update(dt, ts);
    } else if (state.phase === 'paused') {
      state.lastTs = ts;
    } else if (state.phase === 'start' || state.phase === 'end') {
      state.lastTs = ts;
      // 开始页云也漂
      state.cloudOffset += 24 * dt;
    }

    this.draw.render(state, this.rabbit, this.audio.enabled, this.best);
    this.aniId = requestAnimationFrame(this.loop);
  }
}
