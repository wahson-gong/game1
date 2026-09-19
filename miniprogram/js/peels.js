import { PEEL_LIFE, PEEL_WIDTH, PEEL_HEIGHT, clamp } from './constants';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render';

export function spawnPeel(state, x, groundBottom) {
  const peelX = clamp(x, 28, SCREEN_WIDTH - 28);
  const y = SCREEN_HEIGHT - groundBottom - 20 * (SCREEN_HEIGHT / 844);
  state.peels.push({
    x: peelX,
    y,
    life: PEEL_LIFE,
    age: 0,
  });
}

function hitPeel(peel, box) {
  const left = peel.x - PEEL_WIDTH / 2;
  const right = peel.x + PEEL_WIDTH / 2;
  const top = peel.y;
  const bottom = peel.y + PEEL_HEIGHT;
  return left < box.right && right > box.left && top < box.bottom && bottom > box.top;
}

/**
 * @param {number} dt
 * @param {import('./state').default} state
 * @param {import('./rabbit').default} rabbit
 */
export function updatePeels(dt, state, rabbit) {
  for (let i = state.peels.length - 1; i >= 0; i -= 1) {
    const peel = state.peels[i];
    peel.life -= dt;
    peel.age += dt;
    if (peel.life <= 0) {
      state.peels.splice(i, 1);
    }
  }

  if (!state.isStunned() && rabbit.y < 14 * (SCREEN_HEIGHT / 844)) {
    const feet = rabbit.footBox();
    for (let i = state.peels.length - 1; i >= 0; i -= 1) {
      if (hitPeel(state.peels[i], feet)) {
        rabbit.startSlide();
        state.peels.splice(i, 1);
      }
    }
  }
}
