import fondoImgSrc from '../assets/nivel1/fondo.jpg';
import casasImgSrc from '../assets/nivel1/casas.png';
import Cholita from '../entities/cholita.js';

// Portada / UI (solo cholita)
import portadaImgSrc from '../assets/ui/cholitaPortada.png';
import moonImgSrc from '../assets/ui/luna.png';

// ======= Ajustes finos de layout =======
const GROUND_PAD = 0;   // baja/sube globalmente el “piso” visual
const FOOT_OFFSET_PX = 10;  // corrige margen transparente inferior del PNG
const BOB_PX = 4;   // amplitud del bobbing de la portada
const CHOLITA_COL_X = 0.30; // columna horizontal (0..1) para la cholita
const TITLE_COL_X = 0.66; // columna del título/CTA

export default class MenuScene {
    constructor({ canvas, ctx, camera, onStart }) {
        this.canvas = canvas; this.ctx = ctx; this.camera = camera; this.onStart = onStart;

        this.titleTime = 0; this.fade = 1; this.enterPulse = 0;
        this.WALK = { top: 0, bottom: 0 };

        // Ocultar HUD en el menú
        this._hud = document.querySelector('.hud');
        if (this._hud) { this._oldHudDisplay = this._hud.style.display; this._hud.style.display = 'none'; }

        this.cholita = new Cholita(0, 0, { speed: 0, vSpeed: 0, jumpSpeed: 0, gravity: 0, laneTop: 0, laneBottom: 0 });

        this.bg = this._loadImg(fondoImgSrc);
        this.casas = this._loadImg(casasImgSrc);
        this.moon = this._loadImg(moonImgSrc);
        this.portada = this._loadImg(portadaImgSrc);

        this.particles = [];
        this._initParticles(60);

        // Niebla pixel‑art (dos capas)
        this.fog = { pixelSizeA: 3, pixelSizeB: 2, offsetA: 0, offsetB: 0, speedA: 8, speedB: 12, patternA: null, patternB: null };
        this._createFogPatternA(); this._createFogPatternB();
    }

    destroy() { if (this._hud) this._hud.style.display = this._oldHudDisplay ?? ''; }

    _loadImg(src) { const i = new Image(); i.loaded = false; i.onload = () => i.loaded = true; i.src = src; return i; }

    _initParticles(n) {
        this.particles.length = 0;
        for (let i = 0; i < n; i++) {
            this.particles.push({ x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height, r: 0.8 + Math.random() * 2, s: 6 + Math.random() * 12, dx: (Math.random() - 0.5) * 10, a: 0.16 + Math.random() * 0.24 });
        }
    }

    _createFogPatternA() {
        const size = 32, c = document.createElement('canvas'); c.width = size; c.height = size;
        const g = c.getContext('2d'); g.clearRect(0, 0, size, size);
        for (let i = 0; i < 55; i++) { g.fillStyle = `rgba(220,220,230,${0.05 + Math.random() * 0.05})`; g.fillRect((Math.random() * size) | 0, (Math.random() * size) | 0, (Math.random() < 0.5 ? 1 : 2), (Math.random() < 0.5 ? 1 : 2)); }
        this.fog.patternA = this.ctx.createPattern(c, 'repeat');
    }
    _createFogPatternB() {
        const size = 48, c = document.createElement('canvas'); c.width = size; c.height = size;
        const g = c.getContext('2d'); g.clearRect(0, 0, size, size);
        for (let i = 0; i < 100; i++) { g.fillStyle = `rgba(210,210,220,${0.04 + Math.random() * 0.08})`; g.fillRect((Math.random() * size) | 0, (Math.random() * size) | 0, (Math.random() < 0.6 ? 2 : 1), (Math.random() < 0.6 ? 2 : 1)); }
        this.fog.patternB = this.ctx.createPattern(c, 'repeat');
    }

    resize() {
        const h = this.canvas.height, bottom = h - 8 - GROUND_PAD, band = Math.floor(h * 0.20);
        this.WALK.bottom = bottom; this.WALK.top = Math.max(0, bottom - band);
        this._initParticles(this.particles.length || 60);
    }

    onKeyDown(e) { if (e.code === 'Enter') this.onStart?.(); }
    onKeyUp() { } onPointerDown() { } onPointerMove() { }

    update(dt) {
        this.titleTime += dt; this.enterPulse += dt; this.camera.x = 0;

        // fallback pose por si no carga PNG
        const w = this.canvas.width, h = this.canvas.height;
        const baseX = Math.floor(w * 0.5 - this.cholita.w / 2);
        const baseBottom = this.WALK.bottom;
        this._pose = { x: baseX, bottom: baseBottom };

        if (this.fade > 0) this.fade = Math.max(0, this.fade - dt * 1.2);

        // Partículas
        for (const p of this.particles) {
            p.y -= p.s * dt * 0.25; p.x += Math.sin((this.titleTime + p.r) * 0.8) * 6 * dt + p.dx * dt * 0.08;
            if (p.y + p.r < -10) { p.y = this.canvas.height + 10; p.x = Math.random() * this.canvas.width; }
        }

        // Niebla
        this.fog.offsetA += dt * this.fog.speedA;
        this.fog.offsetB += dt * this.fog.speedB;
    }

    draw(ctx) {
        const w = this.canvas.width, h = this.canvas.height;

        // ===== Fondo base =====
        ctx.save(); ctx.fillStyle = '#1a203a'; ctx.fillRect(0, 0, w, h);
        if (this.bg.loaded) {
            const scaleH = h / this.bg.height, imgW = this.bg.width * scaleH * 1.9, imgH = h;
            let x0 = -((this.camera.x * 0.2 % imgW) + imgW);
            ctx.filter = 'blur(1.4px) brightness(0.85) saturate(0.9)';
            for (let x = x0; x < w + imgW; x += imgW) ctx.drawImage(this.bg, Math.floor(x), 0, Math.floor(imgW), imgH);
            ctx.filter = 'none';
        }
        if (this.casas.loaded) {
            const targetH = Math.floor(h * 0.60), scale = targetH / this.casas.height;
            const imgW = this.casas.width * scale * 3.5, imgH = targetH, yPos = h - imgH, off = -((this.camera.x * 0.25) % imgW);
            ctx.filter = 'blur(0.8px) brightness(0.92)';
            for (let x = off - imgW; x < w + imgW; x += imgW) ctx.drawImage(this.casas, Math.floor(x), yPos, Math.floor(imgW), imgH);
            ctx.filter = 'none';
        }
        if (this.moon?.loaded) {
            const mw = Math.min(200, w * 0.2), ratio = this.moon.height / this.moon.width;
            ctx.globalAlpha = 0.9; ctx.drawImage(this.moon, Math.floor(w * 0.78), Math.floor(h * 0.06), mw, mw * ratio); ctx.globalAlpha = 1;
        }
        ctx.restore();

        // ===== Niebla pixel‑art =====
        this._fogLayer(ctx, this.fog.patternA, this.fog.pixelSizeA, this.fog.offsetA, 0.14, Math.sin(this.titleTime * 0.5) * 6);
        this._fogLayer(ctx, this.fog.patternB, this.fog.pixelSizeB, this.fog.offsetB, 0.20, Math.cos(this.titleTime * 0.7) * 10);

        // ===== Cholita portada anclada al suelo =====
        if (this.portada?.loaded) {
            const ground = this.WALK.bottom;            // línea del piso
            const areaH = Math.min(h * 0.76, 860);       // altura deseada
            const ratio = this.portada.height / this.portada.width;
            const dw = Math.floor(areaH / ratio);
            const dh = Math.floor(areaH);

            const bob = Math.sin(this.titleTime * 1.6) * BOB_PX;
            const xCenter = Math.floor(w * CHOLITA_COL_X);
            const px = Math.floor(xCenter - dw / 2);

            // y = piso - alto + ajustes -> los pies tocan suelo
            let py = Math.floor(ground - dh + FOOT_OFFSET_PX + bob);
            if (py + dh < ground) py = ground - dh; // no “flote”

            ctx.save();
            ctx.shadowColor = 'rgba(160,120,255,0.9)'; ctx.shadowBlur = 34;
            ctx.drawImage(this.portada, px, py, dw, dh);
            ctx.restore();
        } else {
            const s = { x: this.cholita.x, y: this.cholita.y, bottom: this.cholita.bottom, vx: this.cholita.vx, vy: this.cholita.vy, facing: this.cholita.facing, onGround: this.cholita.onGround };
            this.cholita.x = Math.floor(w * CHOLITA_COL_X - this.cholita.w / 2); this.cholita.bottom = this.WALK.bottom;
            this.cholita.vx = 0; this.cholita.vy = 0; this.cholita.facing = 1; this.cholita.onGround = true;
            ctx.save(); ctx.shadowColor = 'rgba(160,120,255,0.85)'; ctx.shadowBlur = 28; this.cholita.draw(ctx, 0); ctx.restore();
            Object.assign(this.cholita, s);
        }

        // ===== Partículas =====
        for (const p of this.particles) {
            ctx.fillStyle = `rgba(180,140,255,${p.a})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }

        // ===== Título y CTA bonitos =====
        const titleX = w * TITLE_COL_X;
        const titleY = Math.floor(h * 0.18);

        // Cabecera “glass”
        this._drawGlassHeader(ctx, titleX, titleY, Math.floor(w * 0.50), 92);
        // Título con degradé, doble trazo y glow
        this._drawStyledTitle(ctx, 'La Cholita Embrujada', titleX, titleY);
        // CTA píldora animado
        const pulse = 0.85 + Math.sin(this.enterPulse * 3) * 0.15;
        this._drawCTA(ctx, 'Presiona ENTER para comenzar', titleX, Math.floor(titleY + 70), pulse);

        // ===== Scanlines + viñeta =====
        this._scanlines(ctx, w, h, 0.05);
        const rad = Math.hypot(w, h);
        const vign = ctx.createRadialGradient(w / 2, h / 2, rad * 0.25, w / 2, h / 2, rad * 0.65);
        vign.addColorStop(0, 'rgba(0,0,0,0)'); vign.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = vign; ctx.fillRect(0, 0, w, h);

        if (this.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${this.fade})`; ctx.fillRect(0, 0, w, h); }
        this.camera.x = 0;
    }

    // ===== Helpers de dibujo =====
    _fogLayer(ctx, pattern, px, off, alpha, yW) {
        if (!pattern) return; const w = this.canvas.width, h = this.canvas.height;
        ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = alpha;
        ctx.scale(px, px); ctx.translate(-(off / px), (yW / px)); ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, (w / px) + 64, (h / px) + 64); ctx.restore();
    }

    _scanlines(ctx, w, h, alpha = 0.05) {
        ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#000';
        for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1); ctx.restore();
    }

    _drawGlassHeader(ctx, cx, cy, w, h) {
        // Rect redondeado centrado (glass effect)
        const x = Math.floor(cx - w / 2);
        const y = Math.floor(cy - h / 2);
        ctx.save();

        // Fondo “vidrio” con leve gradiente
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, 'rgba(0,0,0,0.32)');
        g.addColorStop(1, 'rgba(0,0,0,0.18)');

        this._roundRect(ctx, x, y, w, h, 18);
        ctx.fillStyle = g;
        ctx.fill();

        // Borde exterior sutil
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.stroke();

        // Borde interior (highlight)
        this._roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 14);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.stroke();

        ctx.restore();
    }

    _drawCTA(ctx, text, x, y, pulse = 1) {
        // Botón píldora animado
        const padX = 24, padY = 12;
        ctx.save();
        ctx.font = '600 26px system-ui, Arial';
        const textW = ctx.measureText(text).width;
        const bw = Math.floor(textW + padX * 2);
        const bh = 48;
        const bx = Math.floor(x - bw / 2);
        const by = Math.floor(y - bh / 2);

        // Fondo degradé
        const g = ctx.createLinearGradient(bx, by, bx, by + bh);
        g.addColorStop(0, `rgba(120,100,220,${0.20 + 0.10 * pulse})`);
        g.addColorStop(1, `rgba(70,60,160,${0.20 + 0.10 * pulse})`);

        this._roundRect(ctx, bx, by, bw, bh, 24);
        ctx.fillStyle = g;
        ctx.fill();

        // Borde
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.stroke();

        // Texto con glow
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#eef0ff';
        ctx.fillText(text, x, y + 1);

        // Flechita ► animada (pequeño desliz)
        const dx = 6 * pulse;
        ctx.globalAlpha = 0.9;
        ctx.font = '700 22px system-ui, Arial';
        ctx.fillText('►', x + bw / 2 - padX + dx, y + 1);
        ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }

    _drawStyledTitle(ctx, text, x, y) {
        // Degradé principal
        const grad = ctx.createLinearGradient(0, y - 38, 0, y + 42);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.55, '#e9ecff');
        grad.addColorStop(1, '#cbd3ff');

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '800 72px system-ui, Arial';

        // Sombra base
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = 14;

        // Trazo 1 (oscuro, grueso)
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.strokeText(text, x, y);

        // Trazo 2 (claro sutil)
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.strokeText(text, x, y);

        // Relleno con degradé
        ctx.fillStyle = grad;
        ctx.fillText(text, x, y);

        // Halo suave violeta
        ctx.shadowColor = 'rgba(160,120,255,0.55)';
        ctx.shadowBlur = 30;
        ctx.globalAlpha = 0.6;
        ctx.fillText(text, x, y);
        ctx.restore();
    }
}
