// Carga de sprites (Vite resuelve la ruta final)
import idlePng from '../assets/cholitadefrente.png';
import run1Png from '../assets/cholitacaminando.png';
import run2Png from '../assets/cholitacaminando1.png';
import jumpPng from '../assets/cholitasaltando.png';
import shootPng from '../assets/cholitalanzando.png';

export default class Cholita {
    constructor(x, y, opts = {}) {
        // Hitbox/base física
        this.x = x; this.y = y;
        this.w = 72; this.h = 104;

        // Física
        this.vx = 0; this.vy = 0;
        this.facing = 1;           // 1 derecha, -1 izquierda
        this.onGround = true;
        this.hp = 3;

        // Config de movimiento
        this.speed = opts.speed ?? 320;     // lateral
        this.vSpeed = opts.vSpeed ?? 220;   // arriba/abajo en el lane
        this.jumpSpeed = opts.jumpSpeed ?? 800;
        this.gravity = opts.gravity ?? 2200;

        // Lane vertical
        this.laneTop = opts.laneTop ?? 0;
        this.laneBottom = opts.laneBottom ?? 0;
        this.groundY = this.y + this.h;

        // --- NUEVO: flag de movimiento dentro del lane para animación ---
        this.laneMove = 0; // -1 subiendo, 1 bajando, 0 quieta

        // Disparo
        this.cooldown = 1;
        this.shootFn = opts.onShoot || (() => { });
        this.shootAnimTime = 0;

        // Estado/animación
        this.state = 'idle'; // 'idle' | 'run' | 'jump'
        this.animTime = 0;
        this.runFps = 10;

        // Sprites
        this.sprites = {
            idle: this._loadImage(idlePng),
            run1: this._loadImage(run1Png),
            run2: this._loadImage(run2Png),
            jump: this._loadImage(jumpPng),
            shoot: this._loadImage(shootPng)
        };
    }

    _loadImage(src) {
        const img = new Image();
        img.src = src;
        img.loaded = false;
        img.onload = () => { img.loaded = true; };
        return img;
    }

    get bottom() { return this.y + this.h; }
    set bottom(v) { this.y = v - this.h; }

    handleInput(keys, dt) {
        // Lateral
        let ax = 0;
        if (keys.has('ArrowLeft') || keys.has('KeyA')) { ax = -1; this.facing = -1; }
        if (keys.has('ArrowRight') || keys.has('KeyD')) { ax = 1; this.facing = 1; }
        this.vx = ax * this.speed;

        // --- reset del flag de movimiento vertical por cuadro ---
        this.laneMove = 0;

        // Arriba/abajo solo en suelo (estilo Metal Slug)
        if (this.onGround) {
            let ay = 0;
            if (keys.has('ArrowUp') || keys.has('KeyW')) ay = -1;
            if (keys.has('ArrowDown') || keys.has('KeyS')) ay = 1;

            // Guardar intención para la animación
            this.laneMove = ay;

            // Desplazar dentro del lane
            this.bottom += ay * this.vSpeed * dt;
            if (this.bottom < this.laneTop) this.bottom = this.laneTop;
            if (this.bottom > this.laneBottom) this.bottom = this.laneBottom;

            // Mueve el “piso” personal con el lane
            this.groundY = this.bottom;
        }

        // Saltar (Espacio)
        if (keys.has('Space') && this.onGround) {
            this.vy = -this.jumpSpeed;
            this.onGround = false;
        }

        // Disparo (J o Ctrl izq)
        this.cooldown -= dt;
        if ((keys.has('KeyJ') || keys.has('ControlLeft')) && this.cooldown <= 0) {
            this.shoot();
            this.cooldown = 0.15;
        }
    }

    shoot() {
        this.shootAnimTime = 0.15; // 150 ms
        const bx = this.facing === 1 ? this.x + this.w : this.x - 10;
        const by = this.y + Math.floor(this.h * 0.4);
        this.shootFn({ x: bx, y: by, dir: this.facing });
    }

    update(keys, dt) {
        this.handleInput(keys, dt);

        // Integración X
        this.x += this.vx * dt;

        // Gravedad / salto
        if (!this.onGround) {
            this.vy += this.gravity * dt;
            this.y += this.vy * dt;

            if (this.bottom >= this.groundY) {
                this.bottom = this.groundY;
                this.vy = 0;
                this.onGround = true;
            }
        }

        // Temporizador de disparo
        if (this.shootAnimTime > 0) {
            this.shootAnimTime -= dt;
            if (this.shootAnimTime < 0) this.shootAnimTime = 0;
        }

        // --- Estado base (ahora cuenta movimiento vertical en el suelo como "run") ---
        if (!this.onGround) {
            this.state = 'jump';
        } else if (Math.abs(this.vx) > 1 || this.laneMove !== 0) {
            this.state = 'run';
        } else {
            this.state = 'idle';
        }

        this.animTime += dt;
    }

    draw(ctx, cameraX) {
        // Elegir sprite (prioridad: shoot en suelo > jump > run > idle)
        let img = null;
        if (this.shootAnimTime > 0 && this.onGround) img = this.sprites.shoot;
        else if (this.state === 'jump') img = this.sprites.jump;
        else if (this.state === 'run') {
            const frame = Math.floor(this.animTime * this.runFps) % 2;
            img = frame === 0 ? this.sprites.run1 : this.sprites.run2;
        } else img = this.sprites.idle;

        if (!img || !img.loaded) {
            ctx.fillStyle = '#7e2d86';
            ctx.fillRect(Math.floor(this.x - cameraX), Math.floor(this.y), this.w, this.h);
            return;
        }

        // Escalar al hitbox
        const scale = this.h / img.naturalHeight;
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;

        // Alinear por los pies
        const dy = Math.floor(this.y + this.h - dh);

        if (this.facing === -1) {
            ctx.save();
            const cx = Math.floor(this.x - cameraX) + Math.floor(this.w / 2);
            ctx.translate(cx, 0);
            ctx.scale(-1, 1);
            const dxFlip = -Math.floor(this.w / 2) - Math.floor(dw / 2);
            ctx.drawImage(img, dxFlip, dy, Math.floor(dw), Math.floor(dh));
            ctx.restore();
        } else {
            const dx = Math.floor(this.x - cameraX + (this.w - dw) / 2);
            ctx.drawImage(img, dx, dy, Math.floor(dw), Math.floor(dh));
        }
    }
}
