/**
 * Baby Entity - a large, Pixar-like sleeping baby that takes up most of the crib.
 * Full body visible with expressive face, breathing animations, and cute movements.
 * Skin is warm peach that contrasts well against the deep navy background.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/renderer.js';
import { lerp, clamp, randFloat } from '../engine/utils.js';

export class Baby {
    constructor() {
        // Position - centered in the crib, larger scale
        this.x = GAME_WIDTH * 0.5;
        this.y = GAME_HEIGHT * 0.42;
        this.headRadius = 55;
        this.bodyWidth = 110;
        this.bodyHeight = 180;

        // Safe zone - area where tapping kills the game
        this.safeZoneRadius = 140;

        // Animation state
        this.state = 'sleeping'; // 'sleeping', 'stirring', 'waking', 'awake'
        this.breathPhase = 0;
        this.blinkTimer = 0;
        this.stirAmount = 0;
        this.stirTimer = 0;
        this.wakeProgress = 0;
        this.expressionTimer = 0;
        this.poutAmount = 0;
        this.smileAmount = 0;
        this.eyebrowRaise = 0;

        // Colors - warm peach/skin tones that pop against navy
        this.skinColor = '#FFD4A8';     // Warm peach
        this.skinHighlight = '#FFF0DC'; // Lighter highlight
        this.skinShadow = '#E8B080';    // Shadow tone
        this.onesieColor = '#FFB6C1';   // Soft pink onesie
        this.onesieStripe = '#FF9FB3';  // Stripe color

        // Baby movements
        this.handWaveTimer = 0;
        this.handWaveAmount = 0;
        this.legKickTimer = 0;
        this.legKickAmount = 0;
        this.headTilt = 0;
        this.targetHeadTilt = 0;
        this.dreamBubbleTimer = 0;

        // Cheek puff animation
        this.cheekPuff = 0;
        this.cheekPuffTimer = 0;

        // Thumb sucking
        this.thumbSuck = 0;
        this.thumbSuckTarget = 0;
    }

    getFaceCenter() {
        return { x: this.x, y: this.y - 70 };
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

        // Continuous gentle movement
        this.handWaveTimer += dt;
        this.legKickTimer += dt;

        // Head tilt - gentle swaying
        this.targetHeadTilt = Math.sin(this.breathPhase * 0.5) * 0.03;
        this.headTilt = lerp(this.headTilt, this.targetHeadTilt, dt * 2);

        // Cheek puff animation (random cute cheek puffs)
        if (this.cheekPuffTimer > 6 + Math.random() * 5) {
            this.cheekPuff = 1;
            this.cheekPuffTimer = 0;
        }
        this.cheekPuff = lerp(this.cheekPuff, 0, dt * 0.8);

        // Thumb sucking (random)
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

            // More frequent expressions!
            if (this.expressionTimer > 2.5) {
                const rand = Math.random();
                if (rand < 0.25) {
                    this.smileAmount = 1.0; // Big dreamy smile
                } else if (rand < 0.45) {
                    this.poutAmount = 0.7;  // Cute pout
                } else if (rand < 0.6) {
                    this.eyebrowRaise = 0.8; // Surprised dream
                } else if (rand < 0.7) {
                    this.handWaveAmount = 1.0; // Little wave
                    this.legKickAmount = 0.5;
                }
                this.expressionTimer = 0;
            }

            // React to low sleep meter - more dramatic
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

        const breathScale = 1 + Math.sin(this.breathPhase) * 0.02;
        const stirShake = this.stirAmount * Math.sin(this.expressionTimer * 12) * 4;

        ctx.translate(this.x + stirShake, this.y);
        ctx.rotate(this.headTilt);

        // Scale for breathing
        ctx.save();
        ctx.scale(breathScale, breathScale);

        // Draw body parts
        this._drawLegs(ctx);
        this._drawBody(ctx);
        this._drawArms(ctx);

        // Head
        ctx.save();
        const headBob = Math.sin(this.breathPhase) * 3;
        ctx.translate(0, headBob - 75);
        this._drawHead(ctx);
        this._drawEars(ctx);
        this._drawFace(ctx);
        this._drawHair(ctx);
        this._drawCheeks(ctx);
        ctx.restore();

        ctx.restore(); // breath scale
        ctx.restore(); // translate
    }

    _drawLegs(ctx) {
        const legW = 32;
        const legH = 55;
        const kickPhase = Math.sin(this.legKickTimer * 3);

        // Left leg
        ctx.save();
        ctx.translate(-28, this.bodyHeight - 70);
        ctx.rotate(0.25 + kickPhase * 0.15 * this.legKickAmount);

        // Onesie leg
        ctx.fillStyle = this.onesieColor;
        this._roundRect(ctx, -legW / 2, 0, legW, legH * 0.6, 15);
        ctx.fill();

        // Bare foot
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, legH * 0.6 + 5, 18, 12, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Little toes
        ctx.fillStyle = this.skinHighlight;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(5 + i * 4, legH * 0.6 - 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Right leg
        ctx.save();
        ctx.translate(28, this.bodyHeight - 70);
        ctx.rotate(-0.25 - kickPhase * 0.1 * this.legKickAmount);

        ctx.fillStyle = this.onesieColor;
        this._roundRect(ctx, -legW / 2, 0, legW, legH * 0.6, 15);
        ctx.fill();

        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, legH * 0.6 + 5, 18, 12, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.skinHighlight;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(-5 - i * 4, legH * 0.6 - 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    _drawBody(ctx) {
        const bw = this.bodyWidth;
        const bh = this.bodyHeight;

        // Body shadow
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.ellipse(0, 30, bw * 0.55, bh * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main body (Onesie) - soft pink
        const bodyGrad = ctx.createLinearGradient(-bw / 2, -40, bw / 2, bh * 0.6);
        bodyGrad.addColorStop(0, '#FFC8D4');
        bodyGrad.addColorStop(0.5, this.onesieColor);
        bodyGrad.addColorStop(1, '#FF9FB3');

        ctx.fillStyle = bodyGrad;
        this._roundRect(ctx, -bw / 2, -45, bw, bh * 0.7, 35);
        ctx.fill();

        // Cute pattern on onesie - tiny hearts
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        const heartPositions = [
            [-20, -10], [15, 5], [-5, 30], [25, 50], [-25, 55], [5, 75]
        ];
        for (const [hx, hy] of heartPositions) {
            this._drawTinyHeart(ctx, hx, hy, 5);
        }

        // Button/snap at collar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(0, -30, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -18, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawArms(ctx) {
        const armW = 28;
        const armH = 60;
        const wavePhase = Math.sin(this.handWaveTimer * 2.5);

        // Left arm
        ctx.save();
        ctx.translate(-this.bodyWidth / 2 + 8, -20);
        ctx.rotate(0.6 + wavePhase * 0.2 * this.handWaveAmount + Math.sin(this.breathPhase) * 0.08);

        // Onesie sleeve
        ctx.fillStyle = this.onesieColor;
        this._roundRect(ctx, -armW / 2, 0, armW, armH * 0.5, 12);
        ctx.fill();

        // Bare arm
        ctx.fillStyle = this.skinColor;
        this._roundRect(ctx, -armW / 2 + 2, armH * 0.35, armW - 4, armH * 0.4, 10);
        ctx.fill();

        // Hand (chubby baby fist)
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(0, armH * 0.8, 14, 0, Math.PI * 2);
        ctx.fill();
        // Fingers detail
        ctx.fillStyle = this.skinHighlight;
        ctx.beginPath();
        ctx.arc(-4, armH * 0.8 - 5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Thumb sucking
        if (this.thumbSuck > 0.3) {
            ctx.fillStyle = this.skinHighlight;
            ctx.beginPath();
            ctx.arc(2, armH * 0.8 + 8, 5 * this.thumbSuck, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(this.bodyWidth / 2 - 8, -20);
        ctx.rotate(-0.6 - wavePhase * 0.15 * this.handWaveAmount - Math.sin(this.breathPhase) * 0.08);

        ctx.fillStyle = this.onesieColor;
        this._roundRect(ctx, -armW / 2, 0, armW, armH * 0.5, 12);
        ctx.fill();

        ctx.fillStyle = this.skinColor;
        this._roundRect(ctx, -armW / 2 + 2, armH * 0.35, armW - 4, armH * 0.4, 10);
        ctx.fill();

        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(0, armH * 0.8, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.skinHighlight;
        ctx.beginPath();
        ctx.arc(4, armH * 0.8 - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawHead(ctx) {
        const hr = this.headRadius;

        // Pixar-style skin gradient - warm and glowing
        const skinGrad = ctx.createRadialGradient(-hr * 0.25, -hr * 0.25, hr * 0.1, 0, 0, hr);
        skinGrad.addColorStop(0, this.skinHighlight);  // Bright highlight
        skinGrad.addColorStop(0.4, this.skinColor);     // Main skin
        skinGrad.addColorStop(0.8, this.skinShadow);    // Shadow
        skinGrad.addColorStop(1, '#D49A70');             // Edge shadow

        ctx.fillStyle = skinGrad;
        ctx.beginPath();
        ctx.arc(0, 0, hr, 0, Math.PI * 2);
        ctx.fill();

        // Soft rim light (makes it pop against dark bg)
        ctx.strokeStyle = 'rgba(255, 240, 220, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, hr - 1, -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.stroke();

        // Subsurface scattering glow
        ctx.strokeStyle = 'rgba(255, 180, 140, 0.15)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, hr, 0, Math.PI * 2);
        ctx.stroke();
    }

    _drawEars(ctx) {
        const hr = this.headRadius;

        // Left ear
        ctx.save();
        ctx.translate(-hr + 5, -5);
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 14, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Inner ear
        ctx.fillStyle = '#FFB8A0';
        ctx.beginPath();
        ctx.ellipse(2, 0, 5, 9, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right ear
        ctx.save();
        ctx.translate(hr - 5, -5);
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 14, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFB8A0';
        ctx.beginPath();
        ctx.ellipse(-2, 0, 5, 9, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawFace(ctx) {
        const isWaking = this.state === 'waking';
        const pout = this.poutAmount;
        const smile = this.smileAmount;

        // Eyebrows
        this._drawEyebrows(ctx);

        // Eyes
        if (isWaking && this.wakeProgress > 0.3) {
            const openAmount = clamp((this.wakeProgress - 0.3) * 2, 0, 1);
            this._drawOpenEyes(ctx, openAmount);
        } else {
            this._drawClosedEyes(ctx);
        }

        // Nose
        ctx.fillStyle = 'rgba(220, 140, 100, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Nostril highlight
        ctx.fillStyle = 'rgba(255, 200, 160, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-2, 4, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        if (isWaking && this.wakeProgress > 0.5) {
            this._drawCryingMouth(ctx, this.wakeProgress);
        } else {
            this._drawMouth(ctx, pout, smile);
        }
    }

    _drawEyebrows(ctx) {
        const eyeY = -10;
        const eyeSpacing = 18;
        const raise = this.eyebrowRaise;
        const pout = this.poutAmount;

        ctx.strokeStyle = '#6B4030';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        // Left eyebrow
        ctx.beginPath();
        ctx.moveTo(-eyeSpacing - 10, eyeY - 12 - raise * 5 + pout * 3);
        ctx.quadraticCurveTo(-eyeSpacing, eyeY - 16 - raise * 8, -eyeSpacing + 10, eyeY - 12 - raise * 5);
        ctx.stroke();

        // Right eyebrow  
        ctx.beginPath();
        ctx.moveTo(eyeSpacing - 10, eyeY - 12 - raise * 5);
        ctx.quadraticCurveTo(eyeSpacing, eyeY - 16 - raise * 8, eyeSpacing + 10, eyeY - 12 - raise * 5 + pout * 3);
        ctx.stroke();
    }

    _drawClosedEyes(ctx) {
        const eyeY = -6;
        const eyeSpacing = 18;
        const stirSquint = this.stirAmount * 0.3;

        // Eye closed - thick curved lines
        ctx.strokeStyle = '#4A2A1A';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';

        // Left eye
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, 12, Math.PI * 0.1 + stirSquint, Math.PI * 0.9 - stirSquint);
        ctx.stroke();

        // Right eye
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, 12, Math.PI * 0.1 + stirSquint, Math.PI * 0.9 - stirSquint);
        ctx.stroke();

        // Beautiful eyelashes
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#3A1A0A';
        for (let i = -1; i <= 1; i++) {
            // Left eye lashes
            ctx.beginPath();
            ctx.moveTo(-eyeSpacing + i * 6, eyeY + 9);
            ctx.lineTo(-eyeSpacing + i * 7, eyeY + 16);
            ctx.stroke();

            // Right eye lashes
            ctx.beginPath();
            ctx.moveTo(eyeSpacing + i * 6, eyeY + 9);
            ctx.lineTo(eyeSpacing + i * 7, eyeY + 16);
            ctx.stroke();
        }

        // Extra corner lashes for cuteness
        ctx.beginPath();
        ctx.moveTo(-eyeSpacing - 10, eyeY + 5);
        ctx.lineTo(-eyeSpacing - 14, eyeY + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(eyeSpacing + 10, eyeY + 5);
        ctx.lineTo(eyeSpacing + 14, eyeY + 10);
        ctx.stroke();
    }

    _drawOpenEyes(ctx, openAmount) {
        const eyeY = -6;
        const eyeSpacing = 18;

        // Eye whites - big Pixar eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing, eyeY, 14, 10 * openAmount, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSpacing, eyeY, 14, 10 * openAmount, 0, 0, Math.PI * 2);
        ctx.fill();

        // Large irises
        ctx.fillStyle = '#6B4030';
        const irisSize = 8 * openAmount;
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, irisSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, irisSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#1A0A00';
        const pupilSize = 5 * openAmount;
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, pupilSize, 0, Math.PI * 2);
        ctx.fill();

        // Multi-layered highlights for that Pixar sparkle
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-eyeSpacing - 4, eyeY - 3, 4 * openAmount, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing - 4, eyeY - 3, 4 * openAmount, 0, Math.PI * 2);
        ctx.fill();

        // Secondary highlights
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(-eyeSpacing + 5, eyeY + 2, 2 * openAmount, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing + 5, eyeY + 2, 2 * openAmount, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Tears when waking
        if (openAmount > 0.5) {
            ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(-eyeSpacing - 12, eyeY + 10 * openAmount, 3, 5 * openAmount, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(eyeSpacing + 12, eyeY + 10 * openAmount, 3, 5 * openAmount, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawMouth(ctx, pout, smile) {
        const mouthY = 18;

        ctx.strokeStyle = '#B06840';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();

        if (pout > 0.3) {
            // Cute pouty frown - lower lip sticks out
            ctx.arc(0, mouthY + 12 * pout, 14, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();

            // Pouty lower lip
            ctx.fillStyle = '#E89080';
            ctx.beginPath();
            ctx.ellipse(0, mouthY + 5 * pout, 8, 3 * pout, 0, 0, Math.PI);
            ctx.fill();
        } else if (smile > 0.3) {
            // Big sweet dreamy smile
            ctx.arc(0, mouthY - 3, 16 * smile, 0.1, Math.PI - 0.1);
            ctx.stroke();

            // Slight dimples
            if (smile > 0.6) {
                ctx.fillStyle = 'rgba(255, 150, 120, 0.2)';
                ctx.beginPath();
                ctx.arc(-18, mouthY + 2, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(18, mouthY + 2, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Gentle resting smile
            ctx.moveTo(-9, mouthY);
            ctx.quadraticCurveTo(0, mouthY + 5, 9, mouthY);
            ctx.stroke();
        }

        // Drool (occasional)
        if (this.cheekPuff > 0.2 && this.state === 'sleeping') {
            ctx.fillStyle = `rgba(200, 220, 255, ${this.cheekPuff * 0.4})`;
            ctx.beginPath();
            ctx.ellipse(10, mouthY + 8, 3, 5 * this.cheekPuff, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawCryingMouth(ctx, progress) {
        const openAmount = clamp((progress - 0.5) * 4, 0, 1);
        const mouthY = 18;

        // Big open crying mouth
        const grad = ctx.createLinearGradient(0, mouthY, 0, mouthY + 30);
        grad.addColorStop(0, '#5A1A1A');
        grad.addColorStop(1, '#A03A3A');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(0, mouthY + 12, 15 * openAmount, 18 * openAmount, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tongue
        if (openAmount > 0.4) {
            ctx.fillStyle = '#FF9999';
            ctx.beginPath();
            ctx.ellipse(0, mouthY + 22, 10 * openAmount, 6 * openAmount, 0, 0, Math.PI);
            ctx.fill();
        }

        // Wavering lip line
        ctx.strokeStyle = '#C06050';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const wobble = Math.sin(progress * 20) * 2;
        ctx.arc(0, mouthY + wobble, 16 * openAmount, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
    }

    _drawHair(ctx) {
        ctx.fillStyle = '#5A3820';
        const hr = this.headRadius;

        // More voluminous, cute baby hair tufts
        // Main tuft
        ctx.beginPath();
        ctx.moveTo(-18, -hr + 8);
        ctx.quadraticCurveTo(-5, -hr - 25, 10, -hr + 5);
        ctx.quadraticCurveTo(2, -hr - 12, -18, -hr + 8);
        ctx.fill();

        // Side tuft right
        ctx.beginPath();
        ctx.moveTo(5, -hr + 8);
        ctx.quadraticCurveTo(15, -hr - 18, 28, -hr + 12);
        ctx.quadraticCurveTo(18, -hr - 5, 5, -hr + 8);
        ctx.fill();

        // Small wispy tuft left
        ctx.beginPath();
        ctx.moveTo(-25, -hr + 12);
        ctx.quadraticCurveTo(-20, -hr - 8, -10, -hr + 8);
        ctx.quadraticCurveTo(-18, -hr, -25, -hr + 12);
        ctx.fill();

        // Hair highlight
        ctx.fillStyle = 'rgba(100, 70, 40, 0.5)';
        ctx.beginPath();
        ctx.moveTo(-10, -hr + 6);
        ctx.quadraticCurveTo(0, -hr - 15, 10, -hr + 6);
        ctx.quadraticCurveTo(0, -hr - 5, -10, -hr + 6);
        ctx.fill();
    }

    _drawCheeks(ctx) {
        // Rosy cheeks - more prominent
        const rosiness = 0.35 + this.stirAmount * 0.3 + this.cheekPuff * 0.2;
        const puffSize = 1 + this.cheekPuff * 0.4;

        // Left cheek
        const leftGrad = ctx.createRadialGradient(-26, 12, 0, -26, 12, 18 * puffSize);
        leftGrad.addColorStop(0, `rgba(255, 130, 120, ${rosiness})`);
        leftGrad.addColorStop(0.6, `rgba(255, 150, 140, ${rosiness * 0.5})`);
        leftGrad.addColorStop(1, 'rgba(255, 150, 140, 0)');
        ctx.fillStyle = leftGrad;
        ctx.beginPath();
        ctx.arc(-26, 12, 22 * puffSize, 0, Math.PI * 2);
        ctx.fill();

        // Right cheek
        const rightGrad = ctx.createRadialGradient(26, 12, 0, 26, 12, 18 * puffSize);
        rightGrad.addColorStop(0, `rgba(255, 130, 120, ${rosiness})`);
        rightGrad.addColorStop(0.6, `rgba(255, 150, 140, ${rosiness * 0.5})`);
        rightGrad.addColorStop(1, 'rgba(255, 150, 140, 0)');
        ctx.fillStyle = rightGrad;
        ctx.beginPath();
        ctx.arc(26, 12, 22 * puffSize, 0, Math.PI * 2);
        ctx.fill();
    }

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

    _darken(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
    }
}
