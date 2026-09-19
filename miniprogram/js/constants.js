import { SCALE } from './render';

export const GAME_SECONDS = 60;
export const SHAKE_SECONDS = 0.42;
export const FAINT_SECONDS = 2;
export const MAX_AIR_JUMPS = 3;
export const PEEL_LIFE = 3;

export const RABBIT_WIDTH = 92 * SCALE;
export const RABBIT_HEIGHT = 110 * SCALE;
export const ITEM_WIDTH = 54 * SCALE;
export const ITEM_HEIGHT = 62 * SCALE;
export const PEEL_WIDTH = 56 * SCALE;
export const PEEL_HEIGHT = 28 * SCALE;

export const JUMP_VELOCITY = 560 * SCALE;
export const GRAVITY = 1500 * SCALE;
export const FALL_PX = 360 * SCALE;
export const SLIDE_SPEED = 440 * SCALE;
export const SLIDE_DISTANCE = 230 * SCALE;
export const KEYBOARD_MOVE = 520 * SCALE;

export const ITEM_TYPES = [
  { type: 'carrot', score: 1, weight: 36, fall: 3 },
  { type: 'veggie', score: 2, weight: 22, fall: 1 },
  { type: 'strawberry', score: 4, weight: 16, fall: 2 },
  { type: 'banana', score: 6, weight: 14, fall: 1 },
  { type: 'cake', score: -3, weight: 12, fall: 5 },
];

export const STAT_TYPES = ['banana', 'strawberry', 'veggie', 'carrot', 'cake'];

export const STAT_LABELS = {
  banana: '香蕉',
  strawberry: '草莓',
  veggie: '青菜',
  carrot: '胡萝卜',
  cake: '巧克力蛋糕',
};

export const BEST_KEY = 'rabbit-food-best-score';
export const MUSIC_KEY = 'rabbit-food-music-on';

/** @returns {import('./state').GameState} */
export function createCaught() {
  return {
    banana: { count: 0, score: 0 },
    strawberry: { count: 0, score: 0 },
    veggie: { count: 0, score: 0 },
    carrot: { count: 0, score: 0 },
    cake: { count: 0, score: 0 },
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function pickItemType() {
  const total = ITEM_TYPES.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of ITEM_TYPES) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return ITEM_TYPES[0];
}
