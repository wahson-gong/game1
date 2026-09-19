import { SCREEN_WIDTH, SCREEN_HEIGHT, SCALE } from './render';
import {
  RABBIT_WIDTH,
  RABBIT_HEIGHT,
  ITEM_WIDTH,
  ITEM_HEIGHT,
  PEEL_WIDTH,
  PEEL_HEIGHT,
  STAT_TYPES,
  STAT_LABELS,
  ITEM_TYPES,
} from './constants';

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(x, y, Math.max(rx, ry), 0, Math.PI * 2);
  }
}

function getMenuSafeTop() {
  try {
    const rect = wx.getMenuButtonBoundingClientRect();
    if (rect && rect.bottom) return rect.bottom + 8;
  } catch (e) {
    // ignore
  }
  return 48 * SCALE;
}

export default class Draw {
  constructor(ctx) {
    this.ctx = ctx;
    this.ui = this.buildUILayout();
  }

  buildUILayout() {
    const pad = 12 * SCALE;
    const safeTop = getMenuSafeTop();
    const icon = 40 * SCALE;
    const iconGap = 8 * SCALE;
    const iconY = safeTop + 64 * SCALE;
    const pauseX = SCREEN_WIDTH - pad - icon;
    const musicX = pauseX - iconGap - icon;

    return {
      pad,
      safeTop,
      scoreCard: { x: pad, y: safeTop, w: 100 * SCALE, h: 62 * SCALE },
      statsCard: {
        x: pad,
        y: safeTop + 70 * SCALE,
        w: 210 * SCALE,
        h: 118 * SCALE,
      },
      timeCard: {
        x: SCREEN_WIDTH - pad - 100 * SCALE,
        y: safeTop,
        w: 100 * SCALE,
        h: 56 * SCALE,
      },
      musicBtn: {
        x: musicX,
        y: iconY,
        w: icon,
        h: icon,
      },
      pauseBtn: {
        x: pauseX,
        y: iconY,
        w: icon,
        h: icon,
      },
      overlayBtn: {
        w: 200 * SCALE,
        h: 48 * SCALE,
      },
    };
  }

  hitTestRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  /**
   * @returns {'music'|'pause'|'score'|'stats'|'start'|'resume'|'restart'|'overlay'|null}
   */
  hitUI(x, y, phase, statsExpanded = false) {
    const ui = this.ui;
    if (this.hitTestRect(x, y, ui.musicBtn)) return 'music';
    if (this.hitTestRect(x, y, ui.scoreCard)) return 'score';
    if (statsExpanded && this.hitTestRect(x, y, ui.statsCard)) return 'stats';

    if (phase === 'playing' || phase === 'paused') {
      if (this.hitTestRect(x, y, ui.pauseBtn)) return 'pause';
    }

    if (phase === 'start' || phase === 'paused' || phase === 'end') {
      const btn = this.overlayPrimaryBtn(phase);
      if (this.hitTestRect(x, y, btn)) {
        if (phase === 'start') return 'start';
        if (phase === 'paused') return 'resume';
        if (phase === 'end') return 'restart';
      }
      // 点在遮罩上不算游戏跳跃
      return 'overlay';
    }
    return null;
  }

  overlayPrimaryBtn(phase) {
    return this.getOverlayLayout(phase).button;
  }

  getOverlayLayout(phase) {
    const panelW = Math.min(360 * SCALE, SCREEN_WIDTH - 32 * SCALE);
    const panelH = phase === 'start' ? 500 * SCALE : phase === 'end' ? 286 * SCALE : 208 * SCALE;
    const x = (SCREEN_WIDTH - panelW) / 2;
    const y = Math.max(16 * SCALE, (SCREEN_HEIGHT - panelH) / 2 - 8 * SCALE);
    const btnW = 168 * SCALE;
    const btnH = 48 * SCALE;
    return {
      x,
      y,
      w: panelW,
      h: panelH,
      button: {
        x: x + (panelW - btnW) / 2,
        y: y + panelH - 28 * SCALE - btnH,
        w: btnW,
        h: btnH,
      },
    };
  }

  drawPanel(x, y, w, h) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
    ctx.shadowBlur = 32 * SCALE;
    ctx.shadowOffsetY = 16 * SCALE;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
    roundRect(ctx, x, y, w, h, 32 * SCALE);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5 * SCALE;
    roundRect(ctx, x, y, w, h, 32 * SCALE);
    ctx.stroke();
  }

  drawPrimaryBtn(r, label) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
    ctx.shadowBlur = 16 * SCALE;
    ctx.shadowOffsetY = 8 * SCALE;
    ctx.fillStyle = '#1d1d1f';
    roundRect(ctx, r.x, r.y, r.w, r.h, 999);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${17 * SCALE}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1 * SCALE);
    ctx.textBaseline = 'alphabetic';
  }

  clear() {
    this.ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  drawBackground(state) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    g.addColorStop(0, '#7ec8ff');
    g.addColorStop(0.68, '#d7f3ff');
    g.addColorStop(1, '#c8efb4');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // sun
    const sx = SCREEN_WIDTH * 0.82;
    const sy = SCREEN_HEIGHT * 0.12;
    const sr = 39 * SCALE;
    const sg = ctx.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, 2, sx, sy, sr);
    sg.addColorStop(0, '#fff7c8');
    sg.addColorStop(0.58, '#ffd35a');
    sg.addColorStop(1, '#ffb347');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();

    // clouds
    this.drawCloud(state.cloudOffset % (SCREEN_WIDTH + 200), SCREEN_HEIGHT * 0.12, 1);
    this.drawCloud((state.cloudOffset * 0.7 + 180) % (SCREEN_WIDTH + 200), SCREEN_HEIGHT * 0.22, 0.75);
    this.drawCloud((state.cloudOffset * 0.85 + 320) % (SCREEN_WIDTH + 200), SCREEN_HEIGHT * 0.08, 1.15);

    // hills
    ctx.fillStyle = '#8ed37a';
    ellipse(ctx, SCREEN_WIDTH * 0.18, SCREEN_HEIGHT * 0.88, SCREEN_WIDTH * 0.35, SCREEN_HEIGHT * 0.12);
    ctx.fill();
    ctx.fillStyle = '#97db84';
    ellipse(ctx, SCREEN_WIDTH * 0.62, SCREEN_HEIGHT * 0.9, SCREEN_WIDTH * 0.28, SCREEN_HEIGHT * 0.1);
    ctx.fill();
    ctx.fillStyle = '#7fc96d';
    ellipse(ctx, SCREEN_WIDTH * 0.92, SCREEN_HEIGHT * 0.9, SCREEN_WIDTH * 0.3, SCREEN_HEIGHT * 0.11);
    ctx.fill();

    // ground
    const gh = SCREEN_HEIGHT * 0.14;
    const gy = SCREEN_HEIGHT - gh;
    const gg = ctx.createLinearGradient(0, gy, 0, SCREEN_HEIGHT);
    gg.addColorStop(0, '#7bc96a');
    gg.addColorStop(1, '#5eae54');
    ctx.fillStyle = gg;
    ctx.fillRect(0, gy, SCREEN_WIDTH, gh);
    ctx.fillStyle = '#8ed97b';
    ctx.fillRect(0, gy, SCREEN_WIDTH, 6 * SCALE);
  }

  drawCloud(x, y, scale) {
    const ctx = this.ctx;
    const cx = SCREEN_WIDTH + 40 - x;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    const w = 60 * SCALE * scale;
    ellipse(ctx, cx, y, w, 18 * SCALE * scale);
    ctx.fill();
    ellipse(ctx, cx - 20 * SCALE * scale, y - 10 * SCALE * scale, 22 * SCALE * scale, 22 * SCALE * scale);
    ctx.fill();
    ellipse(ctx, cx + 16 * SCALE * scale, y - 14 * SCALE * scale, 28 * SCALE * scale, 28 * SCALE * scale);
    ctx.fill();
  }

  drawGlassCard(x, y, w, h, r = 18 * SCALE) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawHUD(state, musicOn) {
    const ctx = this.ctx;
    const ui = this.ui;

    // score（可点展开/收起明细）
    this.drawGlassCard(ui.scoreCard.x, ui.scoreCard.y, ui.scoreCard.w, ui.scoreCard.h);
    ctx.fillStyle = 'rgba(29,29,31,0.7)';
    ctx.font = `${12 * SCALE}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('得分', ui.scoreCard.x + ui.scoreCard.w / 2, ui.scoreCard.y + 16 * SCALE);
    ctx.fillStyle = '#1d1d1f';
    ctx.font = `700 ${24 * SCALE}px sans-serif`;
    ctx.fillText(String(state.score), ui.scoreCard.x + ui.scoreCard.w / 2, ui.scoreCard.y + 40 * SCALE);
    // 展开指示
    ctx.fillStyle = 'rgba(29,29,31,0.45)';
    ctx.font = `${10 * SCALE}px sans-serif`;
    ctx.fillText(state.statsExpanded ? '▲ 明细' : '▼ 明细', ui.scoreCard.x + ui.scoreCard.w / 2, ui.scoreCard.y + 52 * SCALE);

    // stats：默认收起，点得分框后展开
    if (state.statsExpanded) {
      this.drawGlassCard(ui.statsCard.x, ui.statsCard.y, ui.statsCard.w, ui.statsCard.h);
      let rowY = ui.statsCard.y + 16 * SCALE;
      STAT_TYPES.forEach((type) => {
        const stat = state.caught[type];
        this.drawMiniFood(type, ui.statsCard.x + 14 * SCALE, rowY - 4 * SCALE, 0.35);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1d1d1f';
        ctx.font = `${11 * SCALE}px sans-serif`;
        ctx.fillText(STAT_LABELS[type], ui.statsCard.x + 28 * SCALE, rowY + 4 * SCALE);
        ctx.textAlign = 'right';
        ctx.fillText(`${stat.count}个`, ui.statsCard.x + ui.statsCard.w - 58 * SCALE, rowY + 4 * SCALE);
        const signed = stat.score > 0 ? `+${stat.score}分` : `${stat.score}分`;
        ctx.fillStyle = stat.score < 0 ? '#c62828' : stat.score > 0 ? '#2e7d32' : '#1d1d1f';
        ctx.fillText(signed, ui.statsCard.x + ui.statsCard.w - 10 * SCALE, rowY + 4 * SCALE);
        rowY += 20 * SCALE;
      });
    }

    // time
    this.drawGlassCard(ui.timeCard.x, ui.timeCard.y, ui.timeCard.w, ui.timeCard.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(29,29,31,0.7)';
    ctx.font = `${12 * SCALE}px sans-serif`;
    ctx.fillText('时间', ui.timeCard.x + ui.timeCard.w / 2, ui.timeCard.y + 18 * SCALE);
    ctx.fillStyle = '#1d1d1f';
    ctx.font = `700 ${26 * SCALE}px sans-serif`;
    ctx.fillText(String(state.timeLeft), ui.timeCard.x + ui.timeCard.w / 2, ui.timeCard.y + 46 * SCALE);

    this.drawIconBtn(ui.musicBtn, !musicOn);
    this.drawMusicIcon(ui.musicBtn, musicOn);
    if (state.phase === 'playing' || state.phase === 'paused') {
      this.drawIconBtn(ui.pauseBtn, false);
      if (state.paused) this.drawPlayIcon(ui.pauseBtn);
      else this.drawPauseIcon(ui.pauseBtn);
    }
  }

  drawIconBtn(r, dim) {
    const ctx = this.ctx;
    ctx.fillStyle = dim ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.72)';
    roundRect(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.fill();
  }

  drawMusicIcon(r, on) {
    const ctx = this.ctx;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = on ? '#1d1d1f' : 'rgba(29,29,31,0.45)';
    ellipse(ctx, -5 * SCALE, 6 * SCALE, 5 * SCALE, 3.6 * SCALE);
    ctx.fill();
    ctx.fillRect(-1 * SCALE, -10 * SCALE, 2.4 * SCALE, 16 * SCALE);
    ctx.beginPath();
    ctx.moveTo(1.4 * SCALE, -10 * SCALE);
    ctx.quadraticCurveTo(12 * SCALE, -14 * SCALE, 10 * SCALE, -2 * SCALE);
    ctx.quadraticCurveTo(8 * SCALE, -8 * SCALE, 1.4 * SCALE, -6 * SCALE);
    ctx.closePath();
    ctx.fill();
    if (!on) {
      ctx.strokeStyle = '#c62828';
      ctx.lineWidth = 2.2 * SCALE;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-10 * SCALE, 9 * SCALE);
      ctx.lineTo(10 * SCALE, -9 * SCALE);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPauseIcon(r) {
    const ctx = this.ctx;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    ctx.fillStyle = '#1d1d1f';
    roundRect(ctx, cx - 6 * SCALE, cy - 7 * SCALE, 4 * SCALE, 14 * SCALE, 1.5 * SCALE);
    ctx.fill();
    roundRect(ctx, cx + 2 * SCALE, cy - 7 * SCALE, 4 * SCALE, 14 * SCALE, 1.5 * SCALE);
    ctx.fill();
  }

  drawPlayIcon(r) {
    const ctx = this.ctx;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    ctx.fillStyle = '#1d1d1f';
    ctx.beginPath();
    ctx.moveTo(cx - 5 * SCALE, cy - 7 * SCALE);
    ctx.lineTo(cx + 8 * SCALE, cy);
    ctx.lineTo(cx - 5 * SCALE, cy + 7 * SCALE);
    ctx.closePath();
    ctx.fill();
  }

  drawMiniFood(type, x, y, s) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    this.drawFoodShape(type, 0, 0);
    ctx.restore();
  }

  drawFoodShape(type, cx, cy) {
    const ctx = this.ctx;
    if (type === 'carrot') {
      ctx.fillStyle = '#ff8a3d';
      roundRect(ctx, cx - 11, cy - 5, 22, 42, 12);
      ctx.fill();
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(cx - 4, cy - 22, 8, 18);
    } else if (type === 'veggie') {
      ctx.fillStyle = '#6fbf4a';
      ellipse(ctx, cx - 12, cy, 10, 15);
      ctx.fill();
      ellipse(ctx, cx + 12, cy, 10, 15);
      ctx.fill();
      ctx.fillStyle = '#f6f1e4';
      roundRect(ctx, cx - 13, cy - 6, 26, 28, 8);
      ctx.fill();
    } else if (type === 'strawberry') {
      ctx.fillStyle = '#e11d48';
      ellipse(ctx, cx, cy + 4, 15, 17);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      roundRect(ctx, cx - 5, cy - 16, 10, 12, 4);
      ctx.fill();
    } else if (type === 'banana') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.55);
      ctx.fillStyle = '#f5c518';
      roundRect(ctx, -9, -22, 18, 44, 12);
      ctx.fill();
      ctx.fillStyle = '#8d6e3b';
      roundRect(ctx, -4, -28, 8, 8, 3);
      ctx.fill();
      ctx.restore();
    } else if (type === 'cake') {
      ctx.fillStyle = '#7a4a2a';
      roundRect(ctx, cx - 23, cy - 6, 46, 30, 8);
      ctx.fill();
      ctx.fillStyle = '#f3d7b0';
      ctx.fillRect(cx - 23, cy + 2, 46, 6);
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.arc(cx, cy - 14, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'peel') {
      ctx.fillStyle = '#f5c518';
      ellipse(ctx, cx, cy + 4, 24, 8);
      ctx.fill();
      ctx.save();
      ctx.translate(cx - 14, cy - 4);
      ctx.rotate(-0.66);
      ellipse(ctx, 0, 0, 8, 9);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(cx + 14, cy - 4);
      ctx.rotate(0.66);
      ellipse(ctx, 0, 0, 8, 9);
      ctx.fill();
      ctx.restore();
    }
  }

  drawItems(state) {
    const ctx = this.ctx;
    state.items.forEach((item) => {
      const swayX = item.x + Math.sin((Date.now() / 400) + item.phase) * item.sway * 0.08;
      ctx.save();
      ctx.translate(swayX, item.y + ITEM_HEIGHT / 2);
      this.drawFoodShape(item.type, 0, 0);
      ctx.restore();
    });

    state.peels.forEach((peel) => {
      const alpha = peel.life < 0.35 ? Math.max(0, peel.life / 0.35) : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      // 落地压扁动画
      const dropT = Math.min(1, peel.age / 0.34);
      const sy = 1.16 - 0.16 * dropT;
      const sx = 0.86 + 0.14 * dropT;
      ctx.translate(peel.x, peel.y + PEEL_HEIGHT / 2);
      ctx.scale(sx, sy);
      this.drawFoodShape('peel', 0, 0);
      ctx.restore();
    });
  }

  drawPopups(state) {
    const ctx = this.ctx;
    state.popups.forEach((p) => {
      const t = 1 - p.life / 0.8;
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.fillStyle = p.delta >= 0 ? '#2e7d32' : '#c62828';
      ctx.font = `800 ${22 * SCALE}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.delta > 0 ? `+${p.delta}` : `${p.delta}`, p.x, p.y - t * 40 * SCALE);
      ctx.globalAlpha = 1;
    });
  }

  drawRabbit(rabbit, state) {
    const ctx = this.ctx;
    const s = SCALE;
    const boxW = RABBIT_WIDTH;
    const boxH = RABBIT_HEIGHT;
    const left = rabbit.x;
    const top = rabbit.screenTop();
    const bottom = rabbit.screenBottom();
    const bodyColor = state.mood === 'sad' ? '#f4efe8' : '#ffffff';

    const shadowScale = rabbit.y > 1 ? 0.68 : rabbit.isSliding() ? 1.18 : 1;
    const shadowAlpha = rabbit.y > 1 ? 0.28 : rabbit.isSliding() ? 0.36 : 0.16;
    ctx.fillStyle = `rgba(58,43,30,${shadowAlpha})`;
    ellipse(
      ctx,
      left + boxW / 2 + (rabbit.isSliding() ? rabbit.slideDir * 8 * s : 0),
      bottom + 4 * s,
      28 * s * shadowScale,
      6 * s * (rabbit.isSliding() ? 0.72 : 1)
    );
    ctx.fill();

    ctx.save();
    ctx.translate(left + boxW / 2, top + boxH * 0.58);
    let sx = 1;
    let sy = 1;
    if (rabbit.jumpV > 40) {
      sx = 0.96;
      sy = 1.06;
    } else if (rabbit.y > 1 && rabbit.jumpV < -40) {
      sx = 1.05;
      sy = 0.94;
    }
    if (rabbit.isSliding()) {
      ctx.rotate(rabbit.slideDir > 0 ? -0.28 : 0.28);
      ctx.translate(rabbit.slideDir > 0 ? 6 * s : -6 * s, 2 * s);
    }
    if (state.isFainting()) {
      ctx.rotate(1.54);
      ctx.translate(8 * s, 10 * s);
    } else if (state.isShaking()) {
      ctx.rotate(Math.sin(Date.now() / 40) * 0.26);
    }
    if (state.mood === 'joy') {
      const t = 1 - state.moodTimer / 0.65;
      if (t < 0.16) {
        sx *= 1.08;
        sy *= 0.86;
      } else if (t < 0.4) {
        sx *= 0.94;
        sy *= 1.1;
        ctx.translate(0, -16 * s);
      } else if (t < 0.62) {
        sx *= 1.05;
        sy *= 0.94;
      }
    }
    ctx.scale(sx, sy);
    ctx.translate(-boxW / 2, -boxH * 0.58);

    const px = (n) => n * s;

    const drawEar = (cx, rot) => {
      ctx.save();
      ctx.translate(cx, px(34));
      ctx.rotate(rot);
      ctx.fillStyle = bodyColor;
      // 耳朵根部伸进身体，后面用身体盖住，看起来是长出来的
      roundRect(ctx, -px(10), -px(40), px(20), px(54), px(10));
      ctx.fill();
      ctx.fillStyle = '#ffc9dc';
      roundRect(ctx, -px(5.5), -px(34), px(11), px(26), px(5.5));
      ctx.fill();
      ctx.restore();
    };
    drawEar(px(33), -0.05);
    drawEar(px(59), 0.05);

    ctx.fillStyle = '#ffffff';
    ellipse(ctx, px(74), px(96), px(8), px(8));
    ctx.fill();
    ctx.fillStyle = '#f3e6d8';
    ellipse(ctx, px(76), px(98), px(3.5), px(3.5));
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.save();
    ctx.translate(px(16), px(72));
    ctx.rotate(0.28);
    roundRect(ctx, -px(8), -px(6), px(16), px(20), px(8));
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(px(76), px(72));
    ctx.rotate(-0.28);
    roundRect(ctx, -px(8), -px(6), px(16), px(20), px(8));
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = bodyColor;
    ellipse(ctx, px(46), px(66), px(30), px(44));
    ctx.fill();

    ctx.fillStyle = '#f6e3c8';
    ellipse(ctx, px(46), px(78), px(18), px(16));
    ctx.fill();

    ctx.fillStyle = bodyColor;
    roundRect(ctx, px(16), px(96), px(28), px(18), px(10));
    ctx.fill();
    roundRect(ctx, px(48), px(96), px(28), px(18), px(10));
    ctx.fill();

    const faceY = px(50);
    if (state.isFainting()) {
      ctx.fillStyle = '#3a2b1e';
      roundRect(ctx, px(32), faceY, px(10), px(3), px(2));
      ctx.fill();
      roundRect(ctx, px(50), faceY, px(10), px(3), px(2));
      ctx.fill();
      ctx.fillStyle = '#f48fb1';
      ellipse(ctx, px(46), faceY + px(16), px(4), px(4));
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.font = `${12 * s}px sans-serif`;
      ctx.textAlign = 'center';
      for (let i = 0; i < 3; i += 1) {
        const a = Date.now() / 280 + i * 2.1;
        ctx.fillText(i === 1 ? '✧' : '✦', px(46) + Math.cos(a) * px(20), px(18) + Math.sin(a) * px(6));
      }
    } else {
      ctx.fillStyle = '#3a2b1e';
      ellipse(ctx, px(36), faceY, px(4.2), px(4.8));
      ctx.fill();
      ellipse(ctx, px(56), faceY, px(4.2), px(4.8));
      ctx.fill();

      ctx.fillStyle = '#f7a0b8';
      ellipse(ctx, px(46), faceY + px(11), px(5), px(3.8));
      ctx.fill();

      if (state.mood === 'happy' || state.mood === 'joy') {
        ctx.fillStyle = '#f48fb1';
        const mw = state.mood === 'joy' ? px(14) : px(11);
        const mh = state.mood === 'joy' ? px(9) : px(7);
        roundRect(ctx, px(46) - mw / 2, faceY + px(16), mw, mh, mh);
        ctx.fill();
      } else if (state.mood === 'sad') {
        ctx.strokeStyle = '#e39aad';
        ctx.lineWidth = 2 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(px(46), faceY + px(26), px(5), Math.PI + 0.3, -0.3);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#f0a8ba';
        ctx.lineWidth = 2 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(px(46), faceY + px(15), px(5), 0.25, Math.PI - 0.25);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  drawOverlay(phase, score, best) {
    if (phase !== 'start' && phase !== 'paused' && phase !== 'end') return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const layout = this.getOverlayLayout(phase);
    this.drawPanel(layout.x, layout.y, layout.w, layout.h);
    const cx = layout.x + layout.w / 2;
    const pad = 24 * SCALE;

    if (phase === 'start') {
      ctx.fillStyle = '#1d1d1f';
      ctx.textAlign = 'center';
      ctx.font = `700 ${32 * SCALE}px sans-serif`;
      ctx.fillText('小兔兔爱吃菜', cx, layout.y + 48 * SCALE);

      ctx.font = `${15 * SCALE}px sans-serif`;
      ctx.fillStyle = 'rgba(29,29,31,0.8)';
      this.wrapText(
        ctx,
        '左右移动小兔兔，接住天上掉下来的好吃的！',
        cx,
        layout.y + 76 * SCALE,
        layout.w - pad * 2,
        20 * SCALE
      );

      const scores = {};
      ITEM_TYPES.forEach((item) => {
        scores[item.type] = item.score;
      });
      let rowY = layout.y + 124 * SCALE;
      const rowH = 36 * SCALE;
      STAT_TYPES.forEach((type) => {
        ctx.fillStyle = '#fff7ea';
        roundRect(ctx, layout.x + pad, rowY, layout.w - pad * 2, rowH, 14 * SCALE);
        ctx.fill();
        this.drawMiniFood(type, layout.x + pad + 18 * SCALE, rowY + rowH / 2, 0.42);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1d1d1f';
        ctx.font = `${15 * SCALE}px sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(STAT_LABELS[type], layout.x + pad + 36 * SCALE, rowY + rowH / 2);
        ctx.textAlign = 'right';
        ctx.font = `700 ${15 * SCALE}px sans-serif`;
        const delta = scores[type];
        ctx.fillText(delta > 0 ? `+${delta}` : `${delta}`, layout.x + layout.w - pad - 14 * SCALE, rowY + rowH / 2);
        ctx.textBaseline = 'alphabetic';
        rowY += rowH + 8 * SCALE;
      });

      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(29,29,31,0.65)';
      ctx.font = `${13 * SCALE}px sans-serif`;
      this.wrapText(
        ctx,
        '点击屏幕可以跳起来接食物，连点最多跳 3 次。漏接的香蕉会变成香蕉皮，踩到会滑出去。',
        cx,
        rowY + 10 * SCALE,
        layout.w - pad * 2,
        18 * SCALE
      );
      this.drawPrimaryBtn(layout.button, '开始游戏');
    } else if (phase === 'paused') {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1d1d1f';
      ctx.font = `700 ${32 * SCALE}px sans-serif`;
      ctx.fillText('已暂停', cx, layout.y + 68 * SCALE);
      ctx.font = `${15 * SCALE}px sans-serif`;
      ctx.fillStyle = 'rgba(29,29,31,0.8)';
      ctx.fillText('点继续，小兔兔就会接着接食物', cx, layout.y + 104 * SCALE);
      this.drawPrimaryBtn(layout.button, '继续游戏');
    } else if (phase === 'end') {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1d1d1f';
      ctx.font = `700 ${32 * SCALE}px sans-serif`;
      ctx.fillText('时间到啦', cx, layout.y + 56 * SCALE);
      ctx.font = `${15 * SCALE}px sans-serif`;
      ctx.fillStyle = 'rgba(29,29,31,0.8)';
      ctx.fillText('小兔兔这一轮吃到了：', cx, layout.y + 90 * SCALE);
      ctx.fillStyle = '#1d1d1f';
      ctx.font = `700 ${48 * SCALE}px sans-serif`;
      const scoreText = String(score);
      const scoreW = ctx.measureText(scoreText).width;
      ctx.font = `${20 * SCALE}px sans-serif`;
      const unitW = ctx.measureText(' 分').width;
      const blockX = cx - (scoreW + unitW) / 2;
      ctx.font = `700 ${48 * SCALE}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(scoreText, blockX, layout.y + 150 * SCALE);
      ctx.font = `${20 * SCALE}px sans-serif`;
      ctx.fillStyle = 'rgba(29,29,31,0.78)';
      ctx.fillText(' 分', blockX + scoreW, layout.y + 146 * SCALE);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(29,29,31,0.7)';
      ctx.font = `${15 * SCALE}px sans-serif`;
      ctx.fillText(`历史最好：${best} 分`, cx, layout.y + 184 * SCALE);
      this.drawPrimaryBtn(layout.button, '再玩一次');
    }
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split('');
    let line = '';
    let yy = y;
    for (let i = 0; i < chars.length; i += 1) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, yy);
        line = chars[i];
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
  }

  /**
   * @param {import('./state').default} state
   * @param {import('./rabbit').default} rabbit
   * @param {boolean} musicOn
   * @param {number} best
   */
  render(state, rabbit, musicOn, best) {
    this.clear();
    this.drawBackground(state);
    this.drawItems(state);
    this.drawRabbit(rabbit, state);
    this.drawPopups(state);
    this.drawHUD(state, musicOn);
    this.drawOverlay(state.phase, state.score, best);
  }
}
