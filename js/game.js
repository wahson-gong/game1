(() => {
  const GAME_SECONDS = 60;
  const RABBIT_WIDTH = 92;
  const ITEM_WIDTH = 54;
  const ITEM_HEIGHT = 62;
  const BEST_KEY = "rabbit-food-best-score";

  const SHAKE_SECONDS = 0.42;
  const FAINT_SECONDS = 2;

  const MAX_AIR_JUMPS = 3;
  const JUMP_VELOCITY = 560;
  const GRAVITY = 1500;
  const FALL_PX = 360;

  const ITEM_TYPES = [
    { type: "carrot", score: 1, weight: 36, fall: 3 },
    { type: "veggie", score: 2, weight: 22, fall: 1 },
    { type: "strawberry", score: 4, weight: 16, fall: 2 },
    { type: "banana", score: 6, weight: 14, fall: 1 },
    { type: "cake", score: -3, weight: 12, fall: 5 },
  ];

  const STAT_TYPES = ["banana", "strawberry", "veggie", "carrot", "cake"];
  const MUSIC_KEY = "rabbit-food-music-on";

  const gameEl = document.getElementById("game");
  const rabbitEl = document.getElementById("rabbit");
  const itemsEl = document.getElementById("items");
  const popupsEl = document.getElementById("popups");
  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");
  const startScreen = document.getElementById("start-screen");
  const endScreen = document.getElementById("end-screen");
  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-btn");
  const finalScoreEl = document.getElementById("final-score");
  const bestScoreEl = document.getElementById("best-score");
  const musicBtn = document.getElementById("music-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const pauseScreen = document.getElementById("pause-screen");
  const resumeBtn = document.getElementById("resume-btn");
  const statEls = {
    banana: {
      count: document.getElementById("banana-count"),
      score: document.getElementById("banana-score"),
    },
    strawberry: {
      count: document.getElementById("strawberry-count"),
      score: document.getElementById("strawberry-score"),
    },
    veggie: {
      count: document.getElementById("veggie-count"),
      score: document.getElementById("veggie-score"),
    },
    carrot: {
      count: document.getElementById("carrot-count"),
      score: document.getElementById("carrot-score"),
    },
    cake: {
      count: document.getElementById("cake-count"),
      score: document.getElementById("cake-score"),
    },
  };

  const state = {
    running: false,
    paused: false,
    score: 0,
    timeLeft: GAME_SECONDS,
    rabbitX: 0,
    targetX: 0,
    rabbitV: 0,
    rabbitY: 0,
    jumpV: 0,
    airJumps: 0,
    items: [],
    keys: new Set(),
    lastTs: 0,
    tickEpoch: 0,
    ignoreJumpUntil: 0,
    spawnAcc: 0,
    moodTimer: 0,
    stunTimer: 0,
    timerId: 0,
    caught: {
      banana: { count: 0, score: 0 },
      strawberry: { count: 0, score: 0 },
      veggie: { count: 0, score: 0 },
      carrot: { count: 0, score: 0 },
      cake: { count: 0, score: 0 },
    },
  };

  const music = createBackgroundMusic();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pickItemType() {
    const total = ITEM_TYPES.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of ITEM_TYPES) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    return ITEM_TYPES[0];
  }

  function rabbitWidth() {
    return rabbitEl.offsetWidth || RABBIT_WIDTH;
  }

  function groundBottom() {
    return gameEl.clientHeight * 0.07;
  }

  function applyRabbitPosition() {
    rabbitEl.style.left = `${Math.round(state.rabbitX)}px`;
    rabbitEl.style.marginLeft = "0";
    rabbitEl.style.bottom = `${Math.round(groundBottom() + state.rabbitY)}px`;
    rabbitEl.classList.toggle("airborne", state.rabbitY > 1);
    rabbitEl.classList.toggle("rising", state.jumpV > 40);
    rabbitEl.classList.toggle("falling", state.rabbitY > 1 && state.jumpV < -40);
  }

  function setRabbitX(x) {
    const maxX = gameEl.clientWidth - rabbitWidth();
    if ((x < 0 && state.rabbitV < 0) || (x > maxX && state.rabbitV > 0)) {
      state.rabbitV *= 0.15;
    }
    state.rabbitX = clamp(x, 0, maxX);
    if (Math.abs(state.rabbitV) < 0.4) state.rabbitV = 0;
    applyRabbitPosition();
  }

  function landRabbit() {
    state.rabbitY = 0;
    state.jumpV = 0;
    state.airJumps = 0;
    applyRabbitPosition();
  }

  function tryJump() {
    if (!state.running || state.paused || isStunned()) return;
    if (performance.now() < state.ignoreJumpUntil) return;
    if (state.airJumps >= MAX_AIR_JUMPS) return;
    state.jumpV = JUMP_VELOCITY;
    state.airJumps += 1;
    applyRabbitPosition();
  }

  function pointerToX(clientX) {
    const rect = gameEl.getBoundingClientRect();
    return clientX - rect.left - rabbitWidth() / 2;
  }

  function formatSignedScore(score) {
    if (score > 0) return `+${score}分`;
    if (score < 0) return `${score}分`;
    return "0分";
  }

  function resetStats() {
    STAT_TYPES.forEach((type) => {
      state.caught[type].count = 0;
      state.caught[type].score = 0;
    });
    renderStats();
  }

  function renderStats() {
    STAT_TYPES.forEach((type) => {
      const stat = state.caught[type];
      statEls[type].count.textContent = `${stat.count}个`;
      statEls[type].score.textContent = formatSignedScore(stat.score);
      statEls[type].score.classList.toggle("good", stat.score > 0);
      statEls[type].score.classList.toggle("bad", stat.score < 0);
    });
  }

  function updateScore(type, delta, x, y) {
    state.caught[type].count += 1;
    state.caught[type].score += delta;
    state.score = Math.max(0, state.score + delta);
    scoreEl.textContent = String(state.score);
    renderStats();

    const popup = document.createElement("div");
    popup.className = `score-popup ${delta >= 0 ? "good" : "bad"}`;
    popup.textContent = delta > 0 ? `+${delta}` : `${delta}`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popupsEl.appendChild(popup);
    window.setTimeout(() => popup.remove(), 800);
  }

  function isStunned() {
    return state.stunTimer > 0;
  }

  function clearStun() {
    state.stunTimer = 0;
    rabbitEl.classList.remove("shake", "faint", "sad", "airborne", "rising", "falling");
    landRabbit();
    state.targetX = state.rabbitX;
    state.rabbitV = 0;
  }

  function stunFromCake() {
    state.stunTimer = SHAKE_SECONDS + FAINT_SECONDS;
    state.rabbitV = 0;
    state.targetX = state.rabbitX;
    landRabbit();
    rabbitEl.classList.remove("happy", "sad", "joy", "faint", "shake");
    void rabbitEl.offsetWidth;
    rabbitEl.classList.add("shake");
  }

  function setMood(mood) {
    if (isStunned() && mood !== "sad") return;
    rabbitEl.classList.remove("happy", "sad", "joy");
    if (mood === "joy") {
      void rabbitEl.offsetWidth;
    }
    if (mood) rabbitEl.classList.add(mood);
    state.moodTimer = mood === "joy" ? 0.65 : 0.45;
  }

  function spawnItem() {
    const chosen = pickItemType();
    const x = 28 + Math.random() * (gameEl.clientWidth - 56);
    const el = document.createElement("div");
    el.className = `item ${chosen.type}`;
    el.dataset.fall = String(chosen.fall);
    el.innerHTML = '<div class="food"></div>';
    el.style.left = `${x}px`;
    el.style.top = "-70px";
    itemsEl.appendChild(el);

    const elapsed = GAME_SECONDS - state.timeLeft;
    const speed = (FALL_PX / chosen.fall) * (1 + elapsed * 0.008);

    state.items.push({
      el,
      type: chosen.type,
      score: chosen.score,
      x,
      y: -70,
      speed,
      sway: 16 + Math.random() * 10,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function catchBox() {
    const rabbit = rabbitEl.getBoundingClientRect();
    const game = gameEl.getBoundingClientRect();
    return {
      left: rabbit.left - game.left + rabbit.width * 0.08,
      right: rabbit.right - game.left - rabbit.width * 0.08,
      top: rabbit.top - game.top - 8,
      bottom: rabbit.bottom - game.top - rabbit.height * 0.06,
    };
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

  function removeItem(index) {
    const [item] = state.items.splice(index, 1);
    item.el.remove();
  }

  function clearItems() {
    state.items.forEach((item) => item.el.remove());
    state.items = [];
    popupsEl.innerHTML = "";
  }

  function endGame() {
    state.running = false;
    state.paused = false;
    window.clearInterval(state.timerId);
    hidePause();
    pauseBtn.hidden = true;
    pauseBtn.textContent = "暂停";
    pauseBtn.setAttribute("aria-label", "暂停游戏");
    music.soften();
    finalScoreEl.textContent = String(state.score);

    const best = Math.max(state.score, Number(localStorage.getItem(BEST_KEY) || 0));
    localStorage.setItem(BEST_KEY, String(best));
    bestScoreEl.textContent = String(best);
    endScreen.classList.remove("hidden");
    endScreen.hidden = false;
    gameEl.classList.remove("is-playing");
  }

  function hidePause() {
    pauseScreen.classList.add("hidden");
    pauseScreen.hidden = true;
    gameEl.classList.remove("is-paused");
  }

  function setPaused(paused) {
    if (!state.running) return;
    state.paused = paused;
    pauseBtn.hidden = false;
    pauseBtn.textContent = paused ? "继续" : "暂停";
    pauseBtn.setAttribute("aria-label", paused ? "继续游戏" : "暂停游戏");
    if (paused) {
      pauseScreen.classList.remove("hidden");
      pauseScreen.hidden = false;
      gameEl.classList.add("is-paused");
      music.soften();
    } else {
      hidePause();
      state.lastTs = performance.now();
      music.start();
    }
  }

  function tick(ts, epoch) {
    if (epoch !== state.tickEpoch || !state.running) return;
    if (state.paused) {
      state.lastTs = ts;
      window.requestAnimationFrame((next) => tick(next, epoch));
      return;
    }
    const dt = Math.min(0.05, (ts - state.lastTs) / 1000 || 0.016);
    state.lastTs = ts;

    const moveSpeed = 520;
    if (!isStunned()) {
      if (state.keys.has("ArrowLeft") || state.keys.has("a") || state.keys.has("A")) {
        state.targetX -= moveSpeed * dt;
      }
      if (state.keys.has("ArrowRight") || state.keys.has("d") || state.keys.has("D")) {
        state.targetX += moveSpeed * dt;
      }

      const maxX = gameEl.clientWidth - rabbitWidth();
      state.targetX = clamp(state.targetX, 0, maxX);

      const response = state.rabbitY > 1 ? 0.09 : 0.14;
      const omega = 2 / Math.max(response, 0.001);
      const accel = omega * omega * (state.targetX - state.rabbitX) - 2 * omega * state.rabbitV;
      state.rabbitV += accel * dt;
      setRabbitX(state.rabbitX + state.rabbitV * dt);

      if (state.rabbitY > 0 || state.jumpV !== 0) {
        state.jumpV -= GRAVITY * dt;
        state.rabbitY += state.jumpV * dt;
        if (state.rabbitY <= 0) {
          landRabbit();
        } else {
          const maxY = gameEl.clientHeight * 0.58;
          if (state.rabbitY > maxY) {
            state.rabbitY = maxY;
            if (state.jumpV > 0) state.jumpV = 0;
          }
          applyRabbitPosition();
        }
      }
    } else {
      state.rabbitV = 0;
      state.targetX = state.rabbitX;
      state.stunTimer -= dt;
      if (state.stunTimer <= FAINT_SECONDS && rabbitEl.classList.contains("shake")) {
        rabbitEl.classList.remove("shake");
        rabbitEl.classList.add("faint", "sad");
      }
      if (state.stunTimer <= 0) clearStun();
    }

    const spawnEvery = Math.max(0.45, 1.15 - (GAME_SECONDS - state.timeLeft) * 0.012);
    state.spawnAcc += dt;
    if (state.spawnAcc >= spawnEvery) {
      state.spawnAcc = 0;
      spawnItem();
    }

    const box = catchBox();
    for (let i = state.items.length - 1; i >= 0; i -= 1) {
      const item = state.items[i];
      item.y += item.speed * dt;
      const swayX = item.x + Math.sin((ts / 400) + item.phase) * item.sway * 0.08;
      item.el.style.top = `${item.y}px`;
      item.el.style.left = `${swayX}px`;

      if (!isStunned() && hitTest({ ...item, x: swayX }, box)) {
        updateScore(item.type, item.score, swayX, item.y);
        if (item.type === "strawberry") {
          setMood("joy");
          music.playLaugh();
        } else if (item.type === "cake") {
          stunFromCake();
        } else {
          setMood(item.score >= 0 ? "happy" : "sad");
        }
        removeItem(i);
        continue;
      }

      if (item.y > gameEl.clientHeight - gameEl.clientHeight * 0.08) {
        removeItem(i);
      }
    }

    if (state.moodTimer > 0) {
      state.moodTimer -= dt;
      if (state.moodTimer <= 0 && !isStunned()) rabbitEl.classList.remove("happy", "sad", "joy");
    }

    window.requestAnimationFrame((next) => tick(next, epoch));
  }

  function startGame() {
    state.tickEpoch += 1;
    const epoch = state.tickEpoch;
    state.running = true;
    state.paused = false;
    state.score = 0;
    state.timeLeft = GAME_SECONDS;
    state.spawnAcc = 0.8;
    state.lastTs = performance.now();
    state.ignoreJumpUntil = performance.now() + 280;
    scoreEl.textContent = "0";
    timeEl.textContent = String(GAME_SECONDS);
    resetStats();
    music.start();
    gameEl.classList.add("is-playing");
    state.rabbitV = 0;
    landRabbit();
    clearStun();
    hidePause();
    pauseBtn.hidden = false;
    pauseBtn.textContent = "暂停";
    pauseBtn.setAttribute("aria-label", "暂停游戏");
    startScreen.classList.add("hidden");
    startScreen.hidden = true;
    endScreen.classList.add("hidden");
    endScreen.hidden = true;
    clearItems();
    setRabbitX((gameEl.clientWidth - rabbitWidth()) / 2);
    state.targetX = state.rabbitX;

    window.clearInterval(state.timerId);
    state.timerId = window.setInterval(() => {
      if (!state.running || state.paused) return;
      state.timeLeft -= 1;
      timeEl.textContent = String(state.timeLeft);
      if (state.timeLeft <= 0) endGame();
    }, 1000);

    window.requestAnimationFrame((ts) => tick(ts, epoch));
  }

  function bindControls() {
    const moveTo = (clientX) => {
      if (!state.running || state.paused || isStunned()) return;
      state.targetX = pointerToX(clientX);
    };

    window.addEventListener("mousemove", (event) => {
      moveTo(event.clientX);
    });

    window.addEventListener("pointerdown", (event) => {
      const target = event.target instanceof Element ? event.target : event.target.parentElement;
      if (target?.closest("button") || target?.closest(".overlay")) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      moveTo(event.clientX);
      tryJump();
    });

    gameEl.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button") || event.target.closest(".overlay")) return;
      try {
        gameEl.setPointerCapture(event.pointerId);
      } catch (error) {
        // Some test/automation clicks do not support pointer capture.
      }
    });

    gameEl.addEventListener("pointermove", (event) => {
      if (event.pointerType === "mouse") return;
      moveTo(event.clientX);
    });

    window.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
      state.keys.add(event.key);
    });

    window.addEventListener("keyup", (event) => {
      state.keys.delete(event.key);
    });

    window.addEventListener("resize", () => {
      setRabbitX(state.rabbitX);
      state.targetX = state.rabbitX;
    });
  }

  [startScreen, pauseScreen, endScreen].forEach((overlay) => {
    overlay.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
  });
  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);
  pauseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setPaused(!state.paused);
  });
  resumeBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setPaused(false);
  });
  musicBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    music.toggle();
  });
  bindControls();
  music.syncButton();
  bestScoreEl.textContent = String(Number(localStorage.getItem(BEST_KEY) || 0));
  setRabbitX((gameEl.clientWidth - rabbitWidth()) / 2);
  state.targetX = state.rabbitX;

  function createBackgroundMusic() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let ctx = null;
    let master = null;
    let sfx = null;
    let loopTimer = 0;
    let enabled = localStorage.getItem(MUSIC_KEY) !== "0";
    let playing = false;

    const melody = [
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
    const bass = [
      [0, 130.81, 0.9],
      [2, 174.61, 0.9],
      [4, 196.0, 0.9],
      [6, 130.81, 0.9],
    ];

    function ensure() {
      if (!AudioCtx) return false;
      if (!ctx) {
        ctx = new AudioCtx();
        master = ctx.createGain();
        sfx = ctx.createGain();
        master.gain.value = 0;
        sfx.gain.value = 0.9;
        master.connect(ctx.destination);
        sfx.connect(ctx.destination);
      }
      return true;
    }

    function playTone(freq, start, duration, type, volume, dest = master) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
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

    function scheduleLoop() {
      if (!ctx || !playing || !enabled) return;
      const start = ctx.currentTime + 0.04;
      melody.forEach(([time, freq, duration]) => {
        playTone(freq, start + time, duration, "triangle", 0.2);
      });
      bass.forEach(([time, freq, duration]) => {
        playTone(freq, start + time, duration, "sine", 0.1);
      });
      loopTimer = window.setTimeout(scheduleLoop, 8000);
    }

    function updateButton() {
      musicBtn.classList.toggle("off", !enabled);
      musicBtn.textContent = enabled ? "🎵 音乐开" : "🔇 音乐关";
      musicBtn.setAttribute("aria-label", enabled ? "关闭背景音乐" : "打开背景音乐");
    }

    return {
      start() {
        if (!ensure()) return;
        ctx.resume();
        if (!enabled) {
          master.gain.setValueAtTime(0, ctx.currentTime);
          playing = false;
          updateButton();
          return;
        }
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(0.18, ctx.currentTime);
        if (!playing) {
          playing = true;
          scheduleLoop();
        }
        updateButton();
      },
      soften() {
        if (!ctx || !master) return;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(enabled ? 0.08 : 0, ctx.currentTime + 0.4);
      },
      toggle() {
        enabled = !enabled;
        localStorage.setItem(MUSIC_KEY, enabled ? "1" : "0");
        if (!ensure()) {
          updateButton();
          return;
        }
        ctx.resume();
        window.clearTimeout(loopTimer);
        if (enabled) {
          playing = false;
          this.start();
        } else {
          playing = false;
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.setValueAtTime(0, ctx.currentTime);
        }
        updateButton();
      },
      playLaugh() {
        if (!ensure()) return;
        ctx.resume();
        const start = ctx.currentTime;
        const giggles = [
          [0.0, 620, 0.09],
          [0.11, 780, 0.08],
          [0.21, 860, 0.1],
          [0.34, 720, 0.14],
        ];
        giggles.forEach(([time, freq, duration]) => {
          playTone(freq, start + time, duration, "triangle", 0.28, sfx);
          playTone(freq * 0.5, start + time, duration, "sine", 0.12, sfx);
        });
      },
      syncButton: updateButton,
    };
  }
})();
