/**
 * HUD - in-game heads-up display with sleep meter, score, time, combo.
 * Bigger fonts, vibrant colors, more pop!
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/renderer.js';
import { clamp, formatTime } from '../engine/utils.js';

export class HUD {
    constructor() {
        this.sleepMeter = 100;
        this.displayMeter = 100;
        this.score = 0;
        this.displayScore = 0;
        this.timeSurvived = 0;
        this.fliesNeutralized = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.comboText = '';
        this.criticalPulse = 0;
        this.showTutorial = false;
        this.tutorialAlpha = 0;
        this.tutorialTimer = 0;

        // Fun Messages
        this.funMessage = '';
        this.funMessageAlpha = 0;
        this.funMessageTimer = 0;

        // Flash effects
        this.flashColor = null;
        this.flashTimer = 0;

        // Score popup
        this.popups = [];

        // Animated score bounce
        this.scoreScale = 1;
    }

    update(dt, sleepMeter, score, timeSurvived, fliesNeutralized) {
        this.sleepMeter = sleepMeter;
        this.timeSurvived = timeSurvived;
        this.fliesNeutralized = fliesNeutralized;

        // Smooth display values
        this.displayMeter += (sleepMeter - this.displayMeter) * dt * 8;

        // Score with bounce effect
        const prevScore = this.displayScore;
        this.displayScore += (score - this.displayScore) * dt * 5;
        if (Math.abs(score - prevScore) > 5) {
            this.scoreScale = 1.15;
        }
        this.scoreScale = Math.max(1, this.scoreScale - dt * 2);
        this.score = score;

        // Critical pulse
        if (sleepMeter < 25) {
            this.criticalPulse += dt * 5;
        } else {
            this.criticalPulse = 0;
        }

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
        } else {
            this.combo = 0;
        }

        // Flash timer
        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }

        // Tutorial
        if (this.showTutorial) {
            this.tutorialTimer += dt;
            this.tutorialAlpha = Math.min(1, this.tutorialAlpha + dt * 2);
        } else {
            this.tutorialAlpha = Math.max(0, this.tutorialAlpha - dt * 3);
        }

        // Update popups
        this.popups = this.popups.filter(p => {
            p.timer += dt;
            p.y -= dt * 70;
            p.scale = 1 + Math.sin(p.timer * 8) * 0.1 * Math.max(0, 1 - p.timer);
            return p.timer < 1.2;
        });

        // Fun message update
        if (this.funMessageTimer > 0) {
            this.funMessageTimer -= dt;
            this.funMessageAlpha = Math.min(1, this.funMessageAlpha + dt * 3);
        } else {
            this.funMessageAlpha = Math.max(0, this.funMessageAlpha - dt * 2);
        }
    }

    addCombo() {
        this.combo++;
        this.comboTimer = 3;
        if (this.combo >= 2) {
            const comboTexts = [
                `${this.combo}x COMBO!`,
                `${this.combo}x SMASH!`,
                `${this.combo}x STREAK!`,
                `${this.combo}x ON FIRE!`,
            ];
            this.comboText = comboTexts[Math.min(this.combo - 2, comboTexts.length - 1)];
        }
    }

    addScorePopup(x, y, text, color = '#FFD700') {
        this.popups.push({
            x, y, text, color, timer: 0, scale: 1.3
        });
    }

    setFunMessage(text) {
        this.funMessage = text;
        this.funMessageTimer = 4.0;
    }

    flash(color) {
        this.flashColor = color;
        this.flashTimer = 0.3;
    }

    draw(ctx, renderer) {
        this._drawSleepMeter(ctx);
        this._drawScore(ctx);
        this._drawTime(ctx);
        this._drawFliesCount(ctx);
        this._drawCombo(ctx);
        this._drawFunMessage(ctx);
        this._drawPopups(ctx);
        this._drawCriticalVignette(ctx);
        this._drawFlash(ctx);
        this._drawTutorial(ctx, renderer);
    }

    _drawSleepMeter(ctx) {
        const x = 15;
        const y = 30;
        const w = 170;
        const h = 18;
        const r = 9;
        const meter = clamp(this.displayMeter, 0, 100);

        // Label with emoji and bold font
        ctx.font = '800 13px Nunito';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText('💤 SLEEP', x, y - 4);
        ctx.shadowBlur = 0;

        // Background bar with glow
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this._roundRect(ctx, x, y, w, h, r);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Fill bar with gradient
        const fillW = Math.max(0, (w - 4) * (meter / 100));
        let primaryColor, secondaryColor, glowColor;

        if (meter > 60) {
            primaryColor = '#22D66F';  // Vibrant green
            secondaryColor = '#4AFF8F';
            glowColor = 'rgba(34, 214, 111, 0.5)';
        } else if (meter > 30) {
            primaryColor = '#FFB020';  // Vibrant amber
            secondaryColor = '#FFD060';
            glowColor = 'rgba(255, 176, 32, 0.5)';
        } else {
            const pulse = 0.7 + 0.3 * Math.sin(this.criticalPulse * 2);
            primaryColor = `rgba(255, 50, 50, ${pulse})`;
            secondaryColor = '#FF8080';
            glowColor = `rgba(255, 50, 50, ${pulse * 0.5})`;
        }

        if (fillW > 0) {
            const grad = ctx.createLinearGradient(x + 2, y, x + 2, y + h);
            grad.addColorStop(0, secondaryColor);
            grad.addColorStop(0.5, primaryColor);
            grad.addColorStop(1, primaryColor);
            ctx.fillStyle = grad;
            this._roundRect(ctx, x + 2, y + 2, fillW, h - 4, r - 2);
            ctx.fill();

            // Shiny highlight
            const shineGrad = ctx.createLinearGradient(x + 2, y + 2, x + 2, y + h / 2);
            shineGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
            shineGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
            ctx.fillStyle = shineGrad;
            this._roundRect(ctx, x + 2, y + 2, fillW, (h - 4) / 2, r - 2);
            ctx.fill();

            // Glow effect
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            this._roundRect(ctx, x + 2, y + 2, fillW, h - 4, r - 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Percentage text
        ctx.font = '900 13px Nunito';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(`${Math.round(meter)}%`, x + w / 2, y + h / 2 + 1);
        ctx.shadowBlur = 0;
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

    _drawScore(ctx) {
        ctx.save();
        ctx.translate(GAME_WIDTH - 20, 25);
        ctx.scale(this.scoreScale, this.scoreScale);

        // Score number - BIG and golden
        ctx.font = '900 42px Nunito';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';

        // Golden gradient
        const grad = ctx.createLinearGradient(-80, 0, 0, 0);
        grad.addColorStop(0, '#FFD700');
        grad.addColorStop(0.5, '#FFF176');
        grad.addColorStop(1, '#FFB300');
        ctx.fillStyle = grad;

        // Glow
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 3;

        ctx.fillText(Math.round(this.displayScore).toLocaleString(), 0, -5);

        // Label
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.font = '900 13px Nunito';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText('SCORE', 0, 38);

        ctx.restore();
    }

    _drawTime(ctx) {
        ctx.font = '700 14px Nunito';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(`⏱ ${formatTime(this.timeSurvived)}`, GAME_WIDTH - 20, 60);
        ctx.shadowBlur = 0;
    }

    _drawFliesCount(ctx) {
        ctx.font = '700 13px Nunito';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(`🪰 ${this.fliesNeutralized}`, 15, 55);
        ctx.shadowBlur = 0;
    }

    _drawCombo(ctx) {
        if (this.combo < 2 || this.comboTimer <= 0) return;

        const alpha = clamp(this.comboTimer, 0, 1);
        const scale = 1 + (this.combo - 1) * 0.12;
        const bounce = 1 + Math.sin(this.comboTimer * 10) * 0.05;

        ctx.save();
        ctx.translate(GAME_WIDTH / 2, 95);
        ctx.scale(scale * bounce, scale * bounce);
        ctx.globalAlpha = alpha;

        // Combo text with fire colors
        ctx.font = '900 28px Nunito';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const comboGrad = ctx.createLinearGradient(-60, 0, 60, 0);
        comboGrad.addColorStop(0, '#FF4444');
        comboGrad.addColorStop(0.5, '#FF8800');
        comboGrad.addColorStop(1, '#FFD700');
        ctx.fillStyle = comboGrad;

        ctx.shadowColor = 'rgba(255, 100, 0, 0.7)';
        ctx.shadowBlur = 15;
        ctx.fillText(this.comboText, 0, 0);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    _drawPopups(ctx) {
        for (const p of this.popups) {
            const alpha = Math.min(1, (1.2 - p.timer) * 2);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.scale(p.scale || 1, p.scale || 1);

            ctx.font = '900 26px Nunito';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = p.color || '#FFD700';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 8;
            ctx.fillText(p.text, 0, 0);
            ctx.shadowBlur = 0;

            ctx.restore();
        }
    }

    _drawFunMessage(ctx) {
        if (this.funMessageAlpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.funMessageAlpha;

        // Background pill
        ctx.font = 'italic 800 16px Nunito';
        ctx.textAlign = 'center';
        const metrics = ctx.measureText(this.funMessage);
        const pw = metrics.width + 30;
        const ph = 30;
        const px = GAME_WIDTH / 2 - pw / 2;
        const py = GAME_HEIGHT - 55;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this._roundRect(ctx, px, py, pw, ph, 15);
        ctx.fill();

        // Text
        ctx.fillStyle = '#FFE88C';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText(this.funMessage, GAME_WIDTH / 2, py + ph / 2 + 1);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    _drawCriticalVignette(ctx) {
        if (this.sleepMeter >= 25) return;

        const intensity = (25 - this.sleepMeter) / 25;
        const pulse = 0.5 + 0.5 * Math.sin(this.criticalPulse);
        const alpha = intensity * 0.35 * pulse;

        const grad = ctx.createRadialGradient(
            GAME_WIDTH / 2, GAME_HEIGHT * 0.4, 80,
            GAME_WIDTH / 2, GAME_HEIGHT * 0.4, 400
        );
        grad.addColorStop(0, 'rgba(200, 0, 0, 0)');
        grad.addColorStop(1, `rgba(200, 0, 0, ${alpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    _drawFlash(ctx) {
        if (this.flashTimer <= 0) return;
        const alpha = this.flashTimer / 0.3 * 0.25;
        ctx.fillStyle = this.flashColor || `rgba(255, 255, 255, ${alpha})`;
        ctx.globalAlpha = alpha;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.globalAlpha = 1;
    }

    _drawTutorial(ctx, renderer) {
        if (this.tutorialAlpha <= 0) return;

        ctx.globalAlpha = this.tutorialAlpha * 0.9;
        ctx.fillStyle = 'rgba(0, 0, 20, 0.75)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.globalAlpha = this.tutorialAlpha;

        const cy = GAME_HEIGHT * 0.45;

        // Title with glow
        renderer.drawText('🎮 How to Play', GAME_WIDTH / 2, cy - 100, {
            font: '900 32px Nunito',
            color: '#FFD700',
            shadowColor: 'rgba(255, 215, 0, 0.5)',
            shadowBlur: 20,
        });

        // Instruction cards
        const instructions = [
            { emoji: '👆', text: 'Swipe to SHOO away', sub: 'Safe & earns small points', y: cy - 40 },
            { emoji: '👇', text: 'Tap to SQUASH', sub: 'Big points but risky!', y: cy + 20 },
            { emoji: '⚠️', text: "Don't tap the baby!", sub: 'Game over if you do!', y: cy + 80 },
        ];

        for (const inst of instructions) {
            // Instruction background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            this._roundRect(ctx, 30, inst.y - 18, GAME_WIDTH - 60, 50, 12);
            ctx.fill();

            renderer.drawText(`${inst.emoji}  ${inst.text}`, GAME_WIDTH / 2, inst.y, {
                font: '700 17px Nunito',
                color: '#fff',
                shadowBlur: 0,
            });
            renderer.drawText(inst.sub, GAME_WIDTH / 2, inst.y + 22, {
                font: '600 12px Nunito',
                color: 'rgba(255,255,255,0.5)',
                shadowBlur: 0,
            });
        }

        // Pro tip
        renderer.drawText('💡 Flies are VERY hard to squash!', GAME_WIDTH / 2, cy + 140, {
            font: '700 14px Nunito',
            color: '#FF6B6B',
            shadowBlur: 0,
        });

        // Tap to start
        const blink = 0.5 + 0.5 * Math.sin(this.tutorialTimer * 4);
        ctx.globalAlpha = this.tutorialAlpha * blink;
        renderer.drawText('TAP ANYWHERE TO START', GAME_WIDTH / 2, cy + 185, {
            font: '900 16px Nunito',
            color: '#4AFF8F',
            shadowColor: 'rgba(74, 255, 143, 0.5)',
            shadowBlur: 10,
        });

        ctx.globalAlpha = 1;
    }

    _lighten(color, factor) {
        if (color.startsWith('rgb')) return color;
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgb(${Math.min(255, Math.floor(r * factor))}, ${Math.min(255, Math.floor(g * factor))}, ${Math.min(255, Math.floor(b * factor))})`;
    }

    _darken(color, factor = 0.7) {
        if (color.startsWith('rgb')) return color;
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
    }
}
