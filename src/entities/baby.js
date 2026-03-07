/**
 * Baby Entity - Ultra-rich Pixar-quality sleeping baby with:
 * - Multi-layered subsurface scattering skin shading
 * - Soft volumetric glow and ambient occlusion
 * - Off-screen canvas caching for performance
 * - Detailed 3D-like face with depth and realism
 * - Smooth organic shapes and gradients
 * - Rich expressive animations
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/renderer.js';
import { lerp, clamp, randFloat } from '../engine/utils.js';

// Off-screen cached textures for performance
let _cachedHead = null;
let _cachedBody = null;

export class Baby {
    constructor() {
        // Position - centered in the crib, large scale
        this.x = GAME_WIDTH * 0.5;
        this.y = GAME_HEIGHT * 0.42;
        this.headRadius = 62;
        this.bodyWidth = 120;
        this.bodyHeight = 190;

        // Safe zone
        this.safeZoneRadius = 140;

        // Animation state
        this.state = 'sleeping';
        this.breathPhase = 0;
        this.blinkTimer = 0;
        this.stirAmount = 0;
        this.stirTimer = 0;
        this.wakeProgress = 0;
        this.expressionTimer = 0;
        this.poutAmount = 0;
        this.smileAmount = 0;
        this.eyebrowRaise = 0;

        // Rich skin colors - warm peach tones with depth
        this.skinBase = '#FFCFA0';
        this.skinHighlight = '#FFF2E0';
        this.skinMid = '#FFD8B0';
        this.skinShadow = '#E8A870';
        this.skinDeep = '#D09060';
        this.skinSSS = '#FFB89C'; // Subsurface scattering color (reddish warmth)

        // Onesie colors - rich lavender pink
        this.onesieColor = '#E8A0C0';
        this.onesieLight = '#F0C0D8';
        this.onseieDark = '#D080A0';
        this.onesieAccent = '#FFD0E8';

        // Baby movements
        this.handWaveTimer = 0;
        this.handWaveAmount = 0;
        this.legKickTimer = 0;
        this.legKickAmount = 0;
        this.headTilt = 0;
        this.targetHeadTilt = 0;
        this.dreamBubbleTimer = 0;

        // Cheek puff / drool
        this.cheekPuff = 0;
        this.cheekPuffTimer = 0;

        // Thumb sucking
        this.thumbSuck = 0;
        this.thumbSuckTarget = 0;

        // Glow pulse for ambient warmth
        this.glowPulse = 0;
    }

    getFaceCenter() {
        return { x: this.x, y: this.y - 75 };
    }

    isInSafeZone(px, py) {
        const dx = px - this.x;
        const dy = py - (this.y - 20);
        return Math.sqrt(dx * dx + dy * dy) < this.safeZoneRadius;
    }

    update(dt, sleepMeter) {
        this.breathPhase += dt * (this.state === 'sleeping' ? 0.7 : 1.8);
        this.expressionTimer += dt;
        this.dreamBubbleTimer += dt;
        this.cheekPuffTimer += dt;
        this.glowPulse += dt * 0.5;

        // Continuous gentle movement
        this.handWaveTimer += dt;
        this.legKickTimer += dt;

        // Head tilt - gentle swaying
        this.targetHeadTilt = Math.sin(this.breathPhase * 0.5) * 0.03;
        this.headTilt = lerp(this.headTilt, this.targetHeadTilt, dt * 2);

        // Cheek puff animation
        if (this.cheekPuffTimer > 6 + Math.random() * 5) {
            this.cheekPuff = 1;
            this.cheekPuffTimer = 0;
        }
        this.cheekPuff = lerp(this.cheekPuff, 0, dt * 0.8);

        // Thumb sucking
        if (Math.random() < dt * 0.03 && this.state === 'sleeping') {
            this.thumbSuckTarget = this.thumbSuckTarget > 0.5 ? 0 : 1;
        }
        this.thumbSuck = lerp(this.thumbSuck, this.thumbSuckTarget, dt * 2);

        if (this.state === 'sleeping') {
            this.stirAmount = lerp(this.stirAmount, 0, dt * 1.5);
            this.poutAmount = lerp(this.poutAmount, 0, dt * 2);
            this.smileAmount = lerp(this.smileAmount, 0, dt * 1.5);
            this.eyebrowRaise = lerp(this.eyebrowRaise, 0, dt * 2);

            // Random cute movements
            if (Math.random() < dt * 0.1) {
                this.handWaveAmount = randFloat(0.3, 0.8);
            }
            this.handWaveAmount = lerp(this.handWaveAmount, 0, dt * 0.5);

            if (Math.random() < dt * 0.08) {
                this.legKickAmount = randFloat(0.2, 0.6);
            }
            this.legKickAmount = lerp(this.legKickAmount, 0, dt * 0.4);

            // Expressions
            if (this.expressionTimer > 2.5) {
                const rand = Math.random();
                if (rand < 0.25) this.smileAmount = 1.0;
                else if (rand < 0.45) this.poutAmount = 0.7;
                else if (rand < 0.6) this.eyebrowRaise = 0.8;
                else if (rand < 0.7) {
                    this.handWaveAmount = 1.0;
                    this.legKickAmount = 0.5;
                }
                this.expressionTimer = 0;
            }

            // React to low sleep meter
            if (sleepMeter < 60) {
                this.stirAmount = lerp(this.stirAmount, (60 - sleepMeter) / 60, dt * 2);
                if (sleepMeter < 40) {
                    this.poutAmount = lerp(this.poutAmount, (40 - sleepMeter) / 40, dt * 1.5);
                    this.eyebrowRaise = lerp(this.eyebrowRaise, 0.5, dt * 2);
                }
            }
        } else if (this.state === 'stirring') {
            this.stirTimer += dt;
            this.stirAmount = 0.5 + 0.4 * Math.sin(this.stirTimer * 6);
            this.poutAmount = lerp(this.poutAmount, 0.9, dt * 4);
            this.eyebrowRaise = lerp(this.eyebrowRaise, 0.6, dt * 3);
            this.legKickAmount = 0.3 + 0.3 * Math.sin(this.stirTimer * 4);
            if (this.stirTimer > 2.0) {
                this.state = 'sleeping';
                this.stirTimer = 0;
            }
        } else if (this.state === 'waking') {
            this.wakeProgress = clamp(this.wakeProgress + dt * 1.2, 0, 1);
            this.stirAmount = 1;
            this.legKickAmount = 0.8;
            this.handWaveAmount = 0.8;
        }
    }

    stir() {
        if (this.state === 'sleeping') {
            this.state = 'stirring';
            this.stirTimer = 0;
        }
    }

    wakeUp() {
        this.state = 'waking';
        this.wakeProgress = 0;
    }

    draw(ctx) {
        ctx.save();

        const breathScale = 1 + Math.sin(this.breathPhase) * 0.018;
        const stirShake = this.stirAmount * Math.sin(this.expressionTimer * 12) * 4;

        ctx.translate(this.x + stirShake, this.y);
        ctx.rotate(this.headTilt);

        // Ambient warm glow behind the baby (subsurface scattering halo)
        this._drawAmbientGlow(ctx);

        // Breathing scale
        ctx.save();
        ctx.scale(breathScale, breathScale);

        // Draw body parts
        this._drawLegs(ctx);
        this._drawBody(ctx);
        this._drawArms(ctx);

        // Head
        ctx.save();
        const headBob = Math.sin(this.breathPhase) * 3;
        ctx.translate(0, headBob - 80);
        this._drawHeadShadow(ctx);
        this._drawHead(ctx);
        this._drawEars(ctx);
        this._drawFace(ctx);
        this._drawHair(ctx);
        this._drawCheeks(ctx);
        ctx.restore();

        ctx.restore(); // breath scale
        ctx.restore(); // translate
    }

    // ═══════════════════════════════════════════════════
    // AMBIENT GLOW - warm subsurface scattering halo
    // ═══════════════════════════════════════════════════
    _drawAmbientGlow(ctx) {
        const pulse = 0.5 + 0.15 * Math.sin(this.glowPulse);
        const glow = ctx.createRadialGradient(0, -30, 20, 0, -30, 160);
        glow.addColorStop(0, `rgba(255, 210, 170, ${0.08 * pulse})`);
        glow.addColorStop(0.4, `rgba(255, 180, 140, ${0.04 * pulse})`);
        glow.addColorStop(1, 'rgba(255, 180, 140, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(-180, -200, 360, 400);
    }

    // ═══════════════════════════════════════════════════
    // LEGS - chubby baby legs with rich shading
    // ═══════════════════════════════════════════════════
    _drawLegs(ctx) {
        const legW = 34;
        const legH = 58;
        const kickPhase = Math.sin(this.legKickTimer * 3);

        // Left leg
        ctx.save();
        ctx.translate(-30, this.bodyHeight - 72);
        ctx.rotate(0.25 + kickPhase * 0.15 * this.legKickAmount);

        // Onesie leg with gradient
        const llGrad = ctx.createLinearGradient(-legW / 2, 0, legW / 2, legH * 0.6);
        llGrad.addColorStop(0, this.onesieLight);
        llGrad.addColorStop(0.5, this.onesieColor);
        llGrad.addColorStop(1, this.onseieDark);
        ctx.fillStyle = llGrad;
        this._roundRect(ctx, -legW / 2, 0, legW, legH * 0.6, 16);
        ctx.fill();

        // Foot with 3D shading
        this._drawFoot(ctx, legH, 0.2);
        ctx.restore();

        // Right leg
        ctx.save();
        ctx.translate(30, this.bodyHeight - 72);
        ctx.rotate(-0.25 - kickPhase * 0.1 * this.legKickAmount);

        const rlGrad = ctx.createLinearGradient(-legW / 2, 0, legW / 2, legH * 0.6);
        rlGrad.addColorStop(0, this.onesieLight);
        rlGrad.addColorStop(0.5, this.onesieColor);
        rlGrad.addColorStop(1, this.onseieDark);
        ctx.fillStyle = rlGrad;
        this._roundRect(ctx, -legW / 2, 0, legW, legH * 0.6, 16);
        ctx.fill();

        this._drawFoot(ctx, legH, -0.2);
        ctx.restore();
    }

    _drawFoot(ctx, legH, tilt) {
        // Foot base shape
        const footGrad = ctx.createRadialGradient(0, legH * 0.6 + 5, 2, 0, legH * 0.6 + 5, 20);
        footGrad.addColorStop(0, this.skinHighlight);
        footGrad.addColorStop(0.5, this.skinBase);
        footGrad.addColorStop(1, this.skinShadow);
        ctx.fillStyle = footGrad;
        ctx.beginPath();
        ctx.ellipse(0, legH * 0.6 + 5, 19, 13, tilt, 0, Math.PI * 2);
        ctx.fill();

        // Toes with individual highlights
        for (let i = 0; i < 4; i++) {
            const tx = (tilt > 0 ? 5 : -5) + i * (tilt > 0 ? 4 : -4);
            ctx.fillStyle = this.skinHighlight;
            ctx.beginPath();
            ctx.arc(tx, legH * 0.6 - 1, 3, 0, Math.PI * 2);
            ctx.fill();
            // Toe shadow
            ctx.fillStyle = 'rgba(200, 150, 120, 0.2)';
            ctx.beginPath();
            ctx.arc(tx, legH * 0.6 + 1, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ankle crease
        ctx.strokeStyle = 'rgba(200, 150, 110, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, legH * 0.55, 12, 0.3, Math.PI - 0.3);
        ctx.stroke();
    }

    // ═══════════════════════════════════════════════════
    // BODY - onesie with rich fabric texture
    // ═══════════════════════════════════════════════════
    _drawBody(ctx) {
        const bw = this.bodyWidth;
        const bh = this.bodyHeight;

        // Body shadow (soft drop shadow)
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.beginPath();
        ctx.ellipse(3, 35, bw * 0.56, bh * 0.46, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main body onesie - multi-stop gradient for depth
        const bodyGrad = ctx.createLinearGradient(-bw / 2, -50, bw / 2, bh * 0.65);
        bodyGrad.addColorStop(0, '#F8C8E0');    // Light pink top
        bodyGrad.addColorStop(0.2, this.onesieLight);
        bodyGrad.addColorStop(0.5, this.onesieColor);
        bodyGrad.addColorStop(0.8, this.onseieDark);
        bodyGrad.addColorStop(1, '#C87098');      // Deep shadow bottom

        ctx.fillStyle = bodyGrad;
        this._roundRect(ctx, -bw / 2, -48, bw, bh * 0.72, 38);
        ctx.fill();

        // Onesie highlight on the shoulder area (3D fabric feel)
        const shoulderGlow = ctx.createRadialGradient(-bw * 0.15, -30, 5, -bw * 0.15, -30, 50);
        shoulderGlow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        shoulderGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shoulderGlow;
        this._roundRect(ctx, -bw / 2, -48, bw, bh * 0.3, 38);
        ctx.fill();

        // Cute pattern on onesie - tiny hearts with glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        const heartPositions = [
            [-22, -12], [18, 8], [-8, 32], [28, 52], [-28, 58], [8, 78],
            [-15, 50], [22, 30], [0, 65]
        ];
        for (const [hx, hy] of heartPositions) {
            this._drawTinyHeart(ctx, hx, hy, 5.5);
        }

        // Subtle fold lines on onesie
        ctx.strokeStyle = 'rgba(180, 100, 140, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-20, 10);
        ctx.quadraticCurveTo(0, 15, 20, 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-15, 40);
        ctx.quadraticCurveTo(5, 45, 18, 38);
        ctx.stroke();

        // Buttons/snaps at neckline with shine
        for (let i = 0; i < 3; i++) {
            const by = -32 + i * 14;
            // Button shadow
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.beginPath();
            ctx.arc(1, by + 1, 4.5, 0, Math.PI * 2);
            ctx.fill();
            // Button
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.beginPath();
            ctx.arc(0, by, 4, 0, Math.PI * 2);
            ctx.fill();
            // Button shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(-1.5, by - 1.5, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Collar/neckline highlight
        ctx.strokeStyle = 'rgba(255, 220, 240, 0.4)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, -48, 32, 0.3, Math.PI - 0.3);
        ctx.stroke();
    }

    // ═══════════════════════════════════════════════════
    // ARMS - chubby baby arms with rich detail
    // ═══════════════════════════════════════════════════
    _drawArms(ctx) {
        const armW = 30;
        const armH = 62;
        const wavePhase = Math.sin(this.handWaveTimer * 2.5);

        // Left arm
        ctx.save();
        ctx.translate(-this.bodyWidth / 2 + 10, -22);
        ctx.rotate(0.6 + wavePhase * 0.2 * this.handWaveAmount + Math.sin(this.breathPhase) * 0.08);

        // Onesie sleeve with gradient
        const lsGrad = ctx.createLinearGradient(-armW / 2, 0, armW / 2, armH * 0.5);
        lsGrad.addColorStop(0, this.onesieLight);
        lsGrad.addColorStop(1, this.onesieColor);
        ctx.fillStyle = lsGrad;
        this._roundRect(ctx, -armW / 2, 0, armW, armH * 0.5, 13);
        ctx.fill();

        // Bare arm with skin gradient
        const laGrad = ctx.createLinearGradient(0, armH * 0.35, 0, armH * 0.75);
        laGrad.addColorStop(0, this.skinBase);
        laGrad.addColorStop(1, this.skinShadow);
        ctx.fillStyle = laGrad;
        this._roundRect(ctx, -armW / 2 + 3, armH * 0.35, armW - 6, armH * 0.4, 11);
        ctx.fill();

        // Hand - chubby baby fist with detailed shading
        this._drawHand(ctx, armH, true);
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(this.bodyWidth / 2 - 10, -22);
        ctx.rotate(-0.6 - wavePhase * 0.15 * this.handWaveAmount - Math.sin(this.breathPhase) * 0.08);

        const rsGrad = ctx.createLinearGradient(-armW / 2, 0, armW / 2, armH * 0.5);
        rsGrad.addColorStop(0, this.onesieLight);
        rsGrad.addColorStop(1, this.onesieColor);
        ctx.fillStyle = rsGrad;
        this._roundRect(ctx, -armW / 2, 0, armW, armH * 0.5, 13);
        ctx.fill();

        const raGrad = ctx.createLinearGradient(0, armH * 0.35, 0, armH * 0.75);
        raGrad.addColorStop(0, this.skinBase);
        raGrad.addColorStop(1, this.skinShadow);
        ctx.fillStyle = raGrad;
        this._roundRect(ctx, -armW / 2 + 3, armH * 0.35, armW - 6, armH * 0.4, 11);
        ctx.fill();

        this._drawHand(ctx, armH, false);
        ctx.restore();
    }

    _drawHand(ctx, armH, isLeft) {
        const hx = 0;
        const hy = armH * 0.8;

        // Hand shadow
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.beginPath();
        ctx.arc(hx + 1, hy + 1, 15, 0, Math.PI * 2);
        ctx.fill();

        // Main hand – radial gradient for 3D roundness
        const handGrad = ctx.createRadialGradient(hx - 3, hy - 3, 2, hx, hy, 15);
        handGrad.addColorStop(0, this.skinHighlight);
        handGrad.addColorStop(0.5, this.skinBase);
        handGrad.addColorStop(1, this.skinShadow);
        ctx.fillStyle = handGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, 14, 0, Math.PI * 2);
        ctx.fill();

        // Finger dimples
        const side = isLeft ? -1 : 1;
        ctx.fillStyle = 'rgba(220, 170, 130, 0.25)';
        ctx.beginPath();
        ctx.arc(hx + side * 4, hy - 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx + side * 8, hy - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Wrist crease
        ctx.strokeStyle = 'rgba(200, 150, 110, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(hx, hy - 12, 10, 0.4, Math.PI - 0.4);
        ctx.stroke();

        // Thumb sucking for left hand
        if (isLeft && this.thumbSuck > 0.3) {
            ctx.fillStyle = this.skinHighlight;
            ctx.beginPath();
            ctx.arc(hx + 2, hy + 9, 5 * this.thumbSuck, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ═══════════════════════════════════════════════════
    // HEAD - ultra-rich 3D Pixar head with multi-layer shading
    // ═══════════════════════════════════════════════════
    _drawHeadShadow(ctx) {
        // Soft ground shadow beneath head
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        ctx.beginPath();
        ctx.ellipse(3, 45, this.headRadius * 0.8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawHead(ctx) {
        const hr = this.headRadius;

        // Layer 1: Deep ambient shadow around head edge
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        ctx.beginPath();
        ctx.arc(2, 2, hr + 3, 0, Math.PI * 2);
        ctx.fill();

        // Layer 2: Main skin with multi-stop radial gradient for 3D sphere effect
        const skinGrad = ctx.createRadialGradient(-hr * 0.22, -hr * 0.22, hr * 0.08, 0, 0, hr);
        skinGrad.addColorStop(0, '#FFF6EC');       // Hot highlight (near-white)
        skinGrad.addColorStop(0.15, this.skinHighlight);
        skinGrad.addColorStop(0.4, this.skinBase);
        skinGrad.addColorStop(0.65, this.skinMid);
        skinGrad.addColorStop(0.85, this.skinShadow);
        skinGrad.addColorStop(1, this.skinDeep);
        ctx.fillStyle = skinGrad;
        ctx.beginPath();
        ctx.arc(0, 0, hr, 0, Math.PI * 2);
        ctx.fill();

        // Layer 3: Subsurface scattering glow (warm reddish rim)
        const sssGrad = ctx.createRadialGradient(0, 0, hr * 0.7, 0, 0, hr);
        sssGrad.addColorStop(0, 'rgba(255, 180, 150, 0)');
        sssGrad.addColorStop(0.8, 'rgba(255, 150, 120, 0.08)');
        sssGrad.addColorStop(1, 'rgba(255, 130, 100, 0.18)');
        ctx.fillStyle = sssGrad;
        ctx.beginPath();
        ctx.arc(0, 0, hr, 0, Math.PI * 2);
        ctx.fill();

        // Layer 4: Top-left rim light (cool white moonlight effect)
        ctx.strokeStyle = 'rgba(220, 235, 255, 0.3)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, hr - 1, -Math.PI * 0.85, -Math.PI * 0.15);
        ctx.stroke();

        // Layer 5: Bottom-right warm rim light
        ctx.strokeStyle = 'rgba(255, 200, 160, 0.12)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, hr - 1, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();

        // Layer 6: Specular highlight spot
        const specGrad = ctx.createRadialGradient(-hr * 0.3, -hr * 0.35, 2, -hr * 0.3, -hr * 0.35, hr * 0.35);
        specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
        specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = specGrad;
        ctx.beginPath();
        ctx.arc(0, 0, hr, 0, Math.PI * 2);
        ctx.fill();
    }

    // ═══════════════════════════════════════════════════
    // EARS - detailed with inner ear shading
    // ═══════════════════════════════════════════════════
    _drawEars(ctx) {
        const hr = this.headRadius;

        [-1, 1].forEach(side => {
            ctx.save();
            ctx.translate(side * (hr - 4), -3);

            // Ear shadow
            ctx.fillStyle = 'rgba(0,0,0,0.04)';
            ctx.beginPath();
            ctx.ellipse(side * 2, 2, 11, 15, side * -0.2, 0, Math.PI * 2);
            ctx.fill();

            // Outer ear with gradient
            const earGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
            earGrad.addColorStop(0, this.skinBase);
            earGrad.addColorStop(1, this.skinShadow);
            ctx.fillStyle = earGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 11, 15, side * -0.2, 0, Math.PI * 2);
            ctx.fill();

            // Inner ear - warm pink
            const innerGrad = ctx.createRadialGradient(side * 2, 0, 1, side * 2, 0, 9);
            innerGrad.addColorStop(0, '#FFBCAA');
            innerGrad.addColorStop(1, '#FFAA90');
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.ellipse(side * 2, 0, 6, 10, side * -0.2, 0, Math.PI * 2);
            ctx.fill();

            // Ear highlight rim
            ctx.strokeStyle = 'rgba(255, 230, 210, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 12, -Math.PI * 0.5, Math.PI * 0.3);
            ctx.stroke();

            ctx.restore();
        });
    }

    // ═══════════════════════════════════════════════════
    // FACE - richly detailed with depth
    // ═══════════════════════════════════════════════════
    _drawFace(ctx) {
        const isWaking = this.state === 'waking';
        const pout = this.poutAmount;
        const smile = this.smileAmount;

        this._drawEyebrows(ctx);

        if (isWaking && this.wakeProgress > 0.3) {
            const openAmount = clamp((this.wakeProgress - 0.3) * 2, 0, 1);
            this._drawOpenEyes(ctx, openAmount);
        } else {
            this._drawClosedEyes(ctx);
        }

        this._drawNose(ctx);

        if (isWaking && this.wakeProgress > 0.5) {
            this._drawCryingMouth(ctx, this.wakeProgress);
        } else {
            this._drawMouth(ctx, pout, smile);
        }
    }

    _drawEyebrows(ctx) {
        const eyeY = -12;
        const eyeSpacing = 20;
        const raise = this.eyebrowRaise;
        const pout = this.poutAmount;

        // Softer, more natural eyebrows
        ctx.strokeStyle = '#7B4A30';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        // Left eyebrow with slight gradient effect
        ctx.beginPath();
        ctx.moveTo(-eyeSpacing - 11, eyeY - 12 - raise * 5 + pout * 3);
        ctx.quadraticCurveTo(-eyeSpacing, eyeY - 17 - raise * 8, -eyeSpacing + 11, eyeY - 12 - raise * 5);
        ctx.stroke();

        // Right eyebrow
        ctx.beginPath();
        ctx.moveTo(eyeSpacing - 11, eyeY - 12 - raise * 5);
        ctx.quadraticCurveTo(eyeSpacing, eyeY - 17 - raise * 8, eyeSpacing + 11, eyeY - 12 - raise * 5 + pout * 3);
        ctx.stroke();
    }

    _drawClosedEyes(ctx) {
        const eyeY = -6;
        const eyeSpacing = 20;
        const stirSquint = this.stirAmount * 0.3;

        // Eye socket shadow (subtle depth)
        [-1, 1].forEach(side => {
            ctx.fillStyle = 'rgba(200, 160, 130, 0.06)';
            ctx.beginPath();
            ctx.ellipse(side * eyeSpacing, eyeY - 2, 16, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Closed eye lines - thick, expressive
        ctx.strokeStyle = '#4A2A1A';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';

        // Left eye
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, 13, Math.PI * 0.1 + stirSquint, Math.PI * 0.9 - stirSquint);
        ctx.stroke();

        // Right eye
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, 13, Math.PI * 0.1 + stirSquint, Math.PI * 0.9 - stirSquint);
        ctx.stroke();

        // Beautiful lashes with varied length
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#3A1A0A';

        const lashConfigs = [
            { pos: -1, len: 6 }, { pos: 0, len: 7 }, { pos: 1, len: 6 }
        ];

        for (const lash of lashConfigs) {
            // Left eye lashes
            ctx.beginPath();
            ctx.moveTo(-eyeSpacing + lash.pos * 6, eyeY + 10);
            ctx.lineTo(-eyeSpacing + lash.pos * 7.5, eyeY + 10 + lash.len);
            ctx.stroke();
            // Right eye lashes
            ctx.beginPath();
            ctx.moveTo(eyeSpacing + lash.pos * 6, eyeY + 10);
            ctx.lineTo(eyeSpacing + lash.pos * 7.5, eyeY + 10 + lash.len);
            ctx.stroke();
        }

        // Corner lashes (longer, more dramatic)
        ctx.lineWidth = 1.5;
        [-1, 1].forEach(side => {
            ctx.beginPath();
            ctx.moveTo(side * eyeSpacing - side * 11, eyeY + 6);
            ctx.lineTo(side * eyeSpacing - side * 16, eyeY + 12);
            ctx.stroke();
            // Extra outer lash
            ctx.beginPath();
            ctx.moveTo(side * eyeSpacing - side * 9, eyeY + 8);
            ctx.lineTo(side * eyeSpacing - side * 13, eyeY + 15);
            ctx.stroke();
        });
    }

    _drawOpenEyes(ctx, openAmount) {
        const eyeY = -6;
        const eyeSpacing = 20;

        [-1, 1].forEach(side => {
            const ex = side * eyeSpacing;

            // Eye white with subtle shadow
            const eyeWhiteGrad = ctx.createRadialGradient(ex, eyeY, 2, ex, eyeY, 15);
            eyeWhiteGrad.addColorStop(0, '#ffffff');
            eyeWhiteGrad.addColorStop(0.7, '#f8f8ff');
            eyeWhiteGrad.addColorStop(1, '#e8e8f0');
            ctx.fillStyle = eyeWhiteGrad;
            ctx.beginPath();
            ctx.ellipse(ex, eyeY, 15, 11 * openAmount, 0, 0, Math.PI * 2);
            ctx.fill();

            // Iris - rich brown with depth
            const irisSize = 9 * openAmount;
            const irisGrad = ctx.createRadialGradient(ex, eyeY, 1, ex, eyeY, irisSize);
            irisGrad.addColorStop(0, '#8B5E3C');
            irisGrad.addColorStop(0.4, '#6B4030');
            irisGrad.addColorStop(1, '#4A2818');
            ctx.fillStyle = irisGrad;
            ctx.beginPath();
            ctx.arc(ex, eyeY, irisSize, 0, Math.PI * 2);
            ctx.fill();

            // Pupil
            ctx.fillStyle = '#0A0500';
            const pupilSize = 5.5 * openAmount;
            ctx.beginPath();
            ctx.arc(ex, eyeY, pupilSize, 0, Math.PI * 2);
            ctx.fill();

            // Highlights - multi-layer for that Pixar sparkle
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(ex - 4, eyeY - 3.5, 4.5 * openAmount, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(ex + 5, eyeY + 2.5, 2.2 * openAmount, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Tears when waking
        if (openAmount > 0.5) {
            [-1, 1].forEach(side => {
                const tearGrad = ctx.createLinearGradient(
                    side * eyeSpacing + side * 12, eyeY,
                    side * eyeSpacing + side * 12, eyeY + 20 * openAmount
                );
                tearGrad.addColorStop(0, 'rgba(140, 200, 255, 0.6)');
                tearGrad.addColorStop(1, 'rgba(100, 180, 255, 0.1)');
                ctx.fillStyle = tearGrad;
                ctx.beginPath();
                ctx.ellipse(
                    side * eyeSpacing + side * 13,
                    eyeY + 12 * openAmount,
                    3, 6 * openAmount, side * 0.3, 0, Math.PI * 2
                );
                ctx.fill();
            });
        }
    }

    _drawNose(ctx) {
        // Nose with subtle 3D shading
        const noseGrad = ctx.createRadialGradient(0, 5, 1, 0, 5, 8);
        noseGrad.addColorStop(0, 'rgba(230, 160, 120, 0.35)');
        noseGrad.addColorStop(0.6, 'rgba(220, 145, 105, 0.2)');
        noseGrad.addColorStop(1, 'rgba(210, 130, 90, 0)');
        ctx.fillStyle = noseGrad;
        ctx.beginPath();
        ctx.ellipse(0, 6, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nostril highlights
        ctx.fillStyle = 'rgba(255, 210, 180, 0.25)';
        ctx.beginPath();
        ctx.ellipse(-3, 5, 3.5, 2.5, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(3, 5, 3.5, 2.5, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Nose bridge highlight
        ctx.fillStyle = 'rgba(255, 240, 220, 0.12)';
        ctx.beginPath();
        ctx.ellipse(0, 1, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawMouth(ctx, pout, smile) {
        const mouthY = 20;

        ctx.strokeStyle = '#B06840';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        if (pout > 0.3) {
            // Cute pouty frown
            ctx.beginPath();
            ctx.arc(0, mouthY + 12 * pout, 15, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();

            // Pouty lower lip - glossy
            const lipGrad = ctx.createRadialGradient(0, mouthY + 5 * pout, 1, 0, mouthY + 5 * pout, 10);
            lipGrad.addColorStop(0, '#F0A098');
            lipGrad.addColorStop(1, '#E88878');
            ctx.fillStyle = lipGrad;
            ctx.beginPath();
            ctx.ellipse(0, mouthY + 5 * pout, 9, 3.5 * pout, 0, 0, Math.PI);
            ctx.fill();

            // Lip highlight
            ctx.fillStyle = 'rgba(255, 220, 210, 0.3)';
            ctx.beginPath();
            ctx.ellipse(0, mouthY + 3 * pout, 5, 1.5, 0, 0, Math.PI);
            ctx.fill();
        } else if (smile > 0.3) {
            // Big sweet dreamy smile
            ctx.beginPath();
            ctx.arc(0, mouthY - 3, 17 * smile, 0.1, Math.PI - 0.1);
            ctx.stroke();

            // Dimples when smiling
            if (smile > 0.6) {
                const dimpleGrad = ctx.createRadialGradient(-20, mouthY + 2, 0, -20, mouthY + 2, 6);
                dimpleGrad.addColorStop(0, 'rgba(255, 140, 110, 0.2)');
                dimpleGrad.addColorStop(1, 'rgba(255, 140, 110, 0)');
                ctx.fillStyle = dimpleGrad;
                ctx.beginPath();
                ctx.arc(-20, mouthY + 2, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(20, mouthY + 2, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Gentle resting smile
            ctx.beginPath();
            ctx.moveTo(-10, mouthY);
            ctx.quadraticCurveTo(0, mouthY + 6, 10, mouthY);
            ctx.stroke();
        }

        // Drool (occasional)
        if (this.cheekPuff > 0.2 && this.state === 'sleeping') {
            const droolGrad = ctx.createLinearGradient(10, mouthY + 6, 10, mouthY + 18);
            droolGrad.addColorStop(0, `rgba(200, 220, 255, ${this.cheekPuff * 0.45})`);
            droolGrad.addColorStop(1, `rgba(180, 210, 255, ${this.cheekPuff * 0.15})`);
            ctx.fillStyle = droolGrad;
            ctx.beginPath();
            ctx.ellipse(10, mouthY + 10, 3, 6 * this.cheekPuff, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawCryingMouth(ctx, progress) {
        const openAmount = clamp((progress - 0.5) * 4, 0, 1);
        const mouthY = 20;

        // Big open crying mouth with depth
        const mouthGrad = ctx.createRadialGradient(0, mouthY + 12, 3, 0, mouthY + 12, 20);
        mouthGrad.addColorStop(0, '#3A0A0A');
        mouthGrad.addColorStop(0.5, '#5A1A1A');
        mouthGrad.addColorStop(1, '#A03A3A');
        ctx.fillStyle = mouthGrad;
        ctx.beginPath();
        ctx.ellipse(0, mouthY + 14, 16 * openAmount, 20 * openAmount, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tongue
        if (openAmount > 0.4) {
            const tongueGrad = ctx.createRadialGradient(0, mouthY + 24, 2, 0, mouthY + 24, 12);
            tongueGrad.addColorStop(0, '#FFB0B0');
            tongueGrad.addColorStop(1, '#FF8888');
            ctx.fillStyle = tongueGrad;
            ctx.beginPath();
            ctx.ellipse(0, mouthY + 24, 11 * openAmount, 7 * openAmount, 0, 0, Math.PI);
            ctx.fill();
        }

        // Wavering lip line
        ctx.strokeStyle = '#C06050';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const wobble = Math.sin(progress * 20) * 2;
        ctx.arc(0, mouthY + wobble, 17 * openAmount, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
    }

    // ═══════════════════════════════════════════════════
    // HAIR - rich, volumetric baby hair
    // ═══════════════════════════════════════════════════
    _drawHair(ctx) {
        const hr = this.headRadius;

        // Hair base color with gradient for depth
        const hairGrad = ctx.createLinearGradient(0, -hr - 20, 0, -hr + 20);
        hairGrad.addColorStop(0, '#704828');
        hairGrad.addColorStop(0.5, '#5A3820');
        hairGrad.addColorStop(1, '#482C18');

        ctx.fillStyle = hairGrad;

        // Main tuft - bigger, more voluminous
        ctx.beginPath();
        ctx.moveTo(-20, -hr + 8);
        ctx.quadraticCurveTo(-8, -hr - 28, 12, -hr + 4);
        ctx.quadraticCurveTo(4, -hr - 14, -20, -hr + 8);
        ctx.fill();

        // Side tuft right
        ctx.beginPath();
        ctx.moveTo(6, -hr + 7);
        ctx.quadraticCurveTo(18, -hr - 20, 30, -hr + 10);
        ctx.quadraticCurveTo(20, -hr - 6, 6, -hr + 7);
        ctx.fill();

        // Small wispy tuft left
        ctx.beginPath();
        ctx.moveTo(-28, -hr + 12);
        ctx.quadraticCurveTo(-22, -hr - 10, -12, -hr + 7);
        ctx.quadraticCurveTo(-20, -hr - 2, -28, -hr + 12);
        ctx.fill();

        // Extra wisp
        ctx.beginPath();
        ctx.moveTo(-5, -hr + 3);
        ctx.quadraticCurveTo(3, -hr - 18, 8, -hr + 3);
        ctx.quadraticCurveTo(3, -hr - 8, -5, -hr + 3);
        ctx.fill();

        // Hair highlights (shine streaks)
        ctx.fillStyle = 'rgba(140, 100, 60, 0.5)';
        ctx.beginPath();
        ctx.moveTo(-12, -hr + 5);
        ctx.quadraticCurveTo(-2, -hr - 18, 8, -hr + 5);
        ctx.quadraticCurveTo(-2, -hr - 6, -12, -hr + 5);
        ctx.fill();

        // Glossy hair highlight
        ctx.fillStyle = 'rgba(180, 140, 80, 0.2)';
        ctx.beginPath();
        ctx.moveTo(-8, -hr + 4);
        ctx.quadraticCurveTo(0, -hr - 12, 5, -hr + 4);
        ctx.quadraticCurveTo(0, -hr - 4, -8, -hr + 4);
        ctx.fill();
    }

    // ═══════════════════════════════════════════════════
    // CHEEKS - ultra-detailed rosy cheeks with depth
    // ═══════════════════════════════════════════════════
    _drawCheeks(ctx) {
        const rosiness = 0.35 + this.stirAmount * 0.3 + this.cheekPuff * 0.2;
        const puffSize = 1 + this.cheekPuff * 0.4;

        [-1, 1].forEach(side => {
            const cx = side * 28;
            const cy = 13;

            // Multi-layered cheek blush
            // Layer 1: Wide soft blush
            const outerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24 * puffSize);
            outerGrad.addColorStop(0, `rgba(255, 120, 110, ${rosiness * 0.6})`);
            outerGrad.addColorStop(0.5, `rgba(255, 140, 130, ${rosiness * 0.3})`);
            outerGrad.addColorStop(1, 'rgba(255, 140, 130, 0)');
            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, 24 * puffSize, 0, Math.PI * 2);
            ctx.fill();

            // Layer 2: Core blush
            const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14 * puffSize);
            coreGrad.addColorStop(0, `rgba(255, 100, 90, ${rosiness * 0.4})`);
            coreGrad.addColorStop(1, `rgba(255, 120, 110, 0)`);
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, 14 * puffSize, 0, Math.PI * 2);
            ctx.fill();

            // Layer 3: Cheek highlight (specular)
            ctx.fillStyle = `rgba(255, 220, 210, ${rosiness * 0.15})`;
            ctx.beginPath();
            ctx.arc(cx - side * 3, cy - 4, 6, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // ═══════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════
    _drawTinyHeart(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);
        ctx.bezierCurveTo(-size, -size * 0.3, -size * 0.5, -size, 0, -size * 0.4);
        ctx.bezierCurveTo(size * 0.5, -size, size, -size * 0.3, 0, size * 0.3);
        ctx.fill();
        ctx.restore();
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
