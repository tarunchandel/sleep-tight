/**
 * Fly Entity - a devious, hard-to-catch fly with erratic movement.
 * 85%+ dodge chance on tap, fast and unpredictable.
 * Buzzing near baby drains sleep meter.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/renderer.js';
import { lerp, clamp, dist, angleBetween, randFloat, randInt } from '../engine/utils.js';

export class Fly {
    constructor(spawnEdge = null) {
        this._spawn(spawnEdge);

        // Movement - faster base speed
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

        // Dodge mechanics - harder to kill
        this.dodgeCooldown = 0;
        this.dodgeSpeed = 500;
        this.reactionTime = 0.05; // very fast reaction

        // Visual
        this.wingPhase = Math.random() * Math.PI * 2;
        this.size = 10; // Slightly bigger for visibility
        this.rotation = 0;
        this.squashScale = 1;
        this.alpha = 1;
        this.id = Date.now() + Math.random();

        // Erratic movement modifiers
        this.erraticPhase = Math.random() * Math.PI * 2;
        this.zigzagAmplitude = randFloat(30, 80);
        this.zigzagFreq = randFloat(3, 7);

        // Difficulty
        this.speedMultiplier = 1;
        this.dodgeChance = 0.85; // 85% base dodge chance!

        // Buzzing intensity for audio
        this.buzzIntensity = 1;
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
        this.wingPhase += dt * 45; // Faster wing flutter
        this.erraticPhase += dt * this.zigzagFreq;
        this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);

        // Speed increases over time
        this.speedMultiplier = 1 + Math.min(gameTime / 90, 3.0);

        // Dodge chance increases slightly over time too
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

        // Rotation follows movement
        if (this.state !== 'dead' && this.state !== 'landing') {
            const targetRot = Math.atan2(this.vy, this.vx);
            this.rotation = lerp(this.rotation, targetRot, dt * 5);
        }

        // Clamp to screen bounds
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
                // 50% chance to circle before approaching
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

        // Erratic movement - zigzag pattern
        this.wanderAngle += (Math.random() - 0.5) * dt * 5;
        const erratic = Math.sin(this.erraticPhase) * this.zigzagAmplitude * dt;

        const spd = this.speed * this.speedMultiplier * 0.7;
        const targetVx = Math.cos(this.wanderAngle) * spd;
        const targetVy = Math.sin(this.wanderAngle) * spd + erratic;

        this.vx = lerp(this.vx, targetVx, dt * 4);
        this.vy = lerp(this.vy, targetVy, dt * 4);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Bounce off edges
        if (this.x < 10 || this.x > GAME_WIDTH - 10) {
            this.vx *= -1;
            this.wanderAngle = Math.atan2(this.vy, this.vx);
        }
        if (this.y < 10 || this.y > GAME_HEIGHT * 0.75) {
            this.vy *= -1;
            this.wanderAngle = Math.atan2(this.vy, this.vx);
        }
    }

    /** New behavior: circle around baby before approaching */
    _updateCircling(dt, babyInfo) {
        this.approachTimer += dt;

        const angle = angleBetween(babyInfo.x, babyInfo.y, this.x, this.y);
        const circleAngle = angle + Math.PI / 2; // perpendicular = circle
        const d = dist(this.x, this.y, babyInfo.x, babyInfo.y);
        const targetDist = 80 + Math.sin(this.approachTimer * 2) * 20;

        // Move in a circle around baby
        const radialForce = (d - targetDist) * 2;
        const spd = this.speed * this.speedMultiplier * 0.8;

        this.vx = lerp(this.vx, Math.cos(circleAngle) * spd - Math.cos(angle) * radialForce, dt * 3);
        this.vy = lerp(this.vy, Math.sin(circleAngle) * spd - Math.sin(angle) * radialForce, dt * 3);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // After circling, dive in
        if (this.approachTimer > 2 + Math.random() * 2) {
            this.state = 'approaching';
            this.approachTimer = 0;
        }
    }

    _updateApproach(dt, babyInfo) {
        this.approachTimer += dt;

        const angle = angleBetween(this.x, this.y, babyInfo.x, babyInfo.y);

        // Very erratic approach - hard to predict
        const jitter = Math.sin(this.approachTimer * 8) * 0.8;
        const zigzag = Math.cos(this.approachTimer * 5) * 0.5;
        const spd = this.speed * this.speedMultiplier * 1.2; // Faster approach

        this.vx = lerp(this.vx, Math.cos(angle + jitter + zigzag) * spd, dt * 2.5);
        this.vy = lerp(this.vy, Math.sin(angle + jitter + zigzag) * spd, dt * 2.5);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Land when close
        const d = dist(this.x, this.y, babyInfo.x, babyInfo.y);
        if (d < 30) {
            this.state = 'landing';
            this.landingTimer = 0;
            this.landingTarget = { x: babyInfo.x + randFloat(-12, 12), y: babyInfo.y + randFloat(-8, 8) };
        }

        // Give up and wander or circle again
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

    /** Dodge a tap - very fast evasive maneuver */
    dodge(tx, ty) {
        if (this.state === 'dead' || this.dodgeCooldown > 0) return;
        this.state = 'shooed';
        this.shooedTimer = 0;
        this.dodgeCooldown = 0.3;

        // Dodge in a random direction away from tap, NOT just straight away
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

        // Shadow on the crib
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(2, 14, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings - iridescent
        const wingAngle = Math.sin(this.wingPhase) * 0.8;
        const wingSize = this.state === 'landing' ? 6 : 9;

        // Wing iridescence
        const wingGrad = ctx.createRadialGradient(0, -4, 0, 0, -4, wingSize);
        wingGrad.addColorStop(0, 'rgba(180, 210, 255, 0.5)');
        wingGrad.addColorStop(0.5, 'rgba(200, 230, 255, 0.35)');
        wingGrad.addColorStop(1, 'rgba(160, 190, 240, 0.2)');
        ctx.fillStyle = wingGrad;

        ctx.strokeStyle = 'rgba(180, 200, 240, 0.4)';
        ctx.lineWidth = 0.5;

        // Left wing
        ctx.save();
        ctx.rotate(-wingAngle - 0.3);
        ctx.beginPath();
        ctx.ellipse(-4, -5, wingSize, wingSize * 0.5, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Right wing
        ctx.save();
        ctx.rotate(wingAngle + 0.3);
        ctx.beginPath();
        ctx.ellipse(4, -5, wingSize, wingSize * 0.5, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Body - dark with slight sheen
        const bodyGrad = ctx.createLinearGradient(0, -this.size * 0.8, 0, this.size * 0.8);
        bodyGrad.addColorStop(0, '#3a3a3a');
        bodyGrad.addColorStop(0.5, '#2a2a2a');
        bodyGrad.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = bodyGrad;

        // Thorax
        ctx.beginPath();
        ctx.ellipse(0, -2, this.size * 0.5, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Abdomen
        ctx.beginPath();
        ctx.ellipse(0, 5, this.size * 0.4, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.8, this.size * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Big cartoon eyes - evil but cute
        const eyeY = -this.size * 0.9;
        const eyeX = this.size * 0.22;
        const eyeSize = this.size * 0.35;

        // Eye whites
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Red-ish iris (evil fly!)
        ctx.fillStyle = '#880000';
        const pupilOffset = Math.sin(this.wingPhase * 0.3) * 0.8;
        ctx.beginPath();
        ctx.arc(-eyeX + pupilOffset, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX + pupilOffset, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-eyeX + pupilOffset, eyeY, eyeSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX + pupilOffset, eyeY, eyeSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlight
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(-eyeX - 1, eyeY - 1, eyeSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX - 1, eyeY - 1, eyeSize * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Mischievous smile
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.55, this.size * 0.18, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Antennae
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3, -this.size * 1.1);
        ctx.quadraticCurveTo(-6, -this.size * 1.5, -8, -this.size * 1.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(3, -this.size * 1.1);
        ctx.quadraticCurveTo(6, -this.size * 1.5, 8, -this.size * 1.4);
        ctx.stroke();

        // Legs
        if (this.state === 'landing' || this.state === 'circling') {
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 3, 3);
                ctx.quadraticCurveTo(i * 7, 8, i * 5, 10);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}
