import './style.css';
import Level1Scene from './scenes/Level1.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const camera = { x: 0 };
const keys = new Set();
let last = performance.now();
let current = null;
let paused = false;

// gestor de escena
function setScene(scene) {
  if (current && current.destroy) current.destroy();
  current = scene;
  if (current && current.init) current.init();
  onResize();
}

function onResize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  current?.resize?.();
}
addEventListener('resize', onResize);

// entradas
addEventListener('keydown', (e) => {
  keys.add(e.code);
  current?.onKeyDown?.(e);
});
addEventListener('keyup', (e) => {
  keys.delete(e.code);
  current?.onKeyUp?.(e);
});

// bucle principal
function loop(now) {
  const dt = paused ? 0 : Math.min(0.033, (now - last) / 1000);
  last = now;
  current?.update?.(dt, { keys, camera, canvas, ctx });
  current?.draw?.(ctx, { camera, canvas });
  requestAnimationFrame(loop);
}

// evento al iniciar sesión
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('menu').style.display = 'none';
  canvas.style.display = 'block';
  setScene(new Level1Scene({ canvas, ctx, camera }));
});

requestAnimationFrame(loop);
