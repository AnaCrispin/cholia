import fondoImgSrc from '../assets/nivel1/fondo.jpg';
import casasImgSrc from '../assets/nivel1/casas.png';
import Cholita from '../entities/cholita.js';

export default class Level1Scene {
    constructor({ canvas, ctx, camera }) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.camera = camera;

        // Config original
        this.BAND_HEIGHT = 0.20;
        this.GROUND_MARGIN = 8;
        this.BG_TILE_FACTOR = 1.8;
        this.HOUSES_HEIGHT = 0.60;
        this.HOUSES_WIDTH_FACTOR = 3.5;

        this.SHOW_BAND = false;
        this.SHOW_MARKERS = false;

        this.LEVEL_WIDTH = 20000;
        this.WALK = { top: 0, bottom: 0 };

        // Player
        this.bullets = [];
        this.cholita = new Cholita(120, 0, {
            speed: 320, vSpeed: 220, jumpSpeed: 800, gravity: 2200,
            laneTop: 0, laneBottom: 0,
            onShoot: ({ x, y, dir }) => this.bullets.push(new Bullet(x, y, dir, this.camera, this.canvas))
        });

        // Fondos
        this.bg = new Image(); this.bgLoaded = false; this.bg.onload = () => this.bgLoaded = true; this.bg.src = fondoImgSrc;
        this.casas = new Image(); this.casasLoaded = false; this.casas.onload = () => this.casasLoaded = true; this.casas.src = casasImgSrc;
    }

    init() { /* nada */ }
    destroy() { /* nada */ }

    groundY = () => this.canvas.height - this.GROUND_MARGIN;

    resize() {
        const h = this.canvas.height;
        const bottom = this.groundY();
        const band = Math.floor(h * this.BAND_HEIGHT);
        this.WALK.bottom = bottom;
        this.WALK.top = Math.max(0, bottom - band);

        this.cholita.laneTop = this.WALK.top;
        this.cholita.laneBottom = this.WALK.bottom;

        if (this.cholita.onGround) {
            const newBottom = clamp(this.cholita.bottom, this.WALK.top, this.WALK.bottom);
            this.cholita.groundY = newBottom;
            this.cholita.bottom = newBottom;
        } else {
            this.cholita.groundY = this.WALK.bottom;
        }
        // Posición inicial al suelo
        this.cholita.bottom = this.WALK.bottom;
        this.cholita.groundY = this.WALK.bottom;
    }

    onKeyDown(e) {
        if (e.code === 'KeyB') this.SHOW_BAND = !this.SHOW_BAND;
        if (e.code === 'KeyM') this.SHOW_MARKERS = !this.SHOW_MARKERS;
        if (e.code === 'KeyK') this.cholita.vx = this.cholita.facing * (this.cholita.speed * 1.8);
        if (e.code === 'KeyJ' || e.code === 'Space') this.cholita.shoot?.();
        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.cholita.jump?.();
    }
    onPointerDown() { this.cholita.shoot?.(); }
    onPointerMove(e) {
        const screenX = e.clientX;
        const playerScreenX = this.cholita.x - this.camera.x + this.cholita.w * 0.5;
        this.cholita.facing = screenX >= playerScreenX ? 1 : -1;
    }

    update(dt, { keys }) {
        this.cholita.update(keys, dt);
        this.cholita.x = clamp(this.cholita.x, 0, this.LEVEL_WIDTH - this.cholita.w);

        // Balas
        this.bullets.forEach(b => b.update(dt));
        for (let i = this.bullets.length - 1; i >= 0; i--) if (this.bullets[i].dead) this.bullets.splice(i, 1);

        // Cámara
        const target = clamp(
            this.cholita.x + this.cholita.w * 0.5 - this.canvas.width * 0.35,
            0,
            Math.max(0, this.LEVEL_WIDTH - this.canvas.width)
        );
        this.camera.x += (target - this.camera.x) * 0.12;
    }

    draw(ctx) {
        const w = this.canvas.width, h = this.canvas.height;

        // Cielo
        ctx.fillStyle = '#405988';
        ctx.fillRect(0, 0, w, h);

        // Fondo
        if (this.bgLoaded) {
            const scaleH = h / this.bg.height;
            const imgW = this.bg.width * scaleH * this.BG_TILE_FACTOR;
            const imgH = h;
            const parallax = this.camera.x * 0.25;
            let startX = -((parallax % imgW) + imgW);
            for (let x = startX; x < w + imgW; x += imgW) ctx.drawImage(this.bg, Math.floor(x), 0, Math.floor(imgW), imgH);
        }

        // Casas
        if (this.casasLoaded) {
            const targetH = Math.floor(h * this.HOUSES_HEIGHT);
            const scale = targetH / this.casas.height;
            const imgW = this.casas.width * scale * this.HOUSES_WIDTH_FACTOR;
            const imgH = targetH;
            const yPos = h - imgH;
            const mOff = -((this.camera.x * 0.20) % imgW);
            for (let x = mOff - imgW; x < w + imgW; x += imgW) ctx.drawImage(this.casas, Math.floor(x), Math.floor(yPos), Math.floor(imgW), Math.floor(imgH));
        }

        // Banda jugable
        if (this.SHOW_BAND) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#2a59cf';
            ctx.fillRect(0, this.WALK.top, w, this.WALK.bottom - this.WALK.top);
            ctx.restore();
        }

        // Baldosas
        ctx.fillStyle = '#3a3a3a';
        const tileW = 40;
        const off = -((this.camera.x) % tileW);
        const tileY = this.groundY() - (this.GROUND_MARGIN - 8);
        for (let x = off; x < w; x += tileW) ctx.fillRect(Math.floor(x), tileY, 20, 8);

        // Marcadores
        if (this.SHOW_MARKERS) {
            ctx.fillStyle = '#415a77';
            for (let mx = 200; mx <= this.LEVEL_WIDTH; mx += 200) {
                const sx = Math.floor(mx - this.camera.x);
                if (sx >= -6 && sx <= w + 6) ctx.fillRect(sx, this.WALK.top - 40, 4, 40);
            }
        }

        // Balas + Jugador
        this.bullets.forEach(b => b.draw(ctx));
        this.cholita.draw(ctx, this.camera.x);
    }
}

/* ====== Utiles locales ====== */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

class Bullet {
    constructor(x, y, dir, camera, canvas) {
        this.x = x; this.y = y; this.w = 20; this.h = 8;
        this.vx = dir * 880; this.dead = false;
        this.camera = camera; this.canvas = canvas;
    }
    update(dt) {
        this.x += this.vx * dt;
        if (this.x < this.camera.x - 300 || this.x > this.camera.x + this.canvas.width + 300) this.dead = true;
    }
    draw(ctx) {
        ctx.fillStyle = '#222120ff';
        ctx.fillRect(Math.floor(this.x - this.camera.x), Math.floor(this.y), this.w, this.h);
    }
}
