/**
 * Shop Screen - A beautiful, premium shop UI for purchasing goodies.
 * Shows coin balance, item catalog with purchase/equip controls.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../engine/renderer.js';
import { SHOP_ITEMS } from '../data/shop.js';
import { clamp } from '../engine/utils.js';

export class ShopScreen {
    constructor() {
        this.animTimer = 0;
        this.coins = 0;
        this.purchasedItems = [];
        this.itemLevels = {}; // itemId -> level
        this.equippedItems = [];
        this.scrollY = 0;
        this.targetScrollY = 0;
        this.coinPulse = 0;
        this.floatPhase = 0;

        this.buttons = [];
        this.backButton = {
            id: 'back', label: '← BACK',
            x: GAME_WIDTH / 2, y: GAME_HEIGHT - 45,
            w: 180, h: 48,
            color: 'rgba(255,255,255,0.15)', textColor: '#fff',
            glow: 'rgba(255,255,255,0.1)'
        };
    }

    show(coins, purchasedItems, itemLevels, equippedItems) {
        this.coins = coins;
        this.purchasedItems = purchasedItems || [];
        this.itemLevels = itemLevels || {};
        this.equippedItems = equippedItems || [];
        this.animTimer = 0;
        this.scrollY = 0;
        this.targetScrollY = 0;
        this._buildItemButtons();
    }

    _buildItemButtons() {
        this.buttons = [];
        const startY = 145;
        const itemH = 88;

        for (let i = 0; i < SHOP_ITEMS.length; i++) {
            const item = SHOP_ITEMS[i];
            const y = startY + i * (itemH + 10);
            const isPurchased = this.purchasedItems.includes(item.id);
            const isEquipped = this.equippedItems.includes(item.id);
            const level = this.itemLevels[item.id] || (isPurchased ? 1 : 0);

            let btnLabel, btnColor, btnGlow, btnId, btnActive = true;

            if (isPurchased) {
                if (level < item.maxLevel) {
                    const upgradePrice = item.upgradePrices[level - 1];
                    const canAfford = this.coins >= upgradePrice;
                    btnLabel = `🆙 ${upgradePrice}`;
                    btnColor = canAfford ? '#44AAFF' : 'rgba(100,100,255,0.2)';
                    btnGlow = canAfford ? 'rgba(68, 170, 255, 0.4)' : 'transparent';
                    btnId = `upgrade_${item.id}`;
                } else {
                    btnLabel = 'MAX LVL';
                    btnColor = 'rgba(255, 215, 0, 0.15)';
                    btnGlow = 'transparent';
                    btnId = `max_${item.id}`;
                    btnActive = false;
                }
            } else {
                const canAfford = this.coins >= item.price;
                btnLabel = `🪙 ${item.price}`;
                btnColor = canAfford ? item.color : 'rgba(100,100,100,0.3)';
                btnGlow = canAfford ? item.glow : 'transparent';
                btnId = `buy_${item.id}`;
            }

            this.buttons.push({
                id: btnId,
                itemId: item.id,
                label: btnLabel,
                x: GAME_WIDTH - 70,
                y: y + 44,
                w: 100,
                h: 34,
                color: btnColor,
                textColor: (isPurchased && level >= item.maxLevel) ? 'rgba(255,255,255,0.5)' : '#fff',
                glow: btnGlow,
                isPurchased,
                isEquipped,
                isActive: btnActive,
                level
            });
        }
    }

    update(dt) {
        this.animTimer += dt;
        this.floatPhase += dt;
        this.coinPulse = Math.max(0, this.coinPulse - dt * 3);

        // Smooth scroll
        this.scrollY += (this.targetScrollY - this.scrollY) * dt * 8;
    }

    handleTap(x, y) {
        // Check back button
        const btn = this.backButton;
        if (x >= btn.x - btn.w / 2 && x <= btn.x + btn.w / 2 &&
            y >= btn.y - btn.h / 2 && y <= btn.y + btn.h / 2) {
            return 'back';
        }

        // Check item buttons (adjusted for scroll)
        for (const b of this.buttons) {
            const by = b.y - this.scrollY;
            if (x >= b.x - b.w / 2 - 10 && x <= b.x + b.w / 2 + 10 &&
                by >= 100 && by <= GAME_HEIGHT - 70 &&
                y >= by - b.h / 2 - 15 && y <= by + b.h / 2 + 15) {
                return b.id;
            }

            // Check for toggle (the card itself or icon area)
            const cardX = 12;
            const cardW = GAME_WIDTH - 24;
            const itemY = by - 44; // Start of card
            if (x >= cardX && x <= cardX + cardW - 125 && // Left side of card, well away from button
                by >= 100 && by <= GAME_HEIGHT - 70 &&
                y >= itemY && y <= itemY + 85) {
                return `toggle_${b.itemId}`;
            }
        }

        return null;
    }

    handleSwipe(dy) {
        const maxItems = SHOP_ITEMS.length;
        const contentH = 145 + maxItems * 98;
        const maxScroll = Math.max(0, contentH - GAME_HEIGHT + 100);
        this.targetScrollY = clamp(this.targetScrollY + dy * 0.5, 0, maxScroll);
    }

    draw(ctx, renderer) {
        // Background
        ctx.fillStyle = 'rgba(5, 5, 20, 0.96)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Background decoration - floating coins
        this._drawDecorations(ctx);

        // Header
        const headerAlpha = Math.min(1, this.animTimer * 3);
        ctx.globalAlpha = headerAlpha;

        renderer.drawText('🛒 Shop', GAME_WIDTH / 2, 42, {
            font: '900 32px Nunito',
            color: '#FFD700',
            shadowColor: 'rgba(255, 215, 0, 0.4)',
            shadowBlur: 15,
        });

        // Coin balance - prominent display
        this._drawCoinBalance(ctx, renderer);

        // Subtitle
        renderer.drawText('Survive longer = more coins! 🪙', GAME_WIDTH / 2, 115, {
            font: '600 11px Nunito',
            color: 'rgba(255,255,255,0.4)',
        });

        // Items - scrollable area
        ctx.save();
        // Clip to content area
        ctx.beginPath();
        ctx.rect(0, 130, GAME_WIDTH, GAME_HEIGHT - 220);
        ctx.clip();

        for (let i = 0; i < SHOP_ITEMS.length; i++) {
            const item = SHOP_ITEMS[i];
            const itemAlpha = Math.min(1, (this.animTimer - i * 0.08) * 3);
            if (itemAlpha <= 0) continue;

            const y = 145 + i * 98 - this.scrollY;
            if (y < 90 || y > GAME_HEIGHT - 60) continue;

            ctx.globalAlpha = itemAlpha;
            this._drawItemCard(ctx, renderer, item, y, i);
        }

        ctx.restore();

        // Scroll indicator
        const maxItems = SHOP_ITEMS.length;
        const contentH = 145 + maxItems * 98;
        if (contentH > GAME_HEIGHT - 100) {
            const scrollPercent = this.scrollY / Math.max(1, contentH - GAME_HEIGHT + 100);
            const indicatorH = 40;
            const indicatorY = 140 + (GAME_HEIGHT - 240 - indicatorH) * scrollPercent;
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            this._roundRectPath(ctx, GAME_WIDTH - 6, indicatorY, 3, indicatorH, 2);
            ctx.fill();
        }

        // Back button
        ctx.globalAlpha = Math.min(1, (this.animTimer - 0.3) * 2);
        this._drawButton(ctx, this.backButton, renderer);
        ctx.globalAlpha = 1;
    }

    _drawCoinBalance(ctx, renderer) {
        const balY = 78;
        const scale = 1 + this.coinPulse * 0.15;

        ctx.save();
        ctx.translate(GAME_WIDTH / 2, balY);
        ctx.scale(scale, scale);

        // Background pill
        ctx.fillStyle = 'rgba(255, 215, 0, 0.12)';
        this._roundRectPath(ctx, -70, -16, 140, 32, 16);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.lineWidth = 1;
        this._roundRectPath(ctx, -70, -16, 140, 32, 16);
        ctx.stroke();

        renderer.drawText(`🪙 ${this.coins.toLocaleString()}`, 0, 0, {
            font: '900 20px Nunito',
            color: '#FFD700',
            shadowColor: 'rgba(255, 215, 0, 0.5)',
            shadowBlur: 12,
        });

        ctx.restore();
    }

    _drawItemCard(ctx, renderer, item, y, index) {
        const cardX = 12;
        const cardW = GAME_WIDTH - 24;
        const cardH = 85;
        const isPurchased = this.purchasedItems.includes(item.id);
        const isEquipped = this.equippedItems.includes(item.id);
        const canAfford = this.coins >= item.price;
        const level = this.itemLevels[item.id] || (isPurchased ? 1 : 0);

        // Card background
        if (isEquipped) {
            ctx.fillStyle = 'rgba(34, 214, 111, 0.08)';
        } else if (isPurchased) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        }
        this._roundRectPath(ctx, cardX, y, cardW, cardH, 14);
        ctx.fill();

        // Card border
        if (isEquipped) {
            ctx.strokeStyle = 'rgba(34, 214, 111, 0.3)';
        } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        }
        ctx.lineWidth = 1;
        this._roundRectPath(ctx, cardX, y, cardW, cardH, 14);
        ctx.stroke();

        // Item emoji - large, with glow
        const emojiX = 48;
        const emojiY = y + cardH / 2;

        // Emoji glow
        const emojiGlow = ctx.createRadialGradient(emojiX, emojiY, 0, emojiX, emojiY, 24);
        emojiGlow.addColorStop(0, item.glow.replace('0.4', '0.15'));
        emojiGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = emojiGlow;
        ctx.fillRect(emojiX - 24, emojiY - 24, 48, 48);

        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.emoji, emojiX, emojiY);

        // Item name
        renderer.drawText(item.name, 140, y + 22, {
            font: '800 15px Nunito',
            color: isPurchased ? '#fff' : (canAfford ? '#fff' : '#888'),
            align: 'left',
            shadowBlur: 0,
            shadowOffY: 0,
        });

        // Item description
        renderer.drawText(item.description, 140, y + 42, {
            font: '600 11px Nunito',
            color: isPurchased ? 'rgba(255,255,255,0.55)' : (canAfford ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.3)'),
            align: 'left',
            shadowBlur: 0,
            shadowOffY: 0,
        });

        // Level badge
        if (isPurchased) {
            renderer.drawText(`LEVEL ${level}/${item.maxLevel}`, 140, y + 62, {
                font: '900 10px Nunito',
                color: level >= item.maxLevel ? '#FFD700' : '#44AAFF',
                align: 'left',
                shadowBlur: 0,
                shadowOffY: 0,
            });

            // Equipped toggle (small checkbox next to icon or similar)
            if (isEquipped) {
                renderer.drawText('✅ ACTIVE', cardX + cardW - 110, y + 18, {
                    font: '700 9px Nunito',
                    color: '#22D66F',
                    align: 'right',
                });
            }
        } else {
            // Removed redundant text price tag (it's already on the button)
            // Just draw 'TAP TO BUY' or nothing to keep it clean
            renderer.drawText(`+${item.description.split(' ')[0]} POWER`, 140, y + 62, {
                font: '700 10px Nunito',
                color: 'rgba(255,255,255,0.3)',
                align: 'left',
                shadowBlur: 0,
                shadowOffY: 0,
            });
        }

        // Action button (buy/equip/toggle)
        const btn = this.buttons[index];
        if (btn) {
            const btnY = btn.y - this.scrollY;
            this._drawSmallButton(ctx, { ...btn, y: btnY }, renderer);
        }
    }

    _drawSmallButton(ctx, btn, renderer) {
        const r = 10;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this._roundRectPath(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2 + 2, btn.w, btn.h, r);
        ctx.fill();

        // Glow
        ctx.shadowColor = btn.glow || 'transparent';
        ctx.shadowBlur = 8;

        // Body
        ctx.fillStyle = btn.color;
        this._roundRectPath(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, r);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Text
        renderer.drawText(btn.label, btn.x, btn.y, {
            font: '700 12px Nunito',
            color: btn.textColor,
            shadowBlur: 0,
            shadowOffY: 0,
        });
    }

    _drawDecorations(ctx) {
        // Floating coin sparkles
        for (let i = 0; i < 5; i++) {
            const x = 30 + i * 85 + Math.sin(this.floatPhase * 0.5 + i * 2) * 10;
            const y = 100 + i * 120 + Math.cos(this.floatPhase * 0.3 + i) * 15;
            ctx.globalAlpha = 0.04 + 0.02 * Math.sin(this.floatPhase + i);
            ctx.font = `${14 + i * 2}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🪙', x, y);
        }
        ctx.globalAlpha = 1;
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
