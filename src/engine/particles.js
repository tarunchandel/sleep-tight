/**
 * Particle System - for dust motes, squash effects, shoo trails, etc.
 */
import { randFloat } from './utils.js';

class Particle {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.life = config.life || 1;
        this.maxLife = this.life;
        this.size = config.size || 3;
        this.sizeEnd = config.sizeEnd ?? 0;
        this.color = config.color || 'rgba(255,255,255,0.5)';
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 1;
        this.rotation = config.rotation || 0;
        this.rotationSpeed = config.rotationSpeed || 0;
        this.shape = config.shape || 'circle'; // 'circle', 'star', 'ring'
    }

    update(dt) {
        this.life -= dt;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotationSpeed * dt;
        return this.life > 0;
    }

    draw(ctx) {
        const t = 1 - this.life / this.maxLife;
        const size = this.size + (this.sizeEnd - this.size) * t;
        const alpha = Math.max(0, this.life / this.maxLife);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = alpha;

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.shape === 'star') {
            this._drawStar(ctx, size);
        } else if (this.shape === 'ring') {
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (this.shape === 'text') {
            ctx.font = `600 ${size}px Nunito`;
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.text || 'Z', 0, 0);
        }

        ctx.restore();
    }

    _drawStar(ctx, size) {
        ctx.beginPath();
        // 5-point star
        const innerRadius = size * 0.4;
        const outerRadius = size;
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    // ... (rest of class remains same, just adding specific emitter)

    /** Emit sleep Zzzs */
    emitZzz(x, y) {
        this.particles.push(new Particle(x, y, {
            vx: randFloat(-5, 5),
            vy: randFloat(-20, -10), // float up
            life: 2.5,
            size: randFloat(14, 20),
            sizeEnd: 25,
            color: 'rgba(255, 255, 255, 0.8)',
            shape: 'text',
            text: Math.random() > 0.5 ? 'Z' : 'z',
            rotation: randFloat(-0.2, 0.2),
            rotationSpeed: randFloat(-0.2, 0.2),
            friction: 0.98
        }));
    }

    emit(x, y, count, config) {
        for (let i = 0; i < count; i++) {
            // Check if config is function or object
            const cfg = typeof config === 'function' ? config(i) : { ...config };
            // Ensure particles get created correctly
            const p = new Particle(x, y, cfg);
            // If it's a text particle, ensure text property is passed
            if (cfg.text) p.text = cfg.text;
            this.particles.push(p);
        }
    }
    
    // ... existing burst and emitDust methods ...

    /** Emit a burst of particles in random directions */
    burst(x, y, count, baseConfig = {}) {
        for (let i = 0; i < count; i++) {
            const angle = randFloat(0, Math.PI * 2);
            const speed = randFloat(baseConfig.minSpeed || 30, baseConfig.maxSpeed || 120);
            
            const config = {
                ...baseConfig,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: randFloat(baseConfig.minSize || 2, baseConfig.maxSize || 6),
                life: randFloat(baseConfig.minLife || 0.3, baseConfig.maxLife || 0.8),
                rotation: randFloat(0, Math.PI * 2),
                rotationSpeed: randFloat(-3, 3),
            };

            const p = new Particle(x, y, config);
            this.particles.push(p);
        }
    }

    /** Ambient dust motes */
    emitDust(width, height) {
        if (this.particles.length > 50) return; // Limit dust count
        this.particles.push(new Particle(
            randFloat(0, width),
            randFloat(0, height),
            {
                vx: randFloat(-2, 2),
                vy: randFloat(-5, -1),
                size: randFloat(1, 3),
                sizeEnd: 0,
                life: randFloat(4, 10),
                color: 'rgba(255, 255, 200, 0.15)', // warmer dust
                friction: 1,
                shape: 'circle'
            }
        ));
    }

    update(dt) {
        this.particles = this.particles.filter(p => p.update(dt));
    }

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    }

    clear() {
        this.particles.length = 0;
    }
}
