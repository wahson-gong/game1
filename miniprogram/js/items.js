import {
  ITEM_WIDTH,
  ITEM_HEIGHT,
  FALL_PX,
  GAME_SECONDS,
  pickItemType,
} from './constants';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render';
import { spawnPeel } from './peels';

export function spawnItem(state) {
  const chosen = pickItemType();
  const x = 28 + Math.random() * (SCREEN_WIDTH - 56);
  const elapsed = GAME_SECONDS - state.timeLeft;
  const speed = (FALL_PX / chosen.fall) * (1 + elapsed * 0.008);

  state.items.push({
    type: chosen.type,
    score: chosen.score,
    x,
    y: -70 * (SCREEN_HEIGHT / 844),
    speed,
    sway: 16 + Math.random() * 10,
    phase: Math.random() * Math.PI * 2,
  });
}

function hitTest(item, box) {
  const itemLeft = item.x - ITEM_WIDTH / 2;
  const itemRight = item.x + ITEM_WIDTH / 2;
  const itemTop = item.y;
  const itemBottom = item.y + ITEM_HEIGHT;
  return (
    itemLeft < box.right &&
    itemRight > box.left &&
    itemTop < box.bottom &&
    itemBottom > box.top
  );
}

/**
 * @param {number} dt
 * @param {number} ts
 * @param {import('./state').default} state
 * @param {import('./rabbit').default} rabbit
 * @param {(type:string, score:number, x:number, y:number)=>void} onCatch
 */
export function updateItems(dt, ts, state, rabbit, onCatch) {
  const spawnEvery = Math.max(0.45, 1.15 - (GAME_SECONDS - state.timeLeft) * 0.012);
  state.spawnAcc += dt;
  if (state.spawnAcc >= spawnEvery) {
    state.spawnAcc = 0;
    spawnItem(state);
  }

  const box = rabbit.catchBox();
  const missLine = SCREEN_HEIGHT - SCREEN_HEIGHT * 0.08;

  for (let i = state.items.length - 1; i >= 0; i -= 1) {
    const item = state.items[i];
    item.y += item.speed * dt;
    const swayX = item.x + Math.sin(ts / 400 + item.phase) * item.sway * 0.08;

    if (!state.isStunned() && hitTest({ ...item, x: swayX }, box)) {
      onCatch(item.type, item.score, swayX, item.y);
      state.items.splice(i, 1);
      continue;
    }

    if (item.y > missLine) {
      if (item.type === 'banana') {
        spawnPeel(state, swayX, rabbit.groundBottom());
      }
      state.items.splice(i, 1);
    }
  }
}
