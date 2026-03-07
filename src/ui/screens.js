/**
 * Menu Screens - Main Menu, Game Over, Leaderboard, and Settings.
 * All rendered on the game canvas with vibrant, popping visuals.
 * Fun messages scattered everywhere!
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/renderer.js';
import { formatTime, ease } from '../engine/utils.js';

export class MenuScreen {
    constructor() {
        this.animTimer = 0;
        this.selectedButton = -1;
        this.buttons = [];
        this._setupButtons();

        this.titleY = -50;
        this.titleTargetY = 160;
        this.subtitleAlpha = 0;
        this.buttonsAlpha = 0;
        this.floatPhase = Math.random() * Math.PI * 2;

        // Fun taglines that rotate
        this.taglines = [
            "Shhh... the baby is sleeping! 🤫",
            "Can you outsmart the flies? 🪰",
            "Protect. Shoo. Survive! 💪",
            "One tap could end it all... 😱",
            "The cutest game ever! 👶",
            "Warning: Highly addictive! ⚠️",
        ];
        this.currentTagline = 0;
        this.taglineTimer = 0;
        this.coins = 0;
    }

    _setupButtons() {
        this.buttons = [
            { id: 'play', label: '▶  PLAY', x: GAME_WIDTH / 2, y: 380, w: 220, h: 56, color: '#22D66F', textColor: '#0a2e14', glow: 'rgba(34, 214, 111, 0.4)' },
            { id: 'shop', label: '🛒  SHOP', x: GAME_WIDTH / 2, y: 445, w: 220, h: 48, color: '#FFD700', textColor: '#3d2c08', glow: 'rgba(255, 215, 0, 0.3)' },
            { id: 'leaderboard', label: '🏆  SCORES', x: GAME_WIDTH / 2, y: 505, w: 220, h: 48, color: '#FFB300', textColor: '#3d2c08', glow: 'rgba(255, 179, 0, 0.3)' },
            { id: 'settings', label: '⚙️  SETTINGS', x: GAME_WIDTH / 2, y: 565, w: 220, h: 48, color: 'rgba(255,255,255,0.15)', textColor: '#fff', glow: 'rgba(255,255,255,0.1)' },
        ];
    }

    update(dt) {
        this.animTimer += dt;

        const t = Math.min(this.animTimer / 0.8, 1);
        this.titleY = -50 + (this.titleTargetY + 50) * ease.outElastic(t);
        this.subtitleAlpha = Math.min(1, Math.max(0, (this.animTimer - 0.3) * 2));
        this.buttonsAlpha = Math.min(1, Math.max(0, (this.animTimer - 0.5) * 2));
        this.floatPhase += dt;

        // Rotate taglines
        this.taglineTimer += dt;
        if (this.taglineTimer > 3.5) {
            this.taglineTimer = 0;
            this.currentTagline = (this.currentTagline + 1) % this.taglines.length;
        }
    }

    handleTap(x, y) {
        if (this.buttonsAlpha < 0.5) return null;
        for (const btn of this.buttons) {
            if (x >= btn.x - btn.w / 2 && x <= btn.x + btn.w / 2 &&
                y >= btn.y - btn.h / 2 && y <= btn.y + btn.h / 2) {
                return btn.id;
            }
        }
        return null;
    }

    draw(ctx, renderer) {
        // Dark overlay
        ctx.fillStyle = 'rgba(5, 5, 20, 0.88)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Decorative particles
        this._drawDecorations(ctx);

        // Moon emoji with glow
        ctx.save();
        ctx.translate(GAME_WIDTH / 2, this.titleY);
        const titleScale = 1 + Math.sin(this.floatPhase * 0.5) * 0.03;
        ctx.scale(titleScale, titleScale);

        renderer.drawText('🌙', 0, -65, {
            font: '56px sans-serif',
            shadowBlur: 25,
            shadowColor: 'rgba(255, 220, 150, 0.5)',
        });

        // Title - BIG and warm
        renderer.drawText('Sleep Tight', 0, 0, {
            font: '900 48px Nunito',
            color: '#FFF5E0',
            shadowColor: 'rgba(255, 245, 224, 0.4)',
            shadowBlur: 25,
        });
        ctx.restore();

        // Rotating tagline
        ctx.globalAlpha = this.subtitleAlpha;
        const taglineFade = Math.min(1, Math.abs(Math.sin(this.taglineTimer / 3.5 * Math.PI)));
        ctx.globalAlpha = this.subtitleAlpha * taglineFade;
        renderer.drawText(this.taglines[this.currentTagline], GAME_WIDTH / 2, 230, {
            font: '700 15px Nunito',
            color: 'rgba(255, 230, 180, 0.8)',
        });
        ctx.globalAlpha = 1;

        // Fun tip below tagline
        ctx.globalAlpha = this.subtitleAlpha * 0.5;
        renderer.drawText('👶 Made with love for babies everywhere', GAME_WIDTH / 2, 260, {
            font: '600 11px Nunito',
            color: 'rgba(255, 255, 255, 0.4)',
        });
        ctx.globalAlpha = 1;

        // Instructions mini-preview
        ctx.globalAlpha = this.subtitleAlpha * 0.6;
        renderer.drawText('👆 Swipe = Shoo  |  👇 Tap = Squash', GAME_WIDTH / 2, 340, {
            font: '700 12px Nunito',
            color: 'rgba(255, 255, 255, 0.5)',
        });
        ctx.globalAlpha = 1;

        // Coin balance badge - subtle but visible
        if (this.coins > 0) {
            ctx.globalAlpha = this.buttonsAlpha * 0.8;
            // Background pill
            ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
            this._roundRectPath(ctx, GAME_WIDTH / 2 - 50, 295, 100, 26, 13);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
            ctx.lineWidth = 1;
            this._roundRectPath(ctx, GAME_WIDTH / 2 - 50, 295, 100, 26, 13);
            ctx.stroke();
            renderer.drawText(`🪙 ${this.coins}`, GAME_WIDTH / 2, 308, {
                font: '700 13px Nunito',
                color: '#FFD700',
                shadowBlur: 0,
                shadowOffY: 0,
            });
            ctx.globalAlpha = 1;
        }

        // Buttons
        ctx.globalAlpha = this.buttonsAlpha;
        for (const btn of this.buttons) {
            this._drawButton(ctx, btn, renderer);
        }
        ctx.globalAlpha = 1;

        // Version with fun flavor
        ctx.globalAlpha = 0.35;
        renderer.drawText('v3.0.0 — "The Coin Hunter Update"', GAME_WIDTH / 2, GAME_HEIGHT - 25, {
            font: '600 10px Nunito',
            color: '#fff',
        });
        ctx.globalAlpha = 1;
    }

    _drawButton(ctx, btn, renderer) {
        const r = 14;
        const hoverBounce = 1 + Math.sin(this.floatPhase * 2 + btn.y * 0.01) * 0.01;

        ctx.save();
        ctx.translate(btn.x, btn.y);
        ctx.scale(hoverBounce, hoverBounce);

        // Button shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this._roundRectPath(ctx, -btn.w / 2, -btn.h / 2 + 4, btn.w, btn.h, r);
        ctx.fill();

        // Button glow
        ctx.shadowColor = btn.glow || 'transparent';
        ctx.shadowBlur = 15;

        // Button body
        ctx.fillStyle = btn.color;
        this._roundRectPath(ctx, -btn.w / 2, -btn.h / 2, btn.w, btn.h, r);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Shiny top highlight
        if (btn.color.startsWith('#')) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            this._roundRectPath(ctx, -btn.w / 2 + 2, -btn.h / 2 + 2, btn.w - 4, btn.h / 2 - 2, r - 2);
            ctx.fill();
        }

        // Button text
        renderer.drawText(btn.label, 0, 0, {
            font: `900 ${btn.h > 50 ? 20 : 16}px Nunito`,
            color: btn.textColor,
            shadowBlur: 0,
            shadowOffY: 0,
        });

        ctx.restore();
    }

    _drawDecorations(ctx) {
        // Floating Zzz
        const zzz = ['Z', 'z', 'Z', 'z'];
        for (let i = 0; i < 4; i++) {
            const x = 60 + i * 35 + Math.sin(this.floatPhase + i) * 15;
            const y = 310 + Math.sin(this.floatPhase * 0.7 + i * 1.5) * 20 - i * 25;
            ctx.globalAlpha = 0.12 - i * 0.02;
            ctx.font = `${800 - i * 100} ${22 - i * 3}px Nunito`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#b8a5d4';
            ctx.fillText(zzz[i], x, y);
        }

        // Floating stars on the right
        for (let i = 0; i < 3; i++) {
            const x = GAME_WIDTH - 50 + Math.sin(this.floatPhase * 0.6 + i * 2) * 10;
            const y = 320 + i * 25 + Math.cos(this.floatPhase * 0.5 + i) * 10;
            ctx.globalAlpha = 0.15;
            ctx.font = `${14 - i * 2}px sans-serif`;
            ctx.fillStyle = '#FFD700';
            ctx.fillText('⭐', x, y);
        }
        ctx.globalAlpha = 1;
    }

    _roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    reset() {
        this.animTimer = 0;
        this.titleY = -50;
        this.subtitleAlpha = 0;
        this.buttonsAlpha = 0;
    }

    setCoins(coins) {
        this.coins = coins || 0;
    }
}

export class GameOverScreen {
    constructor() {
        this.animTimer = 0;
        this.score = 0;
        this.timeSurvived = 0;
        this.fliesNeutralized = 0;
        this.reason = '';
        this.isNewHighScore = false;
        this.buttons = [
            { id: 'retry', label: '🔄  PLAY AGAIN', x: GAME_WIDTH / 2, y: GAME_HEIGHT - 90, w: 220, h: 56, color: '#22D66F', textColor: '#0a2e14', glow: 'rgba(34, 214, 111, 0.4)' },
            { id: 'menu', label: '🏠  MAIN MENU', x: GAME_WIDTH / 2, y: GAME_HEIGHT - 32, w: 220, h: 48, color: 'rgba(255,255,255,0.15)', textColor: '#fff', glow: 'rgba(255,255,255,0.1)' },
        ];
        this.funMessage = '';
        this.coinsEarned = 0;
        this.totalCoins = 0;
    }

    show(score, timeSurvived, fliesNeutralized, reason, isHighScore, coinsEarned = 0, totalCoins = 0) {
        this.animTimer = 0;
        this.score = Math.round(score);
        this.timeSurvived = timeSurvived;
        this.fliesNeutralized = fliesNeutralized;
        this.reason = reason;
        this.isNewHighScore = isHighScore;

        const messages = [
            "At least I dreamed of giant cookies! 🍪",
            "That fly was a REAL party pooper! 🪰💩",
            "I'm still the cutest baby, right? 👶",
            "Time for a real nap now... 😴",
            "I'll get that fly in my next dream! 💪",
            "Who turned on the lights?! 💡",
            "Was that a fly or a tiny helicopter? 🚁",
            "Note to self: flies are annoying 📝",
            "My teddy bear would've protected me! 🧸",
            "Maybe I need a bug zapper... ⚡",
        ];
        this.funMessage = messages[Math.floor(Math.random() * messages.length)];
        this.coinsEarned = coinsEarned;
        this.totalCoins = totalCoins;
    }

    update(dt) {
        this.animTimer += dt;
    }

    handleTap(x, y) {
        if (this.animTimer < 1.0) return null;
        for (const btn of this.buttons) {
            if (x >= btn.x - btn.w / 2 && x <= btn.x + btn.w / 2 &&
                y >= btn.y - btn.h / 2 && y <= btn.y + btn.h / 2) {
                return btn.id;
            }
        }
        return null;
    }

    draw(ctx, renderer) {
        // Semi-transparent backdrop — let the crying baby show through
        const overlayAlpha = Math.min(0.65, this.animTimer * 1.5);
        ctx.fillStyle = `rgba(5, 5, 20, ${overlayAlpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (this.animTimer < 0.3) return;

        const headerProgress = Math.min(1, (this.animTimer - 0.3) * 3);
        ctx.globalAlpha = headerProgress;

        // ── Title ──
        renderer.drawText('Baby Woke Up!', GAME_WIDTH / 2, GAME_HEIGHT * 0.52, {
            font: '900 34px Nunito',
            color: '#FF6B6B',
            shadowColor: 'rgba(255, 107, 107, 0.5)',
            shadowBlur: 20,
        });

        // ── Reason — compact single line ──
        ctx.globalAlpha = Math.min(1, (this.animTimer - 0.6) * 2);
        renderer.drawText(this.reason, GAME_WIDTH / 2, GAME_HEIGHT * 0.57, {
            font: '700 13px Nunito',
            color: '#FFB020',
            maxWidth: GAME_WIDTH - 50,
        });

        // ── Stats Row — flies count inline ──
        ctx.globalAlpha = Math.min(1, (this.animTimer - 0.8) * 2);
        const statsY = GAME_HEIGHT * 0.63;

        renderer.drawText(`🪰 ${this.fliesNeutralized} flies dealt with`, GAME_WIDTH / 2, statsY, {
            font: '600 12px Nunito',
            color: 'rgba(255,255,255,0.6)',
        });

        // ── High score highlight ──
        if (this.isNewHighScore) {
            const blink = 0.5 + 0.5 * Math.sin(this.animTimer * 6);
            ctx.globalAlpha = blink;
            renderer.drawText('🎉 NEW HIGH SCORE! 🎉', GAME_WIDTH / 2, GAME_HEIGHT * 0.68, {
                font: '900 16px Nunito',
                color: '#FF4444',
                shadowColor: 'rgba(255, 68, 68, 0.5)',
                shadowBlur: 10,
            });
            ctx.globalAlpha = Math.min(1, (this.animTimer - 0.8) * 2);
        }

        // ── Fun Message — uses Outfit font, no italics ──
        ctx.globalAlpha = Math.min(1, (this.animTimer - 1.0) * 2);
        const msgY = GAME_HEIGHT * 0.73;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        const msgW = 270;
        this._roundRectPath(ctx, GAME_WIDTH / 2 - msgW / 2, msgY - 14, msgW, 28, 10);
        ctx.fill();

        renderer.drawText(`"${this.funMessage}"`, GAME_WIDTH / 2, msgY, {
            font: '600 12px Outfit, sans-serif',
            color: 'rgba(255, 230, 180, 0.7)',
            maxWidth: msgW - 20,
        });

        // ── Buttons ──
        ctx.globalAlpha = Math.min(1, (this.animTimer - 1.0) * 2);

        // ── Coins Earned ──
        if (this.coinsEarned > 0) {
            const coinY = GAME_HEIGHT * 0.78;

            // Coin badge background
            ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
            this._roundRectPath(ctx, GAME_WIDTH / 2 - 110, coinY - 16, 220, 32, 12);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
            ctx.lineWidth = 1;
            this._roundRectPath(ctx, GAME_WIDTH / 2 - 110, coinY - 16, 220, 32, 12);
            ctx.stroke();

            const coinBounce = 1 + Math.sin(this.animTimer * 3) * 0.03;
            ctx.save();
            ctx.translate(GAME_WIDTH / 2, coinY);
            ctx.scale(coinBounce, coinBounce);

            renderer.drawText(`🪙 +${this.coinsEarned} coins earned!`, 0, 0, {
                font: '800 15px Nunito',
                color: '#FFD700',
                shadowColor: 'rgba(255, 215, 0, 0.5)',
                shadowBlur: 10,
            });
            ctx.restore();

            // Total balance below
            renderer.drawText(`Total: ${this.totalCoins} coins`, GAME_WIDTH / 2, coinY + 22, {
                font: '600 11px Nunito',
                color: 'rgba(255, 215, 0, 0.5)',
                shadowBlur: 0,
                shadowOffY: 0,
            });
        }

        for (const btn of this.buttons) {
            this._drawButton(ctx, btn, renderer);
        }

        ctx.globalAlpha = 1;
    }

    _drawButton(ctx, btn, renderer) {
        const r = 14;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this._roundRectPath(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2 + 4, btn.w, btn.h, r);
        ctx.fill();

        // Glow
        ctx.shadowColor = btn.glow || 'transparent';
        ctx.shadowBlur = 12;

        // Body
        ctx.fillStyle = btn.color;
        this._roundRectPath(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, r);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Shine
        if (btn.color.startsWith('#')) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            this._roundRectPath(ctx, btn.x - btn.w / 2 + 2, btn.y - btn.h / 2 + 2, btn.w - 4, btn.h / 2 - 2, r - 2);
            ctx.fill();
        }

        renderer.drawText(btn.label, btn.x, btn.y, {
            font: `900 ${btn.h > 50 ? 19 : 15}px Nunito`,
            color: btn.textColor,
            shadowBlur: 0,
            shadowOffY: 0,
        });
    }

    _roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
}

export class LeaderboardScreen {
    constructor() {
        this.scores = [];
        this.animTimer = 0;
        this.backButton = { id: 'back', label: '← BACK', x: GAME_WIDTH / 2, y: GAME_HEIGHT - 55, w: 180, h: 48, color: 'rgba(255,255,255,0.15)', textColor: '#fff', glow: 'rgba(255,255,255,0.1)' };
    }

    show(scores) {
        this.scores = scores || [];
        this.animTimer = 0;
    }

    update(dt) {
        this.animTimer += dt;
    }

    handleTap(x, y) {
        const btn = this.backButton;
        if (x >= btn.x - btn.w / 2 && x <= btn.x + btn.w / 2 &&
            y >= btn.y - btn.h / 2 && y <= btn.y + btn.h / 2) {
            return 'back';
        }
        return null;
    }

    draw(ctx, renderer) {
        ctx.fillStyle = 'rgba(5, 5, 20, 0.94)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        renderer.drawText('🏆 Hall of Fame', GAME_WIDTH / 2, 55, {
            font: '900 32px Nunito',
            color: '#FFD700',
            shadowColor: 'rgba(255, 215, 0, 0.4)',
            shadowBlur: 15,
        });

        // Fun subtitle
        renderer.drawText('Your greatest baby-saving moments!', GAME_WIDTH / 2, 85, {
            font: '600 12px Nunito',
            color: 'rgba(255,255,255,0.4)',
        });

        if (this.scores.length === 0) {
            renderer.drawText('No scores yet!', GAME_WIDTH / 2, 200, {
                font: '700 18px Nunito',
                color: 'rgba(255,255,255,0.5)',
            });
            renderer.drawText('Play a game first! 🎮', GAME_WIDTH / 2, 230, {
                font: '600 14px Nunito',
                color: 'rgba(255,255,255,0.3)',
            });
            renderer.drawText('The baby is waiting... 👶', GAME_WIDTH / 2, 260, {
                font: '600 13px Outfit, sans-serif',
                color: 'rgba(255,255,255,0.2)',
            });
        } else {
            // Column headers
            const headerY = 118;
            ctx.font = '700 11px Nunito';
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText('#', 25, headerY);
            ctx.fillText('SCORE', 55, headerY);
            ctx.fillText('TIME', 160, headerY);
            ctx.fillText('FLIES', 240, headerY);
            ctx.fillText('DATE', 310, headerY);

            this.scores.forEach((entry, i) => {
                const y = 148 + i * 42;
                const entryAlpha = Math.min(1, (this.animTimer - i * 0.05) * 3);
                if (entryAlpha <= 0) return;

                ctx.globalAlpha = entryAlpha;

                // Row background
                if (i === 0) {
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
                } else if (i % 2 === 0) {
                    ctx.fillStyle = 'rgba(255,255,255,0.03)';
                } else {
                    ctx.fillStyle = 'rgba(0,0,0,0.15)';
                }
                this._roundRectPath(ctx, 18, y - 16, GAME_WIDTH - 36, 38, 8);
                ctx.fill();

                const medals = ['🥇', '🥈', '🥉'];
                const rankText = i < 3 ? medals[i] : `${i + 1}`;

                ctx.font = '700 14px Nunito';
                ctx.textAlign = 'left';
                ctx.fillStyle = i < 3 ? '#FFD700' : 'rgba(255,255,255,0.7)';
                ctx.fillText(rankText, 25, y + 3);

                ctx.font = '800 15px Nunito';
                ctx.fillStyle = i === 0 ? '#FFD700' : '#fff';
                ctx.fillText(entry.score.toLocaleString(), 55, y + 3);

                ctx.font = '600 13px Nunito';
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillText(formatTime(entry.time), 160, y + 3);
                ctx.fillText(entry.flies.toString(), 240, y + 3);

                const date = new Date(entry.date);
                ctx.fillText(`${date.getMonth() + 1}/${date.getDate()}`, 310, y + 3);
            });
            ctx.globalAlpha = 1;
        }

        // Back button
        this._drawButton(ctx, this.backButton, renderer);
    }

    _drawButton(ctx, btn, renderer) {
        const r = 12;

        ctx.shadowColor = btn.glow || 'transparent';
        ctx.shadowBlur = 10;

        ctx.fillStyle = btn.color;
        this._roundRectPath(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, r);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        this._roundRectPath(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, r);
        ctx.stroke();

        renderer.drawText(btn.label, btn.x, btn.y, {
            font: '800 15px Nunito',
            color: btn.textColor,
            shadowBlur: 0,
            shadowOffY: 0,
        });
    }

    _roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
}

export class SettingsScreen {
    constructor() {
        this.animTimer = 0;
        this.soundEnabled = true;
        this.hapticsEnabled = true;
        this.buttons = [];
        this._buildButtons();
    }

    show(settings) {
        this.soundEnabled = settings.soundEnabled;
        this.hapticsEnabled = settings.hapticsEnabled;
        this.animTimer = 0;
        this._buildButtons();
    }

    _buildButtons() {
        this.buttons = [
            { id: 'sound', label: `🔊 Sound: ${this.soundEnabled ? 'ON' : 'OFF'}`, x: GAME_WIDTH / 2, y: 210, w: 240, h: 52, color: this.soundEnabled ? 'rgba(34, 214, 111, 0.2)' : 'rgba(255,255,255,0.1)', textColor: '#fff', glow: this.soundEnabled ? 'rgba(34, 214, 111, 0.2)' : 'transparent' },
            { id: 'haptics', label: `📳 Haptics: ${this.hapticsEnabled ? 'ON' : 'OFF'}`, x: GAME_WIDTH / 2, y: 275, w: 240, h: 52, color: this.hapticsEnabled ? 'rgba(34, 214, 111, 0.2)' : 'rgba(255,255,255,0.1)', textColor: '#fff', glow: this.hapticsEnabled ? 'rgba(34, 214, 111, 0.2)' : 'transparent' },
            { id: 'export', label: '📤 Export Save Data', x: GAME_WIDTH / 2, y: 375, w: 240, h: 48, color: 'rgba(255,255,255,0.1)', textColor: '#fff', glow: 'transparent' },
            { id: 'import', label: '📥 Import Save Data', x: GAME_WIDTH / 2, y: 435, w: 240, h: 48, color: 'rgba(255,255,255,0.1)', textColor: '#fff', glow: 'transparent' },
            { id: 'back', label: '← BACK', x: GAME_WIDTH / 2, y: GAME_HEIGHT - 55, w: 180, h: 48, color: 'rgba(255,255,255,0.15)', textColor: '#fff', glow: 'rgba(255,255,255,0.1)' },
        ];
    }

    update(dt) {
        this.animTimer += dt;
    }

    handleTap(x, y) {
        for (const btn of this.buttons) {
            if (x >= btn.x - btn.w / 2 && x <= btn.x + btn.w / 2 &&
                y >= btn.y - btn.h / 2 && y <= btn.y + btn.h / 2) {
                return btn.id;
            }
        }
        return null;
    }

    draw(ctx, renderer) {
        ctx.fillStyle = 'rgba(5, 5, 20, 0.94)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        renderer.drawText('⚙️ Settings', GAME_WIDTH / 2, 55, {
            font: '900 32px Nunito',
            color: '#FFF5E0',
            shadowColor: 'rgba(255, 245, 224, 0.3)',
            shadowBlur: 15,
        });

        // Section headers
        renderer.drawText('🎮 Gameplay', GAME_WIDTH / 2, 165, {
            font: '700 14px Nunito',
            color: 'rgba(255, 230, 180, 0.6)',
        });

        renderer.drawText('💾 Data', GAME_WIDTH / 2, 340, {
            font: '700 14px Nunito',
            color: 'rgba(255, 230, 180, 0.6)',
        });

        // Fun settings message
        renderer.drawText('💡 Pro tip: Sound makes it 10x more fun!', GAME_WIDTH / 2, 510, {
            font: '600 12px Outfit, sans-serif',
            color: 'rgba(255, 255, 255, 0.3)',
        });

        for (const btn of this.buttons) {
            this._drawButton(ctx, btn, renderer);
        }
    }

    _drawButton(ctx, btn, renderer) {
        const r = 12;

        ctx.shadowColor = btn.glow || 'transparent';
        ctx.shadowBlur = 8;

        ctx.fillStyle = btn.color;
        this._roundRectPath(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, r);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        this._roundRectPath(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, r);
        ctx.stroke();

        renderer.drawText(btn.label, btn.x, btn.y, {
            font: '700 15px Nunito',
            color: btn.textColor,
            shadowBlur: 0,
            shadowOffY: 0,
        });
    }

    _roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
}
