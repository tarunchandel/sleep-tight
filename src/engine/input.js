/**
 * Input System - handles touch and mouse input with swipe/tap detection.
 */
export class InputSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.canvas = renderer.canvas;

        // Current touch state
        this.touches = new Map();
        this.taps = [];       // [{x, y, time}] - consumed each frame
        this.swipes = [];     // [{startX, startY, endX, endY, dx, dy, speed, time}]

        // Swipe detection thresholds
        this.SWIPE_MIN_DIST = 30;   // pixels in game coords
        this.SWIPE_MAX_TIME = 400;  // ms
        this.TAP_MAX_DIST = 15;     // pixels in game coords
        this.TAP_MAX_TIME = 300;    // ms

        this._bindEvents();
    }

    _bindEvents() {
        const c = this.canvas;
        // Touch events
        c.addEventListener('touchstart', e => this._onTouchStart(e), { passive: false });
        c.addEventListener('touchmove', e => this._onTouchMove(e), { passive: false });
        c.addEventListener('touchend', e => this._onTouchEnd(e), { passive: false });
        c.addEventListener('touchcancel', e => this._onTouchEnd(e), { passive: false });

        // Mouse fallback for desktop testing
        c.addEventListener('mousedown', e => this._onMouseDown(e));
        c.addEventListener('mousemove', e => this._onMouseMove(e));
        c.addEventListener('mouseup', e => this._onMouseUp(e));
    }

    _getGamePos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return this.renderer.screenToGame(clientX - rect.left, clientY - rect.top);
    }

    _onTouchStart(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            const pos = this._getGamePos(touch.clientX, touch.clientY);
            this.touches.set(touch.identifier, {
                startX: pos.x, startY: pos.y,
                currentX: pos.x, currentY: pos.y,
                startTime: performance.now()
            });
        }
    }

    _onTouchMove(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            const t = this.touches.get(touch.identifier);
            if (t) {
                const pos = this._getGamePos(touch.clientX, touch.clientY);
                t.currentX = pos.x;
                t.currentY = pos.y;
            }
        }
    }

    _onTouchEnd(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            const t = this.touches.get(touch.identifier);
            if (!t) continue;

            const pos = this._getGamePos(touch.clientX, touch.clientY);
            const elapsed = performance.now() - t.startTime;
            const dx = pos.x - t.startX;
            const dy = pos.y - t.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.TAP_MAX_DIST && elapsed < this.TAP_MAX_TIME) {
                // It's a tap
                this.taps.push({ x: pos.x, y: pos.y, time: performance.now() });
            } else if (distance >= this.SWIPE_MIN_DIST && elapsed < this.SWIPE_MAX_TIME) {
                // It's a swipe
                this.swipes.push({
                    startX: t.startX, startY: t.startY,
                    endX: pos.x, endY: pos.y,
                    dx, dy,
                    speed: distance / elapsed,
                    time: performance.now()
                });
            }

            this.touches.delete(touch.identifier);
        }
    }

    // Mouse fallback
    _mouseId = 'mouse';
    _onMouseDown(e) {
        const pos = this._getGamePos(e.clientX, e.clientY);
        this.touches.set(this._mouseId, {
            startX: pos.x, startY: pos.y,
            currentX: pos.x, currentY: pos.y,
            startTime: performance.now()
        });
    }

    _onMouseMove(e) {
        const t = this.touches.get(this._mouseId);
        if (t) {
            const pos = this._getGamePos(e.clientX, e.clientY);
            t.currentX = pos.x;
            t.currentY = pos.y;
        }
    }

    _onMouseUp(e) {
        const t = this.touches.get(this._mouseId);
        if (!t) return;

        const pos = this._getGamePos(e.clientX, e.clientY);
        const elapsed = performance.now() - t.startTime;
        const dx = pos.x - t.startX;
        const dy = pos.y - t.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.TAP_MAX_DIST && elapsed < this.TAP_MAX_TIME) {
            this.taps.push({ x: pos.x, y: pos.y, time: performance.now() });
        } else if (distance >= this.SWIPE_MIN_DIST && elapsed < this.SWIPE_MAX_TIME) {
            this.swipes.push({
                startX: t.startX, startY: t.startY,
                endX: pos.x, endY: pos.y,
                dx, dy,
                speed: distance / elapsed,
                time: performance.now()
            });
        }

        this.touches.delete(this._mouseId);
    }

    /** Consume all taps (call once per frame) */
    consumeTaps() {
        const t = [...this.taps];
        this.taps.length = 0;
        return t;
    }

    /** Consume all swipes (call once per frame) */
    consumeSwipes() {
        const s = [...this.swipes];
        this.swipes.length = 0;
        return s;
    }
}
