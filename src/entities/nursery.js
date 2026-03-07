/**
 * Nursery Background - rich, cinematic nursery environment with:
 * - Multi-layered night sky with nebula-like gradients
 * - Animated god rays / volumetric light beams
 * - Enhanced star field with glow halos
 * - Detailed crib with wood grain texture
 * - Soft ambient lighting and atmospheric effects
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/renderer.js';
import { lerp, clamp } from '../engine/utils.js';

export class Nursery {
    constructor() {
        this.time = 0;
        this.lightCycle = 0;
        this.nightlightGlow = 0;
        this.starPositions = [];
        for (let i = 0; i < 40; i++) {
            this.starPositions.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * 140,
                size: Math.random() * 1.8 + 0.3,
                twinkleSpeed: Math.random() * 2 + 0.5,
                twinkleOffset: Math.random() * Math.PI * 2,
                hue: Math.random() * 40 + 30 // 30-70 (warm yellows to whites)
            });
        }

        // God ray properties
        this.godRays = [];
        for (let i = 0; i < 4; i++) {
            this.godRays.push({
                angle: Math.random() * 0.6 - 0.3,
                width: Math.random() * 30 + 15,
                alpha: Math.random() * 0.03 + 0.01,
                speed: Math.random() * 0.15 + 0.05,
                offset: Math.random() * Math.PI * 2
            });
        }

        // Firefly particles
        this.fireflies = [];
        for (let i = 0; i < 6; i++) {
            this.fireflies.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GAME_HEIGHT * 0.3 + 20,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 5,
                phase: Math.random() * Math.PI * 2,
                size: Math.random() * 1.5 + 0.5
            });
        }
    }

    update(dt, gameTime) {
        this.time += dt;
        this.lightCycle = clamp(gameTime / 180, 0, 1);
        this.nightlightGlow = 0.5 + 0.5 * Math.sin(this.time * 0.8);

        // Update fireflies
        for (const ff of this.fireflies) {
            ff.x += ff.vx * dt;
            ff.y += ff.vy * dt;
            ff.vx += (Math.random() - 0.5) * dt * 10;
            ff.vy += (Math.random() - 0.5) * dt * 8;
            ff.vx *= 0.98;
            ff.vy *= 0.98;

            if (ff.x < 10) ff.vx = Math.abs(ff.vx);
            if (ff.x > GAME_WIDTH - 10) ff.vx = -Math.abs(ff.vx);
            if (ff.y < 10) ff.vy = Math.abs(ff.vy);
            if (ff.y > GAME_HEIGHT * 0.4) ff.vy = -Math.abs(ff.vy);
        }
    }

    draw(ctx) {
        this._drawBackground(ctx);
        this._drawNebula(ctx);
        this._drawStars(ctx);
        this._drawFireflies(ctx);
        this._drawGodRays(ctx);
        this._drawCrib(ctx);
        this._drawNightlightGlow(ctx);
        this._drawMobileHanger(ctx);
        this._drawVignette(ctx);
    }

    _drawBackground(ctx) {
        // Deep indigo/navy gradient with richer color depth
        const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        grad.addColorStop(0, '#080820');
        grad.addColorStop(0.15, '#0C0C30');
        grad.addColorStop(0.35, '#121245');
        grad.addColorStop(0.55, '#181858');
        grad.addColorStop(0.75, '#141450');
        grad.addColorStop(1, '#0A0A20');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Warm center glow (baby illumination)
        const glow = ctx.createRadialGradient(
            GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 20,
            GAME_WIDTH / 2, GAME_HEIGHT * 0.38, GAME_WIDTH * 0.85
        );
        glow.addColorStop(0, 'rgba(255, 200, 120, 0.08)');
        glow.addColorStop(0.3, 'rgba(200, 160, 100, 0.04)');
        glow.addColorStop(0.6, 'rgba(120, 100, 80, 0.02)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    _drawNebula(ctx) {
        // Subtle aurora/nebula-like wisps in the upper sky
        const t = this.time * 0.15;

        // Purple wisp
        ctx.globalAlpha = 0.025 + 0.01 * Math.sin(t);
        const nebula1 = ctx.createRadialGradient(
            GAME_WIDTH * 0.3 + Math.sin(t) * 20, 60, 10,
            GAME_WIDTH * 0.3, 60, 100
        );
        nebula1.addColorStop(0, '#6040a0');
        nebula1.addColorStop(0.5, '#4030a0');
        nebula1.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula1;
        ctx.fillRect(0, 0, GAME_WIDTH, 200);

        // Teal wisp
        ctx.globalAlpha = 0.02 + 0.008 * Math.sin(t * 1.3 + 1);
        const nebula2 = ctx.createRadialGradient(
            GAME_WIDTH * 0.7 + Math.cos(t * 0.8) * 25, 80, 10,
            GAME_WIDTH * 0.7, 80, 80
        );
        nebula2.addColorStop(0, '#205060');
        nebula2.addColorStop(0.5, '#183848');
        nebula2.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula2;
        ctx.fillRect(0, 0, GAME_WIDTH, 200);

        ctx.globalAlpha = 1;
    }

    _drawStars(ctx) {
        const t = this.lightCycle;
        const baseAlpha = 0.35 + t * 0.45;

        for (const star of this.starPositions) {
            const twinkle = 0.4 + 0.6 * Math.sin(this.time * star.twinkleSpeed + star.twinkleOffset);

            // Star glow halo
            ctx.globalAlpha = baseAlpha * twinkle * 0.15;
            const haloGrad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 5);
            haloGrad.addColorStop(0, `hsl(${star.hue}, 80%, 90%)`);
            haloGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = haloGrad;
            ctx.fillRect(star.x - star.size * 5, star.y - star.size * 5, star.size * 10, star.size * 10);

            // Star core
            ctx.globalAlpha = baseAlpha * twinkle;
            ctx.fillStyle = `hsl(${star.hue}, 60%, 90%)`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Crescent moon with rich glow
        ctx.save();
        const moonAlpha = 0.75 + 0.2 * Math.sin(this.time * 0.3);
        ctx.globalAlpha = moonAlpha;

        // Moon glow halo (outer)
        const moonGlow2 = ctx.createRadialGradient(GAME_WIDTH - 58, 48, 8, GAME_WIDTH - 58, 48, 60);
        moonGlow2.addColorStop(0, 'rgba(255, 235, 200, 0.12)');
        moonGlow2.addColorStop(0.5, 'rgba(255, 220, 180, 0.04)');
        moonGlow2.addColorStop(1, 'rgba(255, 220, 180, 0)');
        ctx.fillStyle = moonGlow2;
        ctx.fillRect(GAME_WIDTH - 120, -10, 120, 120);

        // Moon body
        const moonGrad = ctx.createRadialGradient(GAME_WIDTH - 62, 44, 3, GAME_WIDTH - 58, 48, 22);
        moonGrad.addColorStop(0, '#FFF8E8');
        moonGrad.addColorStop(0.5, '#F5E6C8');
        moonGrad.addColorStop(1, '#E0D0A8');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(GAME_WIDTH - 58, 48, 21, 0, Math.PI * 2);
        ctx.fill();

        // Moon shadow for crescent
        ctx.fillStyle = '#0C0C30';
        ctx.beginPath();
        ctx.arc(GAME_WIDTH - 47, 44, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _drawFireflies(ctx) {
        for (const ff of this.fireflies) {
            const pulse = 0.3 + 0.7 * Math.max(0, Math.sin(this.time * 2 + ff.phase));

            // Outer glow
            ctx.globalAlpha = pulse * 0.15;
            const ffGlow = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, 12);
            ffGlow.addColorStop(0, 'rgba(255, 240, 150, 0.6)');
            ffGlow.addColorStop(1, 'rgba(255, 240, 150, 0)');
            ctx.fillStyle = ffGlow;
            ctx.fillRect(ff.x - 12, ff.y - 12, 24, 24);

            // Core
            ctx.globalAlpha = pulse * 0.6;
            ctx.fillStyle = '#FFF8D0';
            ctx.beginPath();
            ctx.arc(ff.x, ff.y, ff.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    _drawGodRays(ctx) {
        // Subtle volumetric light beams from moon area
        const moonX = GAME_WIDTH - 58;
        const moonY = 48;

        for (const ray of this.godRays) {
            const alpha = ray.alpha * (0.6 + 0.4 * Math.sin(this.time * ray.speed + ray.offset));
            ctx.globalAlpha = alpha;

            ctx.save();
            ctx.translate(moonX, moonY);
            ctx.rotate(ray.angle + Math.sin(this.time * 0.1 + ray.offset) * 0.05);

            const rayGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
            rayGrad.addColorStop(0, 'rgba(255, 230, 180, 0.4)');
            rayGrad.addColorStop(0.3, 'rgba(200, 190, 160, 0.15)');
            rayGrad.addColorStop(1, 'rgba(200, 190, 160, 0)');
            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(-2, 0);
            ctx.lineTo(-ray.width, GAME_HEIGHT);
            ctx.lineTo(ray.width, GAME_HEIGHT);
            ctx.lineTo(2, 0);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }

    _drawCrib(ctx) {
        const cx = GAME_WIDTH * 0.5;
        const cribTop = GAME_HEIGHT * 0.12;
        const cribBottom = GAME_HEIGHT * 0.92;
        const cw = GAME_WIDTH * 0.92;
        const ch = cribBottom - cribTop;

        // Crib shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(cx, cribBottom + 16, cw / 2 + 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // === MATTRESS ===
        const mattTop = cribTop + 20;
        const mattBottom = cribBottom - 15;
        const mattLeft = cx - cw / 2 + 15;
        const mattRight = cx + cw / 2 - 15;
        const mattW = mattRight - mattLeft;
        const mattH = mattBottom - mattTop;

        const mattGrad = ctx.createLinearGradient(mattLeft, mattTop, mattLeft, mattBottom);
        mattGrad.addColorStop(0, '#f8f2ea');
        mattGrad.addColorStop(0.3, '#f0e8dc');
        mattGrad.addColorStop(0.7, '#e8ddd0');
        mattGrad.addColorStop(1, '#e0d4c4');
        ctx.fillStyle = mattGrad;
        this._roundRect(ctx, mattLeft, mattTop, mattW, mattH, 16);
        ctx.fill();

        // Quilted pattern
        ctx.strokeStyle = 'rgba(200, 185, 160, 0.2)';
        ctx.lineWidth = 1;
        for (let y = mattTop + 30; y < mattBottom - 20; y += 40) {
            ctx.beginPath();
            ctx.moveTo(mattLeft + 10, y);
            ctx.quadraticCurveTo(cx, y + 5 * Math.sin(y * 0.02), mattRight - 10, y);
            ctx.stroke();
        }

        // === PILLOW ===
        const pillowY = cribTop + 45;
        // Pillow shadow
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        ctx.beginPath();
        ctx.ellipse(cx + 2, pillowY + 2, 80, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        const pillowGrad = ctx.createRadialGradient(cx - 10, pillowY - 5, 8, cx, pillowY, 82);
        pillowGrad.addColorStop(0, '#ffffff');
        pillowGrad.addColorStop(0.4, '#faf6f2');
        pillowGrad.addColorStop(0.8, '#f0ece4');
        pillowGrad.addColorStop(1, '#e4dcd0');
        ctx.fillStyle = pillowGrad;
        this._roundRect(ctx, cx - 78, pillowY - 30, 156, 60, 26);
        ctx.fill();

        // Pillow stitching
        ctx.strokeStyle = 'rgba(180, 170, 150, 0.18)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        this._roundRect(ctx, cx - 68, pillowY - 22, 136, 44, 20);
        ctx.stroke();
        ctx.setLineDash([]);

        // === CRIB FRAME ===
        const woodGrad = ctx.createLinearGradient(cx - cw / 2, cribTop, cx + cw / 2, cribTop);
        woodGrad.addColorStop(0, '#7A5A10');
        woodGrad.addColorStop(0.15, '#8B6914');
        woodGrad.addColorStop(0.3, '#A07830');
        woodGrad.addColorStop(0.5, '#B8892C');
        woodGrad.addColorStop(0.7, '#A07830');
        woodGrad.addColorStop(0.85, '#8B6914');
        woodGrad.addColorStop(1, '#7A5A10');

        ctx.fillStyle = woodGrad;

        // Top rail with subtle 3D bevel
        this._roundRect(ctx, cx - cw / 2, cribTop, cw, 13, 6);
        ctx.fill();
        // Rail highlight
        ctx.fillStyle = 'rgba(255, 220, 150, 0.15)';
        this._roundRect(ctx, cx - cw / 2 + 2, cribTop + 1, cw - 4, 5, 3);
        ctx.fill();

        // Bottom rail
        ctx.fillStyle = woodGrad;
        this._roundRect(ctx, cx - cw / 2, cribBottom - 5, cw, 13, 6);
        ctx.fill();

        // Side rails
        const sideW = 11;
        const sideGrad = ctx.createLinearGradient(cx - cw / 2, 0, cx - cw / 2 + sideW, 0);
        sideGrad.addColorStop(0, '#7A5A10');
        sideGrad.addColorStop(0.3, '#A07830');
        sideGrad.addColorStop(0.7, '#8B6914');
        sideGrad.addColorStop(1, '#7A5A10');
        ctx.fillStyle = sideGrad;
        ctx.fillRect(cx - cw / 2, cribTop, sideW, ch);
        ctx.fillRect(cx + cw / 2 - sideW, cribTop, sideW, ch);

        // Vertical slats
        ctx.strokeStyle = '#9B7520';
        ctx.lineWidth = 3;
        for (let x = cx - cw / 2 + 20; x < cx + cw / 2 - 10; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, cribTop);
            ctx.lineTo(x, cribTop + 20);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, cribBottom - 5);
            ctx.lineTo(x, cribBottom + 7);
            ctx.stroke();
        }

        // Side slats
        for (let y = cribTop + 25; y < cribBottom - 15; y += 20) {
            ctx.beginPath();
            ctx.moveTo(cx - cw / 2, y);
            ctx.lineTo(cx - cw / 2 + sideW + 3, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + cw / 2 - sideW - 3, y);
            ctx.lineTo(cx + cw / 2, y);
            ctx.stroke();
        }

        // Corner posts (decorative knobs) with 3D effect
        [-1, 1].forEach(side => {
            const kx = cx + side * (cw / 2 - 5);
            const ky = cribTop - 3;
            const knobGrad = ctx.createRadialGradient(kx - 2, ky - 2, 1, kx, ky, 8);
            knobGrad.addColorStop(0, '#D4A840');
            knobGrad.addColorStop(0.5, '#B8892C');
            knobGrad.addColorStop(1, '#8B6914');
            ctx.fillStyle = knobGrad;
            ctx.beginPath();
            ctx.arc(kx, ky, 8, 0, Math.PI * 2);
            ctx.fill();
            // Knob highlight
            ctx.fillStyle = 'rgba(255, 230, 170, 0.3)';
            ctx.beginPath();
            ctx.arc(kx - 2, ky - 2, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Crib legs
        const legGrad = ctx.createLinearGradient(0, cribBottom + 5, 0, cribBottom + 25);
        legGrad.addColorStop(0, '#8B6914');
        legGrad.addColorStop(1, '#6B4A08');
        ctx.fillStyle = legGrad;
        ctx.fillRect(cx - cw / 2 - 2, cribBottom + 5, 15, 22);
        ctx.fillRect(cx + cw / 2 - 13, cribBottom + 5, 15, 22);
    }

    _drawNightlightGlow(ctx) {
        const x = 28;
        const y = GAME_HEIGHT * 0.84;
        const intensity = 0.1 + 0.05 * this.nightlightGlow;
        const radius = 90 + 25 * this.nightlightGlow;

        // Outer glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, `rgba(255, 220, 150, ${intensity})`);
        glow.addColorStop(0.3, `rgba(255, 200, 120, ${intensity * 0.5})`);
        glow.addColorStop(0.6, `rgba(255, 190, 100, ${intensity * 0.2})`);
        glow.addColorStop(1, 'rgba(255, 190, 100, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, GAME_HEIGHT * 0.65, 220, GAME_HEIGHT * 0.35);

        // Nightlight bulb glow
        const bulbGlow = ctx.createRadialGradient(x, y, 0, x, y, 10);
        bulbGlow.addColorStop(0, `rgba(255, 240, 200, ${0.6 + 0.3 * this.nightlightGlow})`);
        bulbGlow.addColorStop(0.5, `rgba(255, 230, 180, ${0.3 + 0.2 * this.nightlightGlow})`);
        bulbGlow.addColorStop(1, 'rgba(255, 220, 160, 0)');
        ctx.fillStyle = bulbGlow;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Nightlight core
        ctx.fillStyle = `rgba(255, 240, 200, ${0.5 + 0.3 * this.nightlightGlow})`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawMobileHanger(ctx) {
        const cx = GAME_WIDTH * 0.5;
        const cy = GAME_HEIGHT * 0.06;

        // String from top
        ctx.strokeStyle = 'rgba(200, 200, 220, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        // Cross bar with gradient
        const barGrad = ctx.createLinearGradient(cx - 42, cy, cx + 42, cy);
        barGrad.addColorStop(0, 'rgba(200, 200, 220, 0.3)');
        barGrad.addColorStop(0.5, 'rgba(230, 230, 245, 0.5)');
        barGrad.addColorStop(1, 'rgba(200, 200, 220, 0.3)');
        ctx.strokeStyle = barGrad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 42, cy);
        ctx.lineTo(cx + 42, cy);
        ctx.stroke();

        // Hanging shapes with gentle sway
        const shapes = [
            { ox: -35, color: 'rgba(255, 170, 185, 0.6)', glow: 'rgba(255, 170, 185, 0.1)', type: 'star' },
            { ox: -12, color: 'rgba(170, 210, 255, 0.6)', glow: 'rgba(170, 210, 255, 0.1)', type: 'circle' },
            { ox: 12, color: 'rgba(170, 255, 200, 0.6)', glow: 'rgba(170, 255, 200, 0.1)', type: 'moon' },
            { ox: 35, color: 'rgba(255, 255, 170, 0.6)', glow: 'rgba(255, 255, 170, 0.1)', type: 'star' },
        ];

        for (const shape of shapes) {
            const sx = cx + shape.ox + Math.sin(this.time * 0.5 + shape.ox) * 3;
            const sy = cy + 19 + Math.abs(Math.sin(this.time * 0.3 + shape.ox * 0.1)) * 3;

            // Thread
            ctx.strokeStyle = 'rgba(200, 200, 220, 0.25)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(cx + shape.ox, cy);
            ctx.lineTo(sx, sy - 5);
            ctx.stroke();

            // Shape glow
            const shapeGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 10);
            shapeGlow.addColorStop(0, shape.glow);
            shapeGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = shapeGlow;
            ctx.fillRect(sx - 10, sy - 10, 20, 20);

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(Math.sin(this.time * 0.5) * 0.1 + shape.ox * 0.003);
            ctx.fillStyle = shape.color;

            if (shape.type === 'star') {
                this._drawTinyStar(ctx, 0, 0, 5.5);
            } else if (shape.type === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (shape.type === 'moon') {
                ctx.beginPath();
                ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#0C0C30';
                ctx.beginPath();
                ctx.arc(2, -1, 3.8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    _drawVignette(ctx) {
        // Stronger, more cinematic vignette
        const grad = ctx.createRadialGradient(
            GAME_WIDTH / 2, GAME_HEIGHT * 0.42, GAME_HEIGHT * 0.22,
            GAME_WIDTH / 2, GAME_HEIGHT * 0.42, GAME_HEIGHT * 0.72
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.7, 'rgba(5, 3, 15, 0.3)');
        grad.addColorStop(1, 'rgba(5, 3, 15, 0.6)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    _drawTinyStar(ctx, x, y, r) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const outerX = x + Math.cos(angle) * r;
            const outerY = y + Math.sin(angle) * r;
            const innerAngle = angle + Math.PI / 5;
            const innerX = x + Math.cos(innerAngle) * r * 0.4;
            const innerY = y + Math.sin(innerAngle) * r * 0.4;
            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
