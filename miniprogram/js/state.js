import { GAME_SECONDS, FAINT_SECONDS, createCaught } from './constants';

/**
 * 游戏运行时状态（分数、倒计时、明细、击晕、滑行等）
 */
export default class GameState {
  constructor() {
    this.reset();
    this.phase = 'start'; // start | playing | paused | end
    this.statsExpanded = false; // 得分明细默认收起
  }

  reset() {
    this.running = false;
    this.paused = false;
    this.score = 0;
    this.timeLeft = GAME_SECONDS;
    this.timeAcc = 0;
    this.spawnAcc = 0;
    this.moodTimer = 0;
    this.mood = '';
    this.stunTimer = 0;
    this.ignoreJumpUntil = 0;
    this.ignoreJumpFrames = 0;
    this.lastTs = 0;
    this.tickEpoch = 0;
    this.items = [];
    this.peels = [];
    this.popups = [];
    this.caught = createCaught();
    this.cloudOffset = 0;
  }

  isStunned() {
    return this.stunTimer > 0;
  }

  isShaking() {
    return this.stunTimer > FAINT_SECONDS;
  }

  isFainting() {
    return this.stunTimer > 0 && this.stunTimer <= FAINT_SECONDS;
  }
}
