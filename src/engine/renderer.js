/**
 * Canvas Renderer - handles canvas sizing, scaling, and drawing primitives.
 * The game uses a fixed logical resolution and scales to fit the screen.
 */

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 720;

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize for non-transparent canvas
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Scale to fit while maintaining aspect ratio
        const scaleX = w / GAME_WIDTH;
        const scaleY = h / GAME_HEIGHT;
        this.scale = Math.min(scaleX, scaleY);

        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';

        // Center the game area
        this.offsetX = (w - GAME_WIDTH * this.scale) / 2;
        this.offsetY = (h - GAME_HEIGHT * this.scale) / 2;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    /** Begin a frame */
    begin() {
        const { ctx, canvas } = this;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fill letterbox with dark color
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply game transform
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(
            this.scale * dpr, 0,
            0, this.scale * dpr,
            this.offsetX * dpr,
            this.offsetY * dpr
        );
    }

    /** End a frame (noop, but good for future post-processing) */
    end() { }

    /** Convert screen coordinates to game coordinates */
    screenToGame(screenX, screenY) {
        const dpr = window.devicePixelRatio || 1;
        return {
            x: (screenX - this.offsetX) / this.scale,
            y: (screenY - this.offsetY) / this.scale
        };
    }

    /** Draw a rounded rectangle */
    roundRect(x, y, w, h, r) {
        const ctx = this.ctx;
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

    /** Draw text with shadow */
    drawText(text, x, y, {
        font = '700 24px Nunito',
        color = '#fff',
        align = 'center',
        baseline = 'middle',
        shadowColor = 'rgba(0,0,0,0.5)',
        shadowBlur = 4,
        shadowOffY = 2,
        maxWidth = undefined
    } = {}) {
        const ctx = this.ctx;
        ctx.font = font;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetY = shadowOffY;
        ctx.fillStyle = color;
        if (maxWidth) {
            ctx.fillText(text, x, y, maxWidth);
        } else {
            ctx.fillText(text, x, y);
        }
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
    }
}
