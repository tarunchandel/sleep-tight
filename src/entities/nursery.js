/**
 * Nursery Background - renders a cozy close-up of the baby's crib.
 * The crib takes 80% of the screen with warm, inviting colors.
 * Background is deep indigo/navy for contrast against the baby.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/renderer.js';
import { lerp, clamp } from '../engine/utils.js';

export class Nursery {
    constructor() {
        this.time = 0;
        this.lightCycle = 0;
        this.nightlightGlow = 0;
        this.starPositions = [];
        for (let i = 0; i < 30; i++) {
            this.starPositions.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * 120,
                size: Math.random() * 1.5 + 0.3,
                twinkleSpeed: Math.random() * 2 + 0.5,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
    }

    update(dt, gameTime) {
        this.time += dt;
        this.lightCycle = clamp(gameTime / 180, 0, 1);
        this.nightlightGlow = 0.5 + 0.5 * Math.sin(this.time * 0.8);
    }

    draw(ctx) {
        this._drawBackground(ctx);
        this._drawStars(ctx);
        this._drawCrib(ctx);
        this._drawNightlightGlow(ctx);
        this._drawMobileHanger(ctx);
        this._drawVignette(ctx);
    }

    _drawBackground(ctx) {
        // Deep indigo/navy gradient - contrasts well with baby's peach skin
        const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        grad.addColorStop(0, '#0a0a2e');   // Deep navy top
        grad.addColorStop(0.3, '#141440'); // Indigo
        grad.addColorStop(0.7, '#1a1a50'); // Purple-navy
        grad.addColorStop(1, '#0d0d25');   // Dark bottom
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Subtle radial glow from center (warm)
        const glow = ctx.createRadialGradient(
            GAME_WIDTH / 2, GAME_HEIGHT * 0.4, 30,
            GAME_WIDTH / 2, GAME_HEIGHT * 0.4, GAME_WIDTH * 0.8
        );
        glow.addColorStop(0, 'rgba(255, 200, 100, 0.06)');
        glow.addColorStop(0.5, 'rgba(180, 140, 80, 0.03)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    _drawStars(ctx) {
        const t = this.lightCycle;
        const baseAlpha = 0.3 + t * 0.5;
        for (const star of this.starPositions) {
            const twinkle = 0.4 + 0.6 * Math.sin(this.time * star.twinkleSpeed + star.twinkleOffset);
            ctx.globalAlpha = baseAlpha * twinkle;
            ctx.fillStyle = '#ffe8c0';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Crescent moon (top right)
        ctx.save();
        ctx.globalAlpha = 0.7 + 0.2 * Math.sin(this.time * 0.3);
        ctx.fillStyle = '#f5e6c8';
        ctx.beginPath();
        ctx.arc(GAME_WIDTH - 60, 50, 20, 0, Math.PI * 2);
        ctx.fill();
        // Moon shadow for crescent effect
        ctx.fillStyle = '#0a0a2e';
        ctx.beginPath();
        ctx.arc(GAME_WIDTH - 50, 46, 17, 0, Math.PI * 2);
        ctx.fill();
        // Moon glow
        const moonGlow = ctx.createRadialGradient(GAME_WIDTH - 60, 50, 5, GAME_WIDTH - 60, 50, 50);
        moonGlow.addColorStop(0, 'rgba(255, 230, 180, 0.15)');
        moonGlow.addColorStop(1, 'rgba(255, 230, 180, 0)');
        ctx.fillStyle = moonGlow;
        ctx.fillRect(GAME_WIDTH - 110, 0, 100, 100);
        ctx.restore();
    }

    _drawCrib(ctx) {
        const cx = GAME_WIDTH * 0.5;
        const cribTop = GAME_HEIGHT * 0.12;
        const cribBottom = GAME_HEIGHT * 0.92;
        const cw = GAME_WIDTH * 0.92;
        const ch = cribBottom - cribTop;

        // === CRIB SHADOW ===
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, cribBottom + 15, cw / 2 + 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // === MATTRESS (the main sleeping area) ===
        const mattTop = cribTop + 20;
        const mattBottom = cribBottom - 15;
        const mattLeft = cx - cw / 2 + 15;
        const mattRight = cx + cw / 2 - 15;
        const mattW = mattRight - mattLeft;
        const mattH = mattBottom - mattTop;

        // Mattress - soft cream/white, clearly different from baby
        const mattGrad = ctx.createLinearGradient(mattLeft, mattTop, mattLeft, mattBottom);
        mattGrad.addColorStop(0, '#f5efe6');   // Warm white
        mattGrad.addColorStop(0.3, '#ede5d8');  // Soft cream
        mattGrad.addColorStop(1, '#e0d6c6');    // Warm beige
        ctx.fillStyle = mattGrad;
        this._roundRect(ctx, mattLeft, mattTop, mattW, mattH, 15);
        ctx.fill();

        // Mattress subtle quilted pattern
        ctx.strokeStyle = 'rgba(200, 185, 160, 0.25)';
        ctx.lineWidth = 1;
        for (let y = mattTop + 30; y < mattBottom - 20; y += 40) {
            ctx.beginPath();
            ctx.moveTo(mattLeft + 10, y);
            ctx.quadraticCurveTo(cx, y + 5 * Math.sin(y * 0.02), mattRight - 10, y);
            ctx.stroke();
        }

        // === PILLOW ===
        const pillowY = cribTop + 45;
        const pillowGrad = ctx.createRadialGradient(cx, pillowY, 10, cx, pillowY, 80);
        pillowGrad.addColorStop(0, '#ffffff');
        pillowGrad.addColorStop(0.6, '#f8f4f0');
        pillowGrad.addColorStop(1, '#e8e0d4');
        ctx.fillStyle = pillowGrad;
        this._roundRect(ctx, cx - 75, pillowY - 28, 150, 56, 25);
        ctx.fill();
        // Pillow stitching
        ctx.strokeStyle = 'rgba(180, 170, 150, 0.2)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        this._roundRect(ctx, cx - 65, pillowY - 20, 130, 40, 18);
        ctx.stroke();
        ctx.setLineDash([]);

        // === BLANKET (covers lower body) ===
        const blanketTop = GAME_HEIGHT * 0.52;
        const blanketGrad = ctx.createLinearGradient(cx, blanketTop, cx, mattBottom);
        blanketGrad.addColorStop(0, 'rgba(160, 200, 240, 0.9)');  // Soft blue
        blanketGrad.addColorStop(0.4, 'rgba(140, 180, 225, 0.92)');
        blanketGrad.addColorStop(1, 'rgba(120, 160, 210, 0.95)');
        ctx.fillStyle = blanketGrad;
        ctx.beginPath();
        ctx.moveTo(mattLeft, blanketTop + 15);
        // Wavy top edge
        ctx.quadraticCurveTo(cx - 50, blanketTop - 5, cx, blanketTop + 10);
        ctx.quadraticCurveTo(cx + 50, blanketTop + 25, mattRight, blanketTop + 5);
        ctx.lineTo(mattRight, mattBottom);
        ctx.lineTo(mattLeft, mattBottom);
        ctx.closePath();
        ctx.fill();

        // Blanket pattern - tiny stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        for (let bx = mattLeft + 25; bx < mattRight - 20; bx += 35) {
            for (let by = blanketTop + 30; by < mattBottom - 15; by += 35) {
                this._drawTinyStar(ctx, bx + Math.sin(by) * 5, by, 4);
            }
        }

        // Blanket fold line
        ctx.strokeStyle = 'rgba(100, 140, 180, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mattLeft + 5, blanketTop + 15);
        ctx.quadraticCurveTo(cx, blanketTop + 5, mattRight - 5, blanketTop + 10);
        ctx.stroke();

        // === CRIB FRAME (warm golden wood) ===
        const woodGrad = ctx.createLinearGradient(cx - cw / 2, cribTop, cx + cw / 2, cribTop);
        woodGrad.addColorStop(0, '#8B6914');
        woodGrad.addColorStop(0.3, '#A07830');
        woodGrad.addColorStop(0.5, '#B8892C');
        woodGrad.addColorStop(0.7, '#A07830');
        woodGrad.addColorStop(1, '#8B6914');

        ctx.fillStyle = woodGrad;

        // Top rail
        this._roundRect(ctx, cx - cw / 2, cribTop, cw, 12, 6);
        ctx.fill();
        // Bottom rail
        this._roundRect(ctx, cx - cw / 2, cribBottom - 5, cw, 12, 6);
        ctx.fill();

        // Side rails
        const sideW = 10;
        ctx.fillRect(cx - cw / 2, cribTop, sideW, ch);
        ctx.fillRect(cx + cw / 2 - sideW, cribTop, sideW, ch);

        // Vertical slats (top section only - above baby)
        ctx.strokeStyle = '#9B7520';
        ctx.lineWidth = 3;
        for (let x = cx - cw / 2 + 20; x < cx + cw / 2 - 10; x += 16) {
            // Top slats
            ctx.beginPath();
            ctx.moveTo(x, cribTop);
            ctx.lineTo(x, cribTop + 20);
            ctx.stroke();
            // Bottom slats
            ctx.beginPath();
            ctx.moveTo(x, cribBottom - 5);
            ctx.lineTo(x, cribBottom + 7);
            ctx.stroke();
        }

        // Side slats
        for (let y = cribTop + 25; y < cribBottom - 15; y += 20) {
            // Left side
            ctx.beginPath();
            ctx.moveTo(cx - cw / 2, y);
            ctx.lineTo(cx - cw / 2 + sideW + 3, y);
            ctx.stroke();
            // Right side
            ctx.beginPath();
            ctx.moveTo(cx + cw / 2 - sideW - 3, y);
            ctx.lineTo(cx + cw / 2, y);
            ctx.stroke();
        }

        // Corner posts (decorative knobs)
        ctx.fillStyle = '#B8892C';
        ctx.beginPath();
        ctx.arc(cx - cw / 2 + 5, cribTop - 3, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + cw / 2 - 5, cribTop - 3, 7, 0, Math.PI * 2);
        ctx.fill();

        // Crib legs
        ctx.fillStyle = '#7B5910';
        ctx.fillRect(cx - cw / 2 - 2, cribBottom + 5, 14, 20);
        ctx.fillRect(cx + cw / 2 - 12, cribBottom + 5, 14, 20);
    }

    _drawNightlightGlow(ctx) {
        // Subtle warm glow emanating from bottom-left
        const x = 30;
        const y = GAME_HEIGHT * 0.85;
        const intensity = 0.08 + 0.04 * this.nightlightGlow;
        const radius = 80 + 20 * this.nightlightGlow;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, `rgba(255, 220, 150, ${intensity})`);
        glow.addColorStop(0.5, `rgba(255, 200, 120, ${intensity * 0.4})`);
        glow.addColorStop(1, 'rgba(255, 200, 120, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, GAME_HEIGHT * 0.7, 200, GAME_HEIGHT * 0.3);

        // Small nightlight icon
        ctx.fillStyle = `rgba(255, 230, 180, ${0.4 + 0.3 * this.nightlightGlow})`;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawMobileHanger(ctx) {
        const cx = GAME_WIDTH * 0.5;
        const cy = GAME_HEIGHT * 0.06;

        // String from top
        ctx.strokeStyle = 'rgba(200, 200, 220, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        // Cross bar
        ctx.strokeStyle = 'rgba(220, 220, 240, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 40, cy);
        ctx.lineTo(cx + 40, cy);
        ctx.stroke();

        // Hanging shapes with gentle sway
        const shapes = [
            { ox: -35, color: 'rgba(255, 180, 190, 0.6)', type: 'star' },
            { ox: -12, color: 'rgba(180, 220, 255, 0.6)', type: 'circle' },
            { ox: 12, color: 'rgba(180, 255, 200, 0.6)', type: 'moon' },
            { ox: 35, color: 'rgba(255, 255, 180, 0.6)', type: 'star' },
        ];

        for (const shape of shapes) {
            const sx = cx + shape.ox + Math.sin(this.time * 0.5 + shape.ox) * 3;
            const sy = cy + 18 + Math.abs(Math.sin(this.time * 0.3 + shape.ox * 0.1)) * 3;

            ctx.strokeStyle = 'rgba(200, 200, 220, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(cx + shape.ox, cy);
            ctx.lineTo(sx, sy - 5);
            ctx.stroke();

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(Math.sin(this.time * 0.5) * 0.1 + shape.ox * 0.003);
            ctx.fillStyle = shape.color;

            if (shape.type === 'star') {
                this._drawTinyStar(ctx, 0, 0, 5);
            } else if (shape.type === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (shape.type === 'moon') {
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#0a0a2e';
                ctx.beginPath();
                ctx.arc(2, -1, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    _drawVignette(ctx) {
        const grad = ctx.createRadialGradient(
            GAME_WIDTH / 2, GAME_HEIGHT * 0.45, GAME_HEIGHT * 0.25,
            GAME_WIDTH / 2, GAME_HEIGHT * 0.45, GAME_HEIGHT * 0.75
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(5, 3, 15, 0.5)');
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
