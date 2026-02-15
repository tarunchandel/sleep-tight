/**
 * Main Game - the core game loop, state machine, and glue logic.
 * States: loading → menu → tutorial → playing → gameover
 *         menu → leaderboard (sub-screen)
 *         menu → settings (sub-screen)
 * 
 * v2.0 - "The Fly Hunter Update"
 * - Flies are much harder to kill (85%+ dodge chance)
 * - Buzzing near baby drains sleep meter
 * - Tapping makes noise that disturbs baby
 * - More baby sounds and expressions
 * - Fun messages everywhere!
 */
import { Renderer, GAME_WIDTH, GAME_HEIGHT } from './engine/renderer.js';
import { InputSystem } from './engine/input.js';
import { ParticleSystem } from './engine/particles.js';
import { clamp, dist, randFloat } from './engine/utils.js';

import { Nursery } from './entities/nursery.js';
import { Baby } from './entities/baby.js';
import { Fly } from './entities/fly.js';

import { AudioSystem } from './audio/audio.js';
import { SaveSystem } from './data/save.js';

import { HUD } from './ui/hud.js';
import { MenuScreen, GameOverScreen, LeaderboardScreen, SettingsScreen } from './ui/screens.js';

class Game {
  constructor() {
    // Core systems
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new InputSystem(this.renderer);
    this.particles = new ParticleSystem();
    this.audio = new AudioSystem();
    this.save = new SaveSystem();

    // Entities
    this.nursery = new Nursery();
    this.baby = null;
    this.flies = [];

    // UI
    this.hud = new HUD();
    this.menuScreen = new MenuScreen();
    this.gameOverScreen = new GameOverScreen();
    this.leaderboardScreen = new LeaderboardScreen();
    this.settingsScreen = new SettingsScreen();

    // Game state
    this.state = 'loading';
    this.prevState = null;

    // Gameplay variables
    this.sleepMeter = 100;
    this.score = 0;
    this.timeSurvived = 0;
    this.fliesNeutralized = 0;
    this.gameOverReason = '';

    // Fly spawning
    this.flySpawnTimer = 0;
    this.flySpawnInterval = 5;
    this.maxFlies = 6;

    // Heartbeat timer for critical state
    this.heartbeatTimer = 0;

    // Fun messages - way more of them!
    this.funMessages = [
      "Wait, did I leave the oven on? 🤔",
      "I wonder what clouds taste like... ☁️",
      "Is it morning yet?! 🌅",
      "Giant cookie dream incoming! 🍪",
      "If I were a fly, I'd be a nice one 🪰",
      "Buzz off, Mr. Fly! 😤",
      "Peace and quiet... mostly 😌",
      "Zzz... oh, a cookie! ...Zzz 💤",
      "Whoosh! Missed me! 💨",
      "Is that a mosquito or a tiny airplane? ✈️",
      "Safety first! Don't tap me! ⚠️",
      "Why are flies so annoying?! 🙄",
      "My teddy bear would handle this 🧸",
      "Just five more minutes, please! ⏰",
      "Is this a dream or a nightmare? 🤷",
      "That fly has been watching me! 👀",
      "I need a vacation from flies 🏖️",
      "Someone call pest control! 📞",
      "Dreams of a fly-free world 🌈",
      "The fly is plotting something... 🤔",
    ];

    // Haptics
    this.hapticsEnabled = this.save.getSettings().hapticsEnabled;

    // Swipe trail visual
    this.swipeTrails = [];

    // Fun message timer
    this.funMessageTimer = 0;

    // Baby noise timer
    this.babyNoiseTimer = 0;

    // Frame timing
    this.lastTime = 0;
    this.fpsCounter = 0;
    this.fpsTimer = 0;
    this.fps = 60;

    // Start loading
    this._startLoading();
  }

  async _startLoading() {
    const bar = document.getElementById('loading-bar');

    bar.style.width = '30%';
    await this._delay(300);

    const settings = this.save.getSettings();
    this.audio.setEnabled(settings.soundEnabled);

    bar.style.width = '60%';
    await this._delay(300);

    bar.style.width = '100%';
    await this._delay(400);

    document.getElementById('loading-screen').classList.add('fade-out');
    await this._delay(500);
    document.getElementById('loading-screen').style.display = 'none';

    this.state = 'menu';
    this.menuScreen.reset();

    this.lastTime = performance.now();
    requestAnimationFrame(t => this._loop(t));
  }

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  _loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.fpsCounter++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsTimer = 0;
    }

    this._update(dt);
    this._draw();

    requestAnimationFrame(t => this._loop(t));
  }

  _update(dt) {
    this.nursery.update(dt, this.timeSurvived);

    switch (this.state) {
      case 'menu':
        this._updateMenu(dt);
        break;
      case 'tutorial':
        this._updateTutorial(dt);
        break;
      case 'playing':
        this._updatePlaying(dt);
        break;
      case 'gameover':
        this._updateGameOver(dt);
        break;
      case 'leaderboard':
        this._updateLeaderboard(dt);
        break;
      case 'settings':
        this._updateSettings(dt);
        break;
    }

    this.particles.update(dt);

    this.swipeTrails = this.swipeTrails.filter(t => {
      t.timer += dt;
      return t.timer < 0.3;
    });
  }

  _updateMenu(dt) {
    this.menuScreen.update(dt);

    const taps = this.input.consumeTaps();
    this.input.consumeSwipes();

    for (const tap of taps) {
      this.audio.init();
      this.audio.resume();

      const action = this.menuScreen.handleTap(tap.x, tap.y);
      if (action === 'play') {
        this.audio.playChime();
        this._startGame();
      } else if (action === 'leaderboard') {
        this.audio.playChime();
        this.state = 'leaderboard';
        this.leaderboardScreen.show(this.save.getScores());
      } else if (action === 'settings') {
        this.audio.playChime();
        this.state = 'settings';
        this.settingsScreen.show(this.save.getSettings());
      }
    }
  }

  _startGame() {
    this.state = 'tutorial';
    this.baby = new Baby();
    this.flies = [];
    this.sleepMeter = 100;
    this.score = 0;
    this.timeSurvived = 0;
    this.fliesNeutralized = 0;
    this.flySpawnTimer = 0;
    this.flySpawnInterval = 5;
    this.gameOverReason = '';
    this.heartbeatTimer = 0;
    this.particles.clear();
    this.swipeTrails = [];
    this.babyNoiseTimer = 0;

    this.hud.showTutorial = true;
    this.hud.tutorialTimer = 0;
    this.hud.combo = 0;
    this.hud.comboTimer = 0;
    this.funMessageTimer = 2.0;

    // Resume buzzing audio if it was silenced
    this.audio.resumeBuzzing();

    // Spawn first fly
    this._spawnFly();
  }

  _updateTutorial(dt) {
    this.hud.update(dt, this.sleepMeter, this.score, this.timeSurvived, this.fliesNeutralized);

    for (const fly of this.flies) {
      fly.wingPhase += dt * 40;
    }

    const taps = this.input.consumeTaps();
    this.input.consumeSwipes();

    if (taps.length > 0 && this.hud.tutorialTimer > 0.5) {
      this.hud.showTutorial = false;
      this.state = 'playing';
    }
  }

  _updatePlaying(dt) {
    this.timeSurvived += dt;
    this.babyNoiseTimer += dt;

    // === SLEEP METER LOGIC ===
    let meterDelta = 1.5 * dt; // Slower passive recovery (was 2)

    // Proximity drain from flies (buzzing disturbs baby!)
    let anyFlyBuzzing = false;
    for (const fly of this.flies) {
      if (fly.state === 'dead') continue;

      const proximity = fly.getProximity(this.baby.getFaceCenter());

      // Buzzing drain - flies near baby = sleep goes down!
      if (proximity > 0.2) {
        anyFlyBuzzing = true;
        const drainRate = Math.pow(proximity, 1.8) * 12;
        meterDelta -= drainRate * dt;
      }

      // Extra drain when circling (the anticipation!)
      if (fly.state === 'circling' && proximity > 0.3) {
        meterDelta -= 5 * dt;
      }

      // Landing penalty: massive drain
      if (fly.isOnBaby(this.baby.getFaceCenter())) {
        meterDelta -= 45 * dt;

        if (fly.landingTimer > 0.7) {
          this._triggerGameOver("A fly sat on the baby's face too long! 🪰😱");
          return;
        }

        this.baby.stir();
      }
    }

    this.sleepMeter = clamp(this.sleepMeter + meterDelta, 0, 100);

    if (this.sleepMeter <= 0) {
      this._triggerGameOver('Too much buzzing woke the baby up! 🪰😭');
      return;
    }

    // Score: time-based
    this.score += dt * 10;

    // === FLY SPAWNING ===
    this.flySpawnTimer += dt;
    this.flySpawnInterval = Math.max(1.5, 5 - this.timeSurvived / 45);
    const currentMaxFlies = Math.min(this.maxFlies, 1 + Math.floor(this.timeSurvived / 25));

    if (this.flySpawnTimer >= this.flySpawnInterval && this.flies.filter(f => f.state !== 'dead').length < currentMaxFlies) {
      this._spawnFly();
      this.flySpawnTimer = 0;
    }

    // === UPDATE ENTITIES ===
    const babyInfo = this.baby.getFaceCenter();

    for (const fly of this.flies) {
      fly.update(dt, babyInfo, this.timeSurvived);
    }

    this.flies = this.flies.filter(f => !f.isDead());

    this.baby.update(dt, this.sleepMeter);

    // === INPUT HANDLING ===
    const taps = this.input.consumeTaps();
    const swipes = this.input.consumeSwipes();

    for (const swipe of swipes) {
      this._handleShoo(swipe);
    }

    for (const tap of taps) {
      this._handleSquash(tap);
    }

    // === AUDIO ===
    this.audio.updateBuzzing(this.flies, GAME_WIDTH);

    // More varied baby noises! 
    if (this.baby && this.baby.state === 'sleeping') {
      if (this.sleepMeter > 70) {
        // Happy sleeping sounds
        if (Math.random() < dt * 0.04) {
          this.audio.playSigh();
        }
        if (Math.random() < dt * 0.015) {
          this.audio.playGiggle();
        }
        if (Math.random() < dt * 0.02) {
          this.audio.playSnore();
        }
        if (Math.random() < dt * 0.01) {
          this.audio.playMurmur();
        }
      } else if (this.sleepMeter > 40) {
        // Restless sounds
        if (Math.random() < dt * 0.03) {
          this.audio.playMurmur();
        }
        if (Math.random() < dt * 0.02) {
          this.audio.playYawn();
        }
      } else {
        // Distressed sounds
        if (Math.random() < dt * 0.04) {
          this.audio.playWhimper();
        }
      }
    }

    // Heartbeat for critical state
    if (this.sleepMeter < 20) {
      this.heartbeatTimer += dt;
      if (this.heartbeatTimer >= 0.8) {
        this.heartbeatTimer = 0;
        this.audio.playHeartbeat();
        if (this.hapticsEnabled && navigator.vibrate) {
          navigator.vibrate([50, 50, 80]);
        }
      }
    }

    // === HUD ===
    this.hud.update(dt, this.sleepMeter, this.score, this.timeSurvived, this.fliesNeutralized);

    // === FUN MESSAGES ===
    this.funMessageTimer -= dt;
    if (this.funMessageTimer < 0 && this.funMessages && this.funMessages.length > 0) {
      const msg = this.funMessages[Math.floor(Math.random() * this.funMessages.length)];
      this.hud.setFunMessage(msg);
      this.funMessageTimer = 8 + Math.random() * 10; // More frequent: 8-18 seconds
    }

    // === AMBIENT PARTICLES ===
    if (Math.random() < dt * 2) {
      this.particles.emitDust(GAME_WIDTH, GAME_HEIGHT);
    }

    // === SLEEP ZZZs ===
    if (this.baby && (this.baby.state === 'sleeping' || this.baby.state === 'stirring')) {
      const sleepDepth = this.sleepMeter / 100;
      if (Math.random() < dt * 0.8 * sleepDepth) {
        const face = this.baby.getFaceCenter();
        this.particles.emitZzz(face.x + 15, face.y + 5);
      }
    }
  }

  _handleShoo(swipe) {
    const hitRadius = 50;
    let hitAny = false;

    for (const fly of this.flies) {
      if (fly.state === 'dead' || fly.state === 'shooed') continue;

      const flyDist = this._pointToLineDist(
        fly.x, fly.y,
        swipe.startX, swipe.startY,
        swipe.endX, swipe.endY
      );

      if (flyDist < hitRadius) {
        fly.shoo(swipe.dx, swipe.dy, 250 + swipe.speed * 100);
        hitAny = true;

        this.score += 5;
        this.hud.addScorePopup(fly.x, fly.y - 20, '+5');

        this.audio.playWhoosh();

        this.particles.burst(fly.x, fly.y, 5, {
          minSpeed: 20, maxSpeed: 80,
          minSize: 1, maxSize: 3,
          minLife: 0.2, maxLife: 0.5,
          color: 'rgba(200, 230, 255, 0.5)',
          friction: 0.95,
          gravity: 0,
        });
      }
    }

    // Swipe makes some noise too - small sleep impact
    if (hitAny) {
      this.sleepMeter = clamp(this.sleepMeter - 2, 0, 100);
    }

    // Visual swipe trail
    this.swipeTrails.push({
      startX: swipe.startX, startY: swipe.startY,
      endX: swipe.endX, endY: swipe.endY,
      timer: 0,
    });
  }

  _handleSquash(tap) {
    // EVERY tap makes noise that affects baby's sleep!
    this.audio.playTapSmack();
    this.sleepMeter = clamp(this.sleepMeter - 3, 0, 100); // Tapping itself costs sleep
    this.baby.stir(); // Any tap near baby area disturbs

    let hitFly = null;
    let hitDist = Infinity;
    let anyNearFly = false;

    for (const fly of this.flies) {
      if (fly.state === 'dead' || fly.state === 'shooed') continue;

      const d = dist(tap.x, tap.y, fly.x, fly.y);
      if (d < 50) {
        anyNearFly = true;

        // Dodge logic: Very high escape chance!
        if (Math.random() < fly.dodgeChance) {
          fly.dodge(tap.x, tap.y);

          // Random dodge taunts
          const taunts = ['DODGED!', 'MISSED!', 'TOO SLOW!', 'NOPE!', 'HA HA!', 'NICE TRY!'];
          const taunt = taunts[Math.floor(Math.random() * taunts.length)];
          this.hud.addScorePopup(fly.x, fly.y - 20, taunt, '#FF6B6B');
          continue;
        }

        if (d < 35 && d < hitDist) {
          hitFly = fly;
          hitDist = d;
        }
      }
    }

    if (hitFly) {
      // Check safe zone
      if (this.baby.isInSafeZone(hitFly.x, hitFly.y)) {
        this._triggerGameOver("Ouch! You tapped the baby! Be more careful! 👶💢");
        return;
      }

      // Successful squash!
      hitFly.squash();
      this.fliesNeutralized++;

      const squashPoints = 75; // More points for harder kills
      this.score += squashPoints;
      this.hud.addCombo();
      const comboBonus = this.hud.combo > 1 ? this.hud.combo * 15 : 0;
      this.score += comboBonus;

      const pointText = comboBonus > 0 ? `+${squashPoints + comboBonus}` : `+${squashPoints}`;
      this.hud.addScorePopup(hitFly.x, hitFly.y - 20, pointText, '#22FF88');

      this.audio.playSquish();
      this.audio.playThump();

      this.particles.burst(hitFly.x, hitFly.y, 18, {
        minSpeed: 40, maxSpeed: 130,
        minSize: 1, maxSize: 5,
        minLife: 0.4, maxLife: 0.8,
        color: '#333333',
        friction: 0.9,
        gravity: 120,
      });

      // Success flash
      this.hud.flash('rgba(34, 214, 111, 0.2)');

      if (this.hapticsEnabled && navigator.vibrate) {
        navigator.vibrate(40);
      }

      // Squashing still makes noise
      this.sleepMeter = clamp(this.sleepMeter - 6, 0, 100);
    }
  }

  _pointToLineDist(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    param = clamp(param, 0, 1);
    const xx = x1 + param * C;
    const yy = y1 + param * D;
    return dist(px, py, xx, yy);
  }

  _spawnFly() {
    const fly = new Fly();
    fly.babyBias = Math.min(0.75, 0.3 + this.timeSurvived / 150);
    this.flies.push(fly);
  }

  _triggerGameOver(reason) {
    this.state = 'gameover';
    this.gameOverReason = reason;

    if (this.baby) this.baby.wakeUp();

    // IMPORTANT: Stop all buzzing IMMEDIATELY
    this.audio.silence();
    this.audio.stopBuzzing();
    setTimeout(() => this.audio.playCry(), 300);

    if (this.hapticsEnabled && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }

    const isHighScore = this.score > this.save.getHighScore();

    this.save.recordSession(this.score, this.timeSurvived, this.fliesNeutralized);

    this.gameOverScreen.show(this.score, this.timeSurvived, this.fliesNeutralized, reason, isHighScore);
  }

  _updateGameOver(dt) {
    this.gameOverScreen.update(dt);

    if (this.baby) this.baby.update(dt, 0);

    // Make sure buzzing stays dead
    this.audio.stopBuzzing();

    const taps = this.input.consumeTaps();
    this.input.consumeSwipes();

    for (const tap of taps) {
      const action = this.gameOverScreen.handleTap(tap.x, tap.y);
      if (action === 'retry') {
        this.audio.playChime();
        this._startGame();
      } else if (action === 'menu') {
        this.audio.playChime();
        this.state = 'menu';
        this.menuScreen.reset();
      }
    }
  }

  _updateLeaderboard(dt) {
    this.leaderboardScreen.update(dt);

    const taps = this.input.consumeTaps();
    this.input.consumeSwipes();

    for (const tap of taps) {
      const action = this.leaderboardScreen.handleTap(tap.x, tap.y);
      if (action === 'back') {
        this.audio.playChime();
        this.state = 'menu';
        this.menuScreen.reset();
      }
    }
  }

  _updateSettings(dt) {
    this.settingsScreen.update(dt);

    const taps = this.input.consumeTaps();
    this.input.consumeSwipes();

    for (const tap of taps) {
      const action = this.settingsScreen.handleTap(tap.x, tap.y);
      if (action === 'back') {
        this.audio.playChime();
        this.state = 'menu';
        this.menuScreen.reset();
      } else if (action === 'sound') {
        this.settingsScreen.soundEnabled = !this.settingsScreen.soundEnabled;
        this.audio.setEnabled(this.settingsScreen.soundEnabled);
        this.save.updateSettings({ soundEnabled: this.settingsScreen.soundEnabled });
        this.settingsScreen._buildButtons();
        if (this.settingsScreen.soundEnabled) this.audio.playChime();
      } else if (action === 'haptics') {
        this.settingsScreen.hapticsEnabled = !this.settingsScreen.hapticsEnabled;
        this.hapticsEnabled = this.settingsScreen.hapticsEnabled;
        this.save.updateSettings({ hapticsEnabled: this.settingsScreen.hapticsEnabled });
        this.settingsScreen._buildButtons();
      } else if (action === 'export') {
        const data = this.save.exportData();
        this._downloadJSON(data, 'sleep-tight-save.json');
      } else if (action === 'import') {
        this._importSave();
      }
    }
  }

  _downloadJSON(data, filename) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  _importSave() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const success = this.save.importData(ev.target.result);
        if (success) {
          this.settingsScreen.show(this.save.getSettings());
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  _draw() {
    const ctx = this.renderer.ctx;
    this.renderer.begin();

    // Always draw nursery background
    this.nursery.draw(ctx);

    // Draw particles behind entities
    this.particles.draw(ctx);

    switch (this.state) {
      case 'menu':
        if (!this.baby) {
          this.baby = new Baby();
        }
        this.baby.update(0.016, 100);
        this.baby.draw(ctx);
        this.menuScreen.draw(ctx, this.renderer);
        break;

      case 'tutorial':
      case 'playing':
        this._drawGame(ctx);
        break;

      case 'gameover':
        this._drawGame(ctx);
        this.gameOverScreen.draw(ctx, this.renderer);
        break;

      case 'leaderboard':
        this.leaderboardScreen.draw(ctx, this.renderer);
        break;

      case 'settings':
        this.settingsScreen.draw(ctx, this.renderer);
        break;
    }

    this.renderer.end();
  }

  _drawGame(ctx) {
    // Draw baby
    if (this.baby) this.baby.draw(ctx);

    // Draw flies
    for (const fly of this.flies) {
      fly.draw(ctx);
    }

    // Draw swipe trails - brighter
    for (const trail of this.swipeTrails) {
      const alpha = 1 - trail.timer / 0.3;
      ctx.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.6})`;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      // Glow on trail
      ctx.shadowColor = `rgba(100, 180, 255, ${alpha * 0.3})`;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(trail.startX, trail.startY);
      ctx.lineTo(trail.endX, trail.endY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw HUD
    this.hud.draw(ctx, this.renderer);
  }
}

// Start the game!
const game = new Game();
