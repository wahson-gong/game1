import {
  RABBIT_WIDTH,
  RABBIT_HEIGHT,
  JUMP_VELOCITY,
  GRAVITY,
  MAX_AIR_JUMPS,
  SLIDE_SPEED,
  SLIDE_DISTANCE,
  SHAKE_SECONDS,
  FAINT_SECONDS,
  KEYBOARD_MOVE,
  clamp,
} from './constants';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render';

export default class Rabbit {
  constructor() {
    this.x = 0;
    this.targetX = 0;
    this.vx = 0;
    this.y = 0; // 距地面高度，向上为正
    this.jumpV = 0;
    this.airJumps = 0;
    this.slideRemain = 0;
    this.slideDir = 1;
  }

  get width() {
    return RABBIT_WIDTH;
  }

  get height() {
    return RABBIT_HEIGHT;
  }

  groundBottom() {
    return SCREEN_HEIGHT * 0.07;
  }

  /** 兔子脚底屏幕 Y（从上往下） */
  screenBottom() {
    return SCREEN_HEIGHT - this.groundBottom() - this.y;
  }

  /** 兔子顶部屏幕 Y */
  screenTop() {
    return this.screenBottom() - this.height;
  }

  isSliding() {
    return this.slideRemain > 0;
  }

  land() {
    this.y = 0;
    this.jumpV = 0;
    this.airJumps = 0;
  }

  clearSlide() {
    this.slideRemain = 0;
    this.targetX = this.x;
    this.vx = 0;
  }

  startSlide() {
    if (!this.isSliding()) {
      const fromSpeed = Math.sign(this.vx);
      const fromAim = Math.sign(this.targetX - this.x);
      this.slideDir = fromSpeed || fromAim || this.slideDir || 1;
    }
    this.slideRemain += SLIDE_DISTANCE;
  }

  tryJump(running, paused, stunned, ignoreJump) {
    if (!running || paused || stunned) return;
    if (ignoreJump) return;
    if (this.airJumps >= MAX_AIR_JUMPS) return;
    this.jumpV = JUMP_VELOCITY;
    this.airJumps += 1;
  }

  stunFromCake(state) {
    state.stunTimer = SHAKE_SECONDS + FAINT_SECONDS;
    this.vx = 0;
    this.targetX = this.x;
    this.clearSlide();
    this.land();
    state.mood = '';
    state.moodTimer = 0;
  }

  clearStun(state) {
    state.stunTimer = 0;
    state.mood = '';
    this.land();
    this.clearSlide();
    this.targetX = this.x;
    this.vx = 0;
  }

  setX(x) {
    const maxX = SCREEN_WIDTH - this.width;
    if ((x < 0 && this.vx < 0) || (x > maxX && this.vx > 0)) {
      this.vx *= 0.15;
    }
    this.x = clamp(x, 0, maxX);
    if (Math.abs(this.vx) < 0.4) this.vx = 0;
  }

  catchBox() {
    const top = this.screenTop();
    const bottom = this.screenBottom();
    return {
      left: this.x + this.width * 0.08,
      right: this.x + this.width - this.width * 0.08,
      top: top - 8 * (SCREEN_HEIGHT / 844),
      bottom: bottom - this.height * 0.06,
    };
  }

  footBox() {
    const bottom = this.screenBottom();
    return {
      left: this.x + this.width * 0.16,
      right: this.x + this.width - this.width * 0.16,
      top: bottom - this.height * 0.24,
      bottom,
    };
  }

  /**
   * @param {number} dt
   * @param {import('./state').default} state
   * @param {Set<string>} keys
   */
  update(dt, state, keys) {
    if (state.isStunned()) {
      this.vx = 0;
      this.targetX = this.x;
      state.stunTimer -= dt;
      if (state.stunTimer <= 0) this.clearStun(state);
      return;
    }

    const maxX = SCREEN_WIDTH - this.width;

    if (this.isSliding()) {
      const step = SLIDE_SPEED * dt;
      let nextX = this.x + this.slideDir * step;
      if (nextX < 0 || nextX > maxX) {
        this.slideDir *= -1;
        nextX = clamp(nextX, 0, maxX);
      }
      this.x = nextX;
      this.vx = this.slideDir * SLIDE_SPEED;
      this.slideRemain -= step;
      if (this.slideRemain <= 0) this.clearSlide();
    } else {
      if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
        this.targetX -= KEYBOARD_MOVE * dt;
      }
      if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
        this.targetX += KEYBOARD_MOVE * dt;
      }
      this.targetX = clamp(this.targetX, 0, maxX);

      const response = this.y > 1 ? 0.09 : 0.14;
      const omega = 2 / Math.max(response, 0.001);
      const accel = omega * omega * (this.targetX - this.x) - 2 * omega * this.vx;
      this.vx += accel * dt;
      this.setX(this.x + this.vx * dt);
    }

    if (this.y > 0 || this.jumpV !== 0) {
      this.jumpV -= GRAVITY * dt;
      this.y += this.jumpV * dt;
      if (this.y <= 0) {
        this.land();
      } else {
        const maxY = SCREEN_HEIGHT * 0.58;
        if (this.y > maxY) {
          this.y = maxY;
          if (this.jumpV > 0) this.jumpV = 0;
        }
      }
    }
  }

  resetCenter() {
    this.vx = 0;
    this.land();
    this.clearSlide();
    this.x = (SCREEN_WIDTH - this.width) / 2;
    this.targetX = this.x;
  }
}
