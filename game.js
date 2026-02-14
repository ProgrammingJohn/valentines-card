const keys = {};

function normalizeKey(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

window.addEventListener("keydown", (e) => (keys[normalizeKey(e.key)] = true));
window.addEventListener("keyup", (e) => (keys[normalizeKey(e.key)] = false));
window.addEventListener("blur", () => {
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const valentineOverlay = document.getElementById("valentine-overlay");

// const johnSprite = new Image();
// const johnSpriteFlipped = new Image();
// const shreyaSprite = new Image();
// const shreyaSpriteFlipped = new Image();
const scene = new Image();
scene.src = "/valentines-card/assets/scene.png";
const card = new Image();
card.src = "/valentines-card/assets/heart-envelope.png";
// shreyaSprite.src = "/assets/shreya.png";
// shreyaSpriteFlipped.src = "/assets/shreya-flipped.png";
// johnSprite.src = "/assets/john.png";
// johnSpriteFlipped.src = "/assets/john-flipped.png";

function loadSpriteCycle(name, frames) {
  var resp = [];
  for (let frame = 0; frame < frames; frame++) {
    let sprite = new Image();
    sprite.src = `/valentines-card/assets/sprites/${name}/sprite-${frame}.png`;
    // console.log(sprite);
    resp.push(sprite);
  }
  return resp;
}
// INTERNAL resolution (the world)
const WORLD_WIDTH = 256;
const WORLD_HEIGHT = 120;
const WALK_CYCLE_FRAMES = 4;
const ENVELOPE_START_DELAY_MS = 400;
const ENVELOPE_FRAME_MS = 150;
const ENVELOPE_SCALE = 4;

const envelopeFrames = [];
for (let frame = 0; frame < 12; frame++) {
  const sprite = new Image();
  sprite.src = `/valentines-card/assets/envelope/envelope-${String(frame).padStart(2, "0")}.png`;
  envelopeFrames.push(sprite);
}

const envelopeSequence = {
  pending: false,
  queuedAt: 0,
  active: false,
  finished: false,
  frameIndex: 0,
  startedAt: 0,
};

canvas.width = WORLD_WIDTH;
canvas.height = WORLD_HEIGHT;

const playerShreya = {
  // sprite: shreyaSprite,
  // spriteFlipped: shreyaSpriteFlipped,
  spriteCycle: loadSpriteCycle("shreya-cycle", 4),
  spriteCycleFlipped: loadSpriteCycle("shreya-cycle-flipped", 4),
  name: "shreya",
  // keys: ["a", "d", "w", "s"], // left, right, up, down
  keys: ["a", "d", null, null], // left, right, up, down
  frame: 0,
  x: 20,
  y: 83,
  speed: 70, // pixels per second
  width: 18,
  height: 23,
  xDirection: 1,
  moved: false,
  spriteFrameIndex: 0,
  lastTimeMoved: 0,
  lastFrameUpdate: 0,
};
const playerJohn = {
  spriteCycle: loadSpriteCycle("john-cycle", 4),
  spriteCycleFlipped: loadSpriteCycle("john-hold-letter", 4),
  name: "john",
  // keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"], // left, right, up, down
  // keys: ["ArrowLeft", "ArrowRight", null, null], // left, right, up, down
  keys: [null, null, null, null], // left, right, up, down
  frame: 0,
  x: 200,
  y: 83,
  speed: 70, // pixels per second
  width: 15,
  height: 23,
  xDirection: -1,
  moved: false,
  spriteFrameIndex: 0,
  lastTimeMoved: 0,
  lastFrameUpdate: 0,
};

let lastTime = 0;
let lastTimeMoved = 0;

function bindMobileControls() {
  const buttons = document.querySelectorAll("#mobile-controls [data-key]");
  buttons.forEach((button) => {
    const key = button.dataset.key;
    if (!key) return;

    const release = () => {
      keys[key] = false;
    };

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      keys[key] = true;
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("pointercancel", release);
  });
}

function startEnvelopeSequence() {
  envelopeSequence.pending = false;
  envelopeSequence.active = true;
  envelopeSequence.finished = false;
  envelopeSequence.frameIndex = 0;
  envelopeSequence.startedAt = lastTime;
  if (valentineOverlay) {
    valentineOverlay.classList.remove("show");
  }
}

function queueEnvelopeSequence() {
  if (
    envelopeSequence.pending ||
    envelopeSequence.active ||
    envelopeSequence.finished
  ) {
    return;
  }
  envelopeSequence.pending = true;
  envelopeSequence.queuedAt = lastTime;
  if (valentineOverlay) {
    valentineOverlay.classList.remove("show");
  }
}

function updateEnvelopeSequence() {
  if (envelopeSequence.pending) {
    const queuedElapsed = lastTime - envelopeSequence.queuedAt;
    if (queuedElapsed >= ENVELOPE_START_DELAY_MS) {
      startEnvelopeSequence();
    } else {
      return;
    }
  }

  if (!envelopeSequence.active) return;

  const elapsed = lastTime - envelopeSequence.startedAt;
  const frameIndex = Math.floor(elapsed / ENVELOPE_FRAME_MS);
  if (frameIndex >= envelopeFrames.length) {
    envelopeSequence.active = false;
    envelopeSequence.finished = true;
    envelopeSequence.frameIndex = envelopeFrames.length - 1;
    if (valentineOverlay) {
      valentineOverlay.classList.add("show");
    }
    return;
  }

  envelopeSequence.frameIndex = frameIndex;
}

function update(dt) {
  [playerJohn, playerShreya].forEach((player) => {
    let tmpMoved = false;
    if (keys[player.keys[0]]) {
      player.x -= player.speed * dt;
      player.xDirection = -1;
      tmpMoved = true;
      player.lastTimeMoved = lastTime;
    }
    if (keys[player.keys[1]]) {
      player.x += player.speed * dt;
      player.xDirection = 1;
      tmpMoved = true;
      player.lastTimeMoved = lastTime;
    }
    if (keys[player.keys[2]]) {
      player.y -= player.speed * dt;
      tmpMoved = true;
      player.lastTimeMoved = lastTime;
    }
    if (keys[player.keys[3]]) {
      player.y += player.speed * dt;
      tmpMoved = true;
      player.lastTimeMoved = lastTime;
    }
    // console.log(lastTime - lastTimeMoved < 100);
    if (!tmpMoved && lastTime - player.lastTimeMoved < 100) {
      tmpMoved = true;
    }
    player.moved = tmpMoved ? true : false;

    player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));
    player.y = Math.max(0, Math.min(WORLD_HEIGHT - player.height, player.y));
  });

  if (playerShreya.x >= 184) {
    playerShreya.x = 184;
    if (keys["e"]) {
      playerJohn.holdAnimation = true;
      queueEnvelopeSequence();
    }
  }
  if (playerJohn.holdAnimation && playerJohn.spriteFrameIndex != 3) {
    playerJohn.moved = true;
    // playerJohn.spriteFrameIndex = 3;
  } else if (playerJohn.spriteFrameIndex == 3) {
    playerJohn.spriteFrameIndex = 3;
  } else {
    playerJohn.moved = false;
  }

  updateEnvelopeSequence();
}

function drawEnvelopeSequence() {
  if (!envelopeSequence.active && !envelopeSequence.finished) {
    return;
  }

  const frame =
    envelopeFrames[envelopeSequence.frameIndex] ||
    envelopeFrames[envelopeFrames.length - 1];
  if (!frame) return;

  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  const spriteSize = (frame.naturalWidth || 25) * ENVELOPE_SCALE;
  const x = Math.floor((WORLD_WIDTH - spriteSize) / 2);
  const y = Math.floor((WORLD_HEIGHT - spriteSize) / 2) + 15;
  ctx.drawImage(frame, x, y, spriteSize, spriteSize);
}

function draw(dt) {
  // clear screen
  // ctx.fillStyle = "#5c94fc"; // sky color
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // // floor
  // ctx.fillStyle = "#3fa34d";
  // ctx.fillRect(0, 180, WORLD_WIDTH, 60);
  ctx.drawImage(scene, 0, 0);

  // player

  [playerJohn, playerShreya].forEach((player) => {
    // console.log(player.name, player.speed, player.spriteCycle);
    let sprite = null;
    // let spriteFrameIndex = 0;
    if (player.moved) {
      if (player.spriteFrameIndex < WALK_CYCLE_FRAMES - 1) {
        // console.log(lastTime - player.lastFrameUpdate);
        if (lastTime - player.lastFrameUpdate > 80) {
          player.spriteFrameIndex += 1;

          player.lastFrameUpdate = lastTime;
        }
      } else {
        if (player.name !== "john") {
          player.spriteFrameIndex = 0;
        }
      }
    } else {
      player.spriteFrameIndex = 0;
      if (player.name == "john" && player.holdAnimation) {
        player.spriteFrameIndex = 3;
      }
    }
    // console.log(
    //   player.moved,
    //   spriteFrameIndex < WALK_CYCLE_FRAMES - 1,
    //   spriteFrameIndex,
    // );
    // console.log(spriteFrameIndex);

    // if (playerJohn.holdAnimation) {
    //   ctx.drawImage(card, Math.floor(player.x), Math.floor(player.y));
    // }

    if (player.xDirection == -1) {
      sprite = player.spriteCycleFlipped[player.spriteFrameIndex];
    } else {
      sprite = player.spriteCycle[player.spriteFrameIndex];
    }

    // console.log(player.y);
    ctx.drawImage(sprite, Math.floor(player.x), Math.floor(player.y));
  });

  drawEnvelopeSequence();
}

function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  update(dt);
  draw(dt);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
// IMPORTANT — prevents blur
ctx.imageSmoothingEnabled = false;
bindMobileControls();
