import './style.css';
import Cholita from './entities/cholita.js';
import fondoImgSrc from './assets/nivel1/fondo.jpg';
import casasImgSrc from './assets/nivel1/casas.png';

// ========= Config =========
const BAND_HEIGHT = 0.20;     // 20% de la pantalla de alto para la banda jugable
const GROUND_MARGIN = 8;      // altura del “borde” inferior (baldosas)
const BG_TILE_FACTOR = 1.8;   // ancho de bloque del fondo
const HOUSES_HEIGHT = 0.60;   // altura visible de casas (60% del alto de pantalla)
const HOUSES_WIDTH_FACTOR = 3.5; // ancho de bloque de casas

// Toggles runtime
let SHOW_BAND = false;   // B → on/off
let SHOW_MARKERS = false; // M → on/off

// ========= Canvas =========
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

// ========= Helpers =========
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const keys = new Set();
addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);

  // Toggles de depuración/guías
  if (e.code === 'KeyB') SHOW_BAND = !SHOW_BAND;      // Franja jugable
  if (e.code === 'KeyM') SHOW_MARKERS = !SHOW_MARKERS; // Marcadores de avance
});
addEventListener('keyup', e => keys.delete(e.code));

// ========= Mundo =========
const camera = { x: 0 };
const LEVEL_WIDTH = 20000;
const WALK = { top: 0, bottom: 0 };

// ========= Balas =========
class Bullet {
  constructor(x, y, dir) {
    this.x = x; this.y = y;
    this.w = 20; this.h = 8;
    this.vx = dir * 880;
    this.dead = false;
  }
  update(dt) {
    this.x += this.vx * dt;
    if (this.x < camera.x - 300 || this.x > camera.x + canvas.width + 300) this.dead = true;
  }
  draw() {
    ctx.fillStyle = '#222120ff';
    ctx.fillRect(Math.floor(this.x - camera.x), Math.floor(this.y), this.w, this.h);
  }
}
const bullets = [];

// ========= Jugador =========
const cholita = new Cholita(120, 0, {
  speed: 320,
  vSpeed: 220,
  jumpSpeed: 800,
  gravity: 2200,
  laneTop: 0,
  laneBottom: 0,
  onShoot: ({ x, y, dir }) => bullets.push(new Bullet(x, y, dir))
});

// ========= Imágenes =========
const fondoImg = new Image(); let fondoLoaded = false;
fondoImg.onload = () => { fondoLoaded = true; };
fondoImg.src = fondoImgSrc;

const casasImg = new Image(); let casasLoaded = false;
casasImg.onload = () => { casasLoaded = true; };
casasImg.src = casasImgSrc;

// ========= Ground helper =========
const groundY = () => canvas.height - GROUND_MARGIN;

// ========= Resize =========
function resize() {
  canvas.width = Math.floor(innerWidth);
  canvas.height = Math.floor(innerHeight);

  // Banda jugable anclada al piso
  const bottom = groundY();
  const band = Math.floor(canvas.height * BAND_HEIGHT);
  WALK.bottom = bottom;
  WALK.top = Math.max(0, bottom - band);

  cholita.laneTop = WALK.top;
  cholita.laneBottom = WALK.bottom;

  if (cholita.onGround) {
    const newBottom = clamp(cholita.bottom, WALK.top, WALK.bottom);
    cholita.groundY = newBottom;
    cholita.bottom = newBottom;
  } else {
    cholita.groundY = WALK.bottom;
  }
}
addEventListener('resize', resize);
resize();

cholita.bottom = WALK.bottom;
cholita.groundY = WALK.bottom;

// ========= Entrada mouse =========
addEventListener('mousedown', () => {
  if (typeof cholita.shoot === 'function') cholita.shoot();
});
addEventListener('mousemove', (e) => {
  const screenX = e.clientX;
  const playerScreenX = cholita.x - camera.x + cholita.w * 0.5;
  cholita.facing = screenX >= playerScreenX ? 1 : -1;
});

// ========= Dibujar escena =========
function drawScene() {
  const w = canvas.width, h = canvas.height;

  // Cielo base
  ctx.fillStyle = '#405988';
  ctx.fillRect(0, 0, w, h);

  // Fondo (fondo.jpg) — más ancho para disimular uniones
  if (fondoLoaded) {
    const scaleH = h / fondoImg.height;
    const imgW = fondoImg.width * scaleH * BG_TILE_FACTOR;
    const imgH = h;
    const parallax = camera.x * 0.25;
    let startX = -((parallax % imgW) + imgW);
    for (let x = startX; x < w + imgW; x += imgW) {
      ctx.drawImage(fondoImg, Math.floor(x), 0, Math.floor(imgW), imgH);
    }
  }

  // Casas — ancladas abajo, más altas y con tiles largos
  if (casasLoaded) {
    const targetH = Math.floor(h * HOUSES_HEIGHT);
    const scale = targetH / casasImg.height;
    const imgW = casasImg.width * scale * HOUSES_WIDTH_FACTOR;
    const imgH = targetH;
    const yPos = h - imgH;
    const mOff = -((camera.x * 0.20) % imgW);

    for (let x = mOff - imgW; x < w + imgW; x += imgW) {
      ctx.drawImage(casasImg, Math.floor(x), Math.floor(yPos), Math.floor(imgW), Math.floor(imgH));
    }

    // Suelo (baldosas) pegado al borde inferior
    ctx.fillStyle = '#3a3a3a';
    const tileW = 40;
    const off = -((camera.x) % tileW);
    const tileY = groundY() - (GROUND_MARGIN - 8); // queda justo al borde
    for (let x = off; x < w; x += tileW) {
      ctx.fillRect(Math.floor(x), tileY, 20, 8);
    }
  }

  // Franja jugable (toggle con 'B')
  if (SHOW_BAND) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#2a59cf';
    ctx.fillRect(0, WALK.top, w, WALK.bottom - WALK.top);
    ctx.restore();
  }

  // Marcadores de distancia (toggle con 'M')
  if (SHOW_MARKERS) {
    ctx.fillStyle = '#415a77';
    for (let mx = 200; mx <= LEVEL_WIDTH; mx += 200) {
      const sx = Math.floor(mx - camera.x);
      if (sx >= -6 && sx <= w + 6) ctx.fillRect(sx, WALK.top - 40, 4, 40);
    }
  }
}

// ========= Loop =========
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  cholita.update(keys, dt);
  cholita.x = clamp(cholita.x, 0, LEVEL_WIDTH - cholita.w);

  bullets.forEach(b => b.update(dt));
  for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].dead) bullets.splice(i, 1);

  const target = clamp(
    cholita.x + cholita.w * 0.5 - canvas.width * 0.35,
    0,
    Math.max(0, LEVEL_WIDTH - canvas.width)
  );
  camera.x += (target - camera.x) * 0.12;

  drawScene();
  bullets.forEach(b => b.draw());
  cholita.draw(ctx, camera.x);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ========= Controles extra =========
addEventListener('keydown', e => {
  if (e.code === 'KeyK') cholita.vx = cholita.facing * (cholita.speed * 1.8); // dash
  if (e.code === 'KeyJ' || e.code === 'Space') if (typeof cholita.shoot === 'function') cholita.shoot();
  if (e.code === 'KeyW' || e.code === 'ArrowUp') if (typeof cholita.jump === 'function') cholita.jump();
});

// Pausa suave
let paused = false;
addEventListener('blur', () => { paused = true; });
addEventListener('focus', () => { last = performance.now(); paused = false; });
