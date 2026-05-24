// ============================================
// NIGHTMARE TIME - Utilidades globales
// ============================================

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const TILE_SIZE = 64;

// Estado global del juego
const GameState = {
  running: false,
  paused: false,
  firstTime: true,
  currentZone: 'exterior',
  generatorEnergy: 100,
  generatorActive: true,
  decisions: {
    generatorUsed: 0,
    hidingUsed: 0,
    corePurified: false,
    reyHieloStopped: false,
    finnHelped: false,
    symbolsFound: 0,
    escapedExterior: false
  },
  totalSymbols: 5,
  keysCollected: [],
  fusesCollected: 0,
  runesCollected: 0,
  gameTime: 0,
  difficulty: 1
};

// Input handler
const Keys = {};
const KeysJustPressed = {};

document.addEventListener('keydown', (e) => {
  if (!Keys[e.code]) {
    KeysJustPressed[e.code] = true;
  }
  Keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
  Keys[e.code] = false;
});

function clearJustPressed() {
  for (let key in KeysJustPressed) {
    delete KeysJustPressed[key];
  }
}

function isKeyJustPressed(code) {
  return KeysJustPressed[code] === true;
}

// Utilidades matemáticas
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

// Colisión AABB
function rectsCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Timer helper
class Timer {
  constructor(duration, callback, loop = false) {
    this.duration = duration;
    this.callback = callback;
    this.loop = loop;
    this.elapsed = 0;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.callback();
      if (this.loop) {
        this.elapsed = 0;
      } else {
        this.active = false;
      }
    }
  }

  reset() {
    this.elapsed = 0;
    this.active = true;
  }
}
