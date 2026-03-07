/**
 * Fly Entity - richly rendered devious fly with iridescent wings,
 * detailed body segments, and expressive cartoon eyes.
 * 85%+ dodge chance on tap, fast and unpredictable.
 * Buzzing near baby drains sleep meter.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/renderer.js';
import { lerp, clamp, dist, angleBetween, randFloat, randInt } from '../engine/utils.js';

export class Fly {
    constructor(spawnEdge = null) {
        this._spawn(spawnEdge);

        // Movement
        this.vx = 0;
        this.vy = 0;
        this.speed = 100;
        this.maxSpeed = 280;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderTimer = 0;
        this.wanderChangeDuration = randFloat(0.3, 1.2);

        // Behavior
        this.state = 'wandering';
        this.babyBias = 0.3;
        this.approachTimer = 0;
        this.landingTimer = 0;
        this.landingTarget = null;
        this.shooedTimer = 0;
        this.shooVx = 0;
        this.shooVy = 0;
        this.deadTimer = 0;

        // Dodge mechanics
        this.dodgeCooldown = 0;
        this.dodgeSpeed = 500;
        this.reactionTime = 0.05;

        // Visual
        this.wingPhase = Math.random() * Math.PI * 2;
        this.size = 11;
        this.rotation = 0;
        this.squashScale = 1;
        this.alpha = 1;
        this.id = Date.now() + Math.random();

        // Erratic movement
        this.erraticPhase = Math.random() * Math.PI * 2;
        this.zigzagAmplitude = randFloat(30, 80);
        this.zigzagFreq = randFloat(3, 7);

        // Difficulty
        this.speedMultiplier = 1;
        this.dodgeChance = 0.85;

        // Buzzing intensity for audio
        this.buzzIntensity = 1;

        // Leg wiggle animation
        this.legPhase = Math.random() * Math.PI * 2;
    }

    _spawn(edge) {
        if (!edge) edge = randInt(0, 3);
        switch (edge) {
            case 0:
                this.x = randFloat(30, GAME_WIDTH - 30);
                this.y = -20;
                break;
            case 1:
                this.x = GAME_WIDTH + 20;
                this.y = randFloat(30, GAME_HEIGHT * 0.7);
                break;
            case 2:
                this.x = randFloat(30, GAME_WIDTH - 30);
                this.y = GAME_HEIGHT * 0.8;
                break;
            case 3:
                this.x = -20;
                this.y = randFloat(30, GAME_HEIGHT * 0.7);
                break;
        }
    }

    update(dt, babyInfo, gameTime) {
        this.wingPhase += dt * 45;
        this.erraticPhase += dt * this.zigzagFreq;
        this.legPhase += dt * 8;
        this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);

        this.speedMultiplier = 1 + Math.min(gameTime / 90, 3.0);
        this.dodgeChance = Math.min(0.92, 0.85 + gameTime / 600);

        switch (this.state) {
            case 'wandering':
                this._updateWander(dt, babyInfo);
                break;
            case 'approaching':
                this._updateApproach(dt, babyInfo);
                break;
            case 'landing':
                this._updateLanding(dt, babyInfo);
                break;
            case 'circling':
                this._updateCircling(dt, babyInfo);
                break;
            case 'shooed':
                this._updateShooed(dt);
                break;
            case 'dead':
                this._updateDead(dt);
                break;
        }

        if (this.state !== 'dead' && this.state !== 'landing') {
            const targetRot = Math.atan2(this.vy, this.vx);
            this.rotation = lerp(this.rotation, targetRot, dt * 5);
        }

        if (this.state !== 'shooed' && this.state !== 'dead') {
            this.x = clamp(this.x, -10, GAME_WIDTH + 10);
            this.y = clamp(this.y, -10, GAME_HEIGHT * 0.8);
        }
    }

    _updateWander(dt, babyInfo) {
        this.wanderTimer += dt;

        if (this.wanderTimer >= this.wanderChangeDuration) {
            this.wanderTimer = 0;
            this.wanderChangeDuration = randFloat(0.3, 1.0);

            if (Math.random() < this.babyBias) {
                if (Math.random() < 0.4) {
                    this.state = 'circling';
                    this.approachTimer = 0;
                } else {
                    this.state = 'approaching';
                    this.approachTimer = 0;
                }
                return;
            }

            this.wanderAngle += randFloat(-Math.PI / 2, Math.PI / 2);
        }

        this.wanderAngle += (Math.random() - 0.5) * dt * 5;
        const erratic = Math.sin(this.erraticPhase) * this.zigzagAmplitude * dt;

        const spd = this.speed * this.speedMultiplier * 0.7;
        const targetVx = Math.cos(this.wanderAngle) * spd;
        const targetVy = Math.sin(this.wanderAngle) * spd + erratic;

        this.vx = lerp(this.vx, targetVx, dt * 4);
        this.vy = lerp(this.vy, targetVy, dt * 4);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.x < 10 || this.x > GAME_WIDTH - 10) {
            this.vx *= -1;
            this.wanderAngle = Math.atan2(this.vy, this.vx);
        }
        if (this.y < 10 || this.y > GAME_HEIGHT * 0.75) {
            this.vy *= -1;
            this.wanderAngle = Math.atan2(this.vy, this.vx);
        }
    }

    _updateCircling(dt, babyInfo) {
        this.approachTimer += dt;

        const angle = angleBetween(babyInfo.x, babyInfo.y, this.x, this.y);
        const circleAngle = angle + Math.PI / 2;
        const d = dist(this.x, this.y, babyInfo.x, babyInfo.y);
        const targetDist = 80 + Math.sin(this.approachTimer * 2) * 20;

        const radialForce = (d - targetDist) * 2;
        const spd = this.speed * this.speedMultiplier * 0.8;

        this.vx = lerp(this.vx, Math.cos(circleAngle) * spd - Math.cos(angle) * radialForce, dt * 3);
        this.vy = lerp(this.vy, Math.sin(circleAngle) * spd - Math.sin(angle) * radialForce, dt * 3);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.approachTimer > 2 + Math.random() * 2) {
            this.state = 'approaching';
            this.approachTimer = 0;
        }
    }

    _updateApproach(dt, babyInfo) {
        this.approachTimer += dt;

        const angle = angleBetween(this.x, this.y, babyInfo.x, babyInfo.y);
        const jitter = Math.sin(this.approachTimer * 8) * 0.8;
        const zigzag = Math.cos(this.approachTimer * 5) * 0.5;
        const spd = this.speed * this.speedMultiplier * 1.2;

        this.vx = lerp(this.vx, Math.cos(angle + jitter + zigzag) * spd, dt * 2.5);
        this.vy = lerp(this.vy, Math.sin(angle + jitter + zigzag) * spd, dt * 2.5);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        const d = dist(this.x, this.y, babyInfo.x, babyInfo.y);
        if (d < 30) {
            this.state = 'landing';
            this.landingTimer = 0;
            this.landingTarget = { x: babyInfo.x + randFloat(-12, 12), y: babyInfo.y + randFloat(-8, 8) };
        }

        if (this.approachTimer > 3) {
            this.state = Math.random() < 0.3 ? 'circling' : 'wandering';
            this.wanderAngle = Math.random() * Math.PI * 2;
            this.approachTimer = 0;
        }
    }

    _updateLanding(dt, babyInfo) {
        this.landingTimer += dt;

        if (this.landingTarget) {
            this.x = lerp(this.x, this.landingTarget.x, dt * 3);
            this.y = lerp(this.y, this.landingTarget.y, dt * 3);
            this.vx = lerp(this.vx, 0, dt * 5);
            this.vy = lerp(this.vy, 0, dt * 5);
        }
    }

    isOnBaby(babyInfo) {
        if (this.state !== 'landing') return false;
        return dist(this.x, this.y, babyInfo.x, babyInfo.y) < 40;
    }

    getProximity(babyInfo) {
        const d = dist(this.x, this.y, babyInfo.x, babyInfo.y);
        const maxDist = 220;
        return clamp(1 - d / maxDist, 0, 1);
    }

    shoo(dx, dy, force = 300) {
        if (this.state === 'dead') return;
        this.state = 'shooed';
        this.shooedTimer = 0;
        const mag = Math.sqrt(dx * dx + dy * dy) || 1;
        this.shooVx = (dx / mag) * force * this.speedMultiplier;
        this.shooVy = (dy / mag) * force * this.speedMultiplier;
    }

    _updateShooed(dt) {
        this.shooedTimer += dt;
        this.x += this.shooVx * dt;
        this.y += this.shooVy * dt;
        this.shooVx *= 0.93;
        this.shooVy *= 0.93;

        if (this.shooedTimer > 0.5) {
            if (this.x < -30 || this.x > GAME_WIDTH + 30 || this.y < -30 || this.y > GAME_HEIGHT + 30) {
                this.state = 'dead';
                this.deadTimer = 0;
                return;
            }
            this.state = 'wandering';
            this.wanderAngle = Math.atan2(this.shooVy, this.shooVx);
        }
    }

    dodge(tx, ty) {
        if (this.state === 'dead' || this.dodgeCooldown > 0) return;
        this.state = 'shooed';
        this.shooedTimer = 0;
        this.dodgeCooldown = 0.3;

        const baseAngle = Math.atan2(this.y - ty, this.x - tx);
        const randomOffset = randFloat(-Math.PI / 3, Math.PI / 3);
        const force = this.dodgeSpeed * this.speedMultiplier;

        this.shooVx = Math.cos(baseAngle + randomOffset) * force;
        this.shooVy = Math.sin(baseAngle + randomOffset) * force;
    }

    squash() {
        this.state = 'dead';
        this.deadTimer = 0;
        this.squashScale = 0.15;
        this.buzzIntensity = 0;
    }

    _updateDead(dt) {
        this.deadTimer += dt;
        this.alpha = Math.max(0, 1 - this.deadTimer * 3);
        this.buzzIntensity = 0;
    }

    isDead() {
        return this.state === 'dead' && this.deadTimer > 0.5;
    }

    draw(ctx) {
        if (this.state === 'dead' && this.deadTimer > 0.5) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;

        if (this.state === 'dead') {
            ctx.scale(1, this.squashScale);
        }

        // Buzzing motion blur effect when moving fast
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 100 && this.state !== 'dead') {
            ctx.globalAlpha = this.alpha * 0.15;
            ctx.save();
            ctx.translate(-this.vx * 0.01, -this.vy * 0.01);
            this._drawFlyBody(ctx);
            ctx.restore();
            ctx.globalAlpha = this.alpha;
        }

        this._drawFlyBody(ctx);

        ctx.restore();
    }

    _drawFlyBody(ctx) {
        const s = this.size;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(2, 15, 8, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // ═══ WINGS ═══
        const wingAngle = Math.sin(this.wingPhase) * 0.8;
        const wingSize = this.state === 'landing' ? 7 : 10;

        // Wing iridescence with multi-color gradient
        [-1, 1].forEach(side => {
            ctx.save();
            ctx.rotate(side * (-wingAngle - 0.3));

            // Wing glow
            const wingGlow = ctx.createRadialGradient(side * 4, -5, 0, side * 4, -5, wingSize * 1.2);
            wingGlow.addColorStop(0, 'rgba(200, 230, 255, 0.45)');
            wingGlow.addColorStop(0.3, 'rgba(180, 220, 255, 0.35)');
            wingGlow.addColorStop(0.6, 'rgba(200, 210, 240, 0.2)');
            wingGlow.addColorStop(1, 'rgba(160, 190, 220, 0.05)');
            ctx.fillStyle = wingGlow;
            ctx.beginPath();
            ctx.ellipse(side * 4, -5, wingSize, wingSize * 0.55, side * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Wing vein detail
            ctx.strokeStyle = 'rgba(160, 190, 230, 0.25)';
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(side * 1, -5);
            ctx.lineTo(side * (wingSize - 2), -5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(side * 2, -4);
            ctx.lineTo(side * (wingSize - 3), -7);
            ctx.stroke();

            // Wing rim
            ctx.strokeStyle = 'rgba(180, 210, 255, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.ellipse(side * 4, -5, wingSize, wingSize * 0.55, side * 0.5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        });

        // ═══ BODY SEGMENTS ═══
        // Abdomen (rear) with stripy shading
        const abdGrad = ctx.createLinearGradient(0, 2, 0, s * 0.9 + 5);
        abdGrad.addColorStop(0, '#3a3a3a');
        abdGrad.addColorStop(0.3, '#2a2a2a');
        abdGrad.addColorStop(0.5, '#353535');
        abdGrad.addColorStop(0.7, '#252525');
        abdGrad.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = abdGrad;
        ctx.beginPath();
        ctx.ellipse(0, 5, s * 0.45, s * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        // Abdomen segment lines
        ctx.strokeStyle = 'rgba(80, 80, 80, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 3 + i * 3, s * 0.4 - i * 1, -0.3, Math.PI + 0.3, true);
            ctx.stroke();
        }

        // Abdomen highlight
        const abdHighlight = ctx.createRadialGradient(-s * 0.1, 3, 0, 0, 5, s * 0.4);
        abdHighlight.addColorStop(0, 'rgba(100, 100, 100, 0.2)');
        abdHighlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = abdHighlight;
        ctx.beginPath();
        ctx.ellipse(0, 5, s * 0.45, s * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thorax (middle) with sheen
        const thoraxGrad = ctx.createRadialGradient(-s * 0.1, -3, 1, 0, -2, s * 0.55);
        thoraxGrad.addColorStop(0, '#4a4a4a');
        thoraxGrad.addColorStop(0.5, '#2e2e2e');
        thoraxGrad.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = thoraxGrad;
        ctx.beginPath();
        ctx.ellipse(0, -2, s * 0.5, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // ═══ HEAD ═══
        const headGrad = ctx.createRadialGradient(-s * 0.1, -s * 0.85, 1, 0, -s * 0.8, s * 0.5);
        headGrad.addColorStop(0, '#454545');
        headGrad.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(0, -s * 0.8, s * 0.48, 0, Math.PI * 2);
        ctx.fill();

        // ═══ EYES ═══
        const eyeY = -s * 0.95;
        const eyeX = s * 0.24;
        const eyeSize = s * 0.38;

        [-1, 1].forEach(side => {
            const ex = side * eyeX;

            // Eye socket shadow
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.arc(ex, eyeY + 1, eyeSize + 1, 0, Math.PI * 2);
            ctx.fill();

            // Eye whites with gradient
            const eyeGrad = ctx.createRadialGradient(ex - 1, eyeY - 1, 0, ex, eyeY, eyeSize);
            eyeGrad.addColorStop(0, '#ffffff');
            eyeGrad.addColorStop(0.8, '#f5f5f5');
            eyeGrad.addColorStop(1, '#dddddd');
            ctx.fillStyle = eyeGrad;
            ctx.beginPath();
            ctx.arc(ex, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Red-ish iris (evil fly!)
            const pupilOffset = Math.sin(this.wingPhase * 0.3) * 0.8;
            const irisGrad = ctx.createRadialGradient(ex + pupilOffset, eyeY, 0, ex + pupilOffset, eyeY, eyeSize * 0.55);
            irisGrad.addColorStop(0, '#cc2200');
            irisGrad.addColorStop(0.6, '#880000');
            irisGrad.addColorStop(1, '#550000');
            ctx.fillStyle = irisGrad;
            ctx.beginPath();
            ctx.arc(ex + pupilOffset, eyeY, eyeSize * 0.55, 0, Math.PI * 2);
            ctx.fill();

            // Pupil
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(ex + pupilOffset, eyeY, eyeSize * 0.28, 0, Math.PI * 2);
            ctx.fill();

            // Eye highlights
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath();
            ctx.arc(ex - 1, eyeY - 1.5, eyeSize * 0.18, 0, Math.PI * 2);
            ctx.fill();

            // Secondary highlight
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.beginPath();
            ctx.arc(ex + 1.5, eyeY + 1, eyeSize * 0.1, 0, Math.PI * 2);
            ctx.fill();
        });

        // Evil eyebrow furrowing
        ctx.strokeStyle = 'rgba(100,100,100,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-eyeX - eyeSize * 0.5, eyeY - eyeSize - 1);
        ctx.lineTo(-eyeX + eyeSize * 0.3, eyeY - eyeSize + 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(eyeX + eyeSize * 0.5, eyeY - eyeSize - 1);
        ctx.lineTo(eyeX - eyeSize * 0.3, eyeY - eyeSize + 1);
        ctx.stroke();

        // Mischievous smile
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, -s * 0.55, s * 0.2, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // ═══ ANTENNAE ═══
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        const antennaWiggle = Math.sin(this.wingPhase * 0.5) * 2;
        [-1, 1].forEach(side => {
            ctx.beginPath();
            ctx.moveTo(side * 3, -s * 1.15);
            ctx.quadraticCurveTo(side * (6 + antennaWiggle), -s * 1.6, side * (8 + antennaWiggle * 0.5), -s * 1.45);
            ctx.stroke();
            // Antenna tip ball
            ctx.fillStyle = '#3a3a3a';
            ctx.beginPath();
            ctx.arc(side * (8 + antennaWiggle * 0.5), -s * 1.45, 1.2, 0, Math.PI * 2);
            ctx.fill();
        });

        // ═══ LEGS ═══
        if (this.state === 'landing' || this.state === 'circling') {
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            const legWiggle = Math.sin(this.legPhase) * 1;
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 3, 3);
                ctx.quadraticCurveTo(i * 7 + legWiggle, 8, i * 5, 11);
                ctx.stroke();
            }
        }
    }
}
