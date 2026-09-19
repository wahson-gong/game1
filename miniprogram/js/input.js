/**
 * 触摸输入：onTouchStart 起跳 + 设 targetX；onTouchMove 只改 targetX；
 * 滑行中忽略移动，仍允许跳。HUD/弹层区域不触发跳跃。
 */
export default class Input {
  /**
   * @param {object} opts
   * @param {() => import('./rabbit').default} opts.getRabbit
   * @param {() => import('./state').default} opts.getState
   * @param {(x:number, y:number) => boolean} opts.hitUI 点中 UI 返回 true
   * @param {(x:number, y:number) => void} [opts.onUITap]
   */
  constructor(opts) {
    this.getRabbit = opts.getRabbit;
    this.getState = opts.getState;
    this.hitUI = opts.hitUI;
    this.onUITap = opts.onUITap || (() => {});
    this.keys = new Set();

    wx.onTouchStart(this.onTouchStart.bind(this));
    wx.onTouchMove(this.onTouchMove.bind(this));

    if (typeof wx.onKeyDown === 'function') {
      wx.onKeyDown((e) => {
        if (e.key) this.keys.add(e.key);
      });
      wx.onKeyUp((e) => {
        if (e.key) this.keys.delete(e.key);
      });
    }
  }

  pointerToX(clientX) {
    const rabbit = this.getRabbit();
    return clientX - rabbit.width / 2;
  }

  onTouchStart(e) {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const x = touch.clientX;
    const y = touch.clientY;

    if (this.hitUI(x, y)) {
      this.onUITap(x, y);
      return;
    }

    const state = this.getState();
    const rabbit = this.getRabbit();

    if (!rabbit.isSliding() && !state.isStunned()) {
      rabbit.targetX = this.pointerToX(x);
    }

    rabbit.tryJump(
      state.running,
      state.paused,
      state.isStunned(),
      (state.ignoreJumpFrames || 0) > 0
    );
  }

  onTouchMove(e) {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const x = touch.clientX;
    const y = touch.clientY;
    if (this.hitUI(x, y)) return;

    const state = this.getState();
    const rabbit = this.getRabbit();
    if (!state.running || state.paused || state.isStunned() || rabbit.isSliding()) return;
    rabbit.targetX = this.pointerToX(x);
  }
}
