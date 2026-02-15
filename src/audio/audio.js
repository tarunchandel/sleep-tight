/**
 * Audio System - Web Audio API with spatial buzzing, baby noises, and SFX.
 * All sounds are procedurally generated (no external audio files needed).
 * Fixed: Buzzing properly stops on game over.
 */

export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = true;
        this.initialized = false;

        // Persistent nodes
        this.buzzOsc = null;
        this.buzzOsc2 = null;
        this.buzzGain = null;
        this.buzzGain2 = null;
        this.buzzPanner = null;
        this.buzzMod = null;
        this.ambientGain = null;
        this.ambientNoise = null;

        // Track active state
        this.isSilenced = false;
    }

    async init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.7;
            this.masterGain.connect(this.ctx.destination);

            this._setupBuzzing();
            this._setupAmbient();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio init failed:', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    _setupBuzzing() {
        const ctx = this.ctx;

        this.buzzOsc = ctx.createOscillator();
        this.buzzOsc.type = 'sawtooth';
        this.buzzOsc.frequency.value = 220;

        this.buzzOsc2 = ctx.createOscillator();
        this.buzzOsc2.type = 'square';
        this.buzzOsc2.frequency.value = 440;

        this.buzzMod = ctx.createOscillator();
        this.buzzMod.type = 'sine';
        this.buzzMod.frequency.value = 80;

        const buzzModGain = ctx.createGain();
        buzzModGain.gain.value = 100;
        this.buzzMod.connect(buzzModGain);
        buzzModGain.connect(this.buzzOsc.frequency);

        this.buzzGain = ctx.createGain();
        this.buzzGain.gain.value = 0;

        this.buzzGain2 = ctx.createGain();
        this.buzzGain2.gain.value = 0;

        this.buzzPanner = ctx.createStereoPanner();
        this.buzzPanner.pan.value = 0;

        this.buzzOsc.connect(this.buzzGain);
        this.buzzOsc2.connect(this.buzzGain2);
        this.buzzGain2.connect(this.buzzGain);
        this.buzzGain.connect(this.buzzPanner);
        this.buzzPanner.connect(this.masterGain);

        this.buzzOsc.start();
        this.buzzOsc2.start();
        this.buzzMod.start();
    }

    _setupAmbient() {
        const ctx = this.ctx;

        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.02;
        }

        this.ambientNoise = ctx.createBufferSource();
        this.ambientNoise.buffer = noiseBuffer;
        this.ambientNoise.loop = true;

        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = 'lowpass';
        lpFilter.frequency.value = 400;

        this.ambientGain = ctx.createGain();
        this.ambientGain.gain.value = 0.3;

        this.ambientNoise.connect(lpFilter);
        lpFilter.connect(this.ambientGain);
        this.ambientGain.connect(this.masterGain);
        this.ambientNoise.start();
    }

    /** Update spatial buzzing based on fly positions */
    updateBuzzing(flies, gameWidth) {
        if (!this.initialized || !this.enabled || this.isSilenced) return;

        let maxVolume = 0;
        let panSum = 0;
        let panCount = 0;
        let maxFreqShift = 0;

        for (const fly of flies) {
            if (fly.state === 'dead') continue;
            const proximity = fly.getProximity({ x: gameWidth / 2, y: 360 });
            const vol = proximity * 0.18; // Slightly louder buzzing
            if (vol > maxVolume) maxVolume = vol;

            const pan = (fly.x / gameWidth) * 2 - 1;
            panSum += pan;
            panCount++;

            if (fly.state === 'approaching' || fly.state === 'landing' || fly.state === 'circling') {
                maxFreqShift = Math.max(maxFreqShift, 80);
            }
        }

        const now = this.ctx.currentTime;
        this.buzzGain.gain.linearRampToValueAtTime(maxVolume, now + 0.05);
        if (this.buzzGain2) {
            this.buzzGain2.gain.linearRampToValueAtTime(maxVolume * 0.3, now + 0.05);
        }
        this.buzzPanner.pan.linearRampToValueAtTime(
            panCount > 0 ? panSum / panCount : 0, now + 0.05
        );
        this.buzzOsc.frequency.linearRampToValueAtTime(220 + maxFreqShift, now + 0.1);
    }

    /** Play a whoosh sound (shoo) */
    playWhoosh() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

        const noise = this._createNoiseBuffer(0.15);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.connect(noiseGain);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        noiseGain.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
        noise.start(now);
        noise.stop(now + 0.15);
    }

    /** Play squish sound (successful squash) */
    playSquish() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        const noise = this._createNoiseBuffer(0.08);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        noise.connect(noiseGain);
        noiseGain.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.15);
        noise.start(now);
        noise.stop(now + 0.08);
    }

    /** Play a heavy thump sound (tapping noise that disturbs baby) */
    playThump() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    /** Play a "smack" noise when tapping to kill a fly (whether hit or miss) */
    playTapSmack() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Short percussive impact
        const noise = this._createNoiseBuffer(0.06);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.25, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        noise.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        osc.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.06);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    /** Play baby cry sound */
    playCry() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        for (let i = 0; i < 4; i++) {
            const t = now + i * 0.4;
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500 + i * 20, t);
            osc.frequency.linearRampToValueAtTime(680, t + 0.15);
            osc.frequency.linearRampToValueAtTime(430, t + 0.35);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
            gain.gain.linearRampToValueAtTime(0.14, t + 0.25);
            gain.gain.linearRampToValueAtTime(0, t + 0.38);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.4);
        }
    }

    /** Play heartbeat for critical sleep meter */
    playHeartbeat() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 60;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    /** Play baby giggle sound - sweeter and more musical */
    playGiggle() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        for (let i = 0; i < 5; i++) {
            const t = now + i * 0.12;
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(750 + i * 60, t);
            osc.frequency.exponentialRampToValueAtTime(550, t + 0.08);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.12);
        }
    }

    /** Play baby sigh/coo - softer and warmer */
    playSigh() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(280, now + 1.2);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.3);
        gain.gain.linearRampToValueAtTime(0, now + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 1.2);
    }

    /** Play baby yawn */
    playYawn() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.3);
        osc.frequency.linearRampToValueAtTime(250, now + 1.0);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.2);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.6);
        gain.gain.linearRampToValueAtTime(0, now + 1.0);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 1.0);
    }

    /** Play baby murmur/babble */
    playMurmur() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Short babbling sounds
        for (let i = 0; i < 3; i++) {
            const t = now + i * 0.2;
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            const freq = 300 + Math.random() * 200;
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.linearRampToValueAtTime(freq * 0.8, t + 0.15);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.04, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.18);
        }
    }

    /** Play baby snore - soft rhythmic sound */
    playSnore() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const noise = this._createNoiseBuffer(0.6);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.03, now + 0.15);
        noiseGain.gain.linearRampToValueAtTime(0.015, now + 0.3);
        noiseGain.gain.linearRampToValueAtTime(0.025, now + 0.45);
        noiseGain.gain.linearRampToValueAtTime(0, now + 0.6);

        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = 'lowpass';
        lpFilter.frequency.value = 200;

        noise.connect(lpFilter);
        lpFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.6);
    }

    /** Play baby whimper (when sleep is low) */
    playWhimper() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(380, now + 0.3);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.03, now + 0.2);
        gain.gain.linearRampToValueAtTime(0, now + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    /** Play a gentle chime sound for UI */
    playChime() {
        if (!this.initialized || !this.enabled) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
            const t = now + i * 0.08;
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.5);
        });
    }

    _createNoiseBuffer(duration) {
        const ctx = this.ctx;
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        return source;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (this.masterGain) {
            this.masterGain.gain.value = enabled ? 0.7 : 0;
        }
    }

    /** Silence buzzing (game over) */
    silence() {
        this.isSilenced = true;
        if (!this.initialized) return;
        const now = this.ctx.currentTime;

        // Immediately kill buzz
        if (this.buzzGain) {
            this.buzzGain.gain.cancelScheduledValues(now);
            this.buzzGain.gain.setValueAtTime(0, now);
        }
        if (this.buzzGain2) {
            this.buzzGain2.gain.cancelScheduledValues(now);
            this.buzzGain2.gain.setValueAtTime(0, now);
        }
    }

    /** Fully stop all buzzing (called on game over to ensure no residual sound) */
    stopBuzzing() {
        this.isSilenced = true;
        if (!this.initialized) return;
        const now = this.ctx.currentTime;

        if (this.buzzGain) {
            this.buzzGain.gain.cancelScheduledValues(now);
            this.buzzGain.gain.setValueAtTime(0, now);
        }
        if (this.buzzGain2) {
            this.buzzGain2.gain.cancelScheduledValues(now);
            this.buzzGain2.gain.setValueAtTime(0, now);
        }
        if (this.buzzOsc) {
            this.buzzOsc.frequency.cancelScheduledValues(now);
            this.buzzOsc.frequency.setValueAtTime(0, now);
        }
        if (this.buzzOsc2) {
            this.buzzOsc2.frequency.cancelScheduledValues(now);
            this.buzzOsc2.frequency.setValueAtTime(0, now);
        }
        if (this.buzzMod) {
            this.buzzMod.frequency.cancelScheduledValues(now);
            this.buzzMod.frequency.setValueAtTime(0, now);
        }
    }

    /** Resume buzzing after restart */
    resumeBuzzing() {
        this.isSilenced = false;
        if (!this.initialized) return;
        const now = this.ctx.currentTime;

        if (this.buzzOsc) {
            this.buzzOsc.frequency.setValueAtTime(220, now);
        }
        if (this.buzzOsc2) {
            this.buzzOsc2.frequency.setValueAtTime(440, now);
        }
        if (this.buzzMod) {
            this.buzzMod.frequency.setValueAtTime(80, now);
        }
    }
}
