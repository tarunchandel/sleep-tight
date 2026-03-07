/**
 * Main Game - the core game loop, state machine, and glue logic.
 * States: loading → menu → tutorial → playing → gameover
 *         menu → leaderboard (sub-screen)
 *         menu → settings (sub-screen)
 *         menu → shop (sub-screen)
 * 
 * v3.0 - "The Coin Hunter Update"
 * - Earn coins by surviving time milestones
 * - Shop: buy goodies with coins
 * - 6 power-ups: Bug Zapper, Sleep Shield, Lavender Aura, Quick Hands, Teddy Guard, Lullaby Boost
 * - Each power-up has unique in-game effects
 * - Coins persist across sessions
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
import { SHOP_ITEMS, COIN_MILESTONES } from './data/shop.js';

import { HUD } from './ui/hud.js';
import { MenuScreen, GameOverScreen, LeaderboardScreen, SettingsScreen } from './ui/screens.js';
import { ShopScreen } from './ui/shop.js';

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
    this.shopScreen = new ShopScreen();

    // Game state
    this.state = 'loading';
    this.prevState = null;

    // Gameplay variables
    this.sleepMeter = 100;
    this.maxSleepMeter = 100;
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

    // Coins earned this session
    this.coinsEarnedThisSession = 0;
    this.lastMilestoneIndex = -1;

    // Active power-ups (derived from equipped items)
    this.activePowerUps = {};

    // Bug Zapper timer
    this.bugZapperTimer = 0;
    this.bugZapperCooldown = 25; // seconds between zaps

    this.teddySwatEffect = null; // visual effect on swat

    // New item state
    this.sonicPacifierTimer = 0;
    this.sonicPacifierCooldown = 40;
    this.sonicPacifierActive = false;
    this.sonicPacifierDuration = 0;

    this.stickyTrapTimer = 0;
    this.traps = [];

    this.coinSpawnTimer = 0;
    this.bonusCoins = [];

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
      "Coins make everything better! 🪙",
      "Shopping spree dreams... 🛒",
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
    this.menuScreen.setCoins(this.save.getCoins());

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
      case 'shop':
        this._updateShop(dt);
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
      } else if (action === 'shop') {
        this.audio.playChime();
        this.state = 'shop';
        this.shopScreen.show(
          this.save.getCoins(),
          this.save.getPurchasedItems(),
          this.save.getItemLevels(),
          this.save.getEquippedItems()
        );
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

  /** Load active power-ups from equipped items with levels */
  _loadPowerUps() {
    this.activePowerUps = {};
    const equipped = this.save.getEquippedItems();
    const levels = this.save.getItemLevels();
    for (const itemId of equipped) {
      this.activePowerUps[itemId] = levels[itemId] || 1;
    }
  }

  /** Get the emojis for active goodies (for HUD display) */
  _getActiveGoodieEmojis() {
    const emojis = [];
    const levels = this.save.getItemLevels();
    for (const item of SHOP_ITEMS) {
      if (this.activePowerUps[item.id]) {
        const level = levels[item.id] || 1;
        const levelStr = level > 1 ? ` (L${level})` : '';
        emojis.push(item.emoji + levelStr);
      }
    }
    return emojis;
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

    // Reset coin tracking
    this.coinsEarnedThisSession = 0;
    this.lastMilestoneIndex = -1;

    // Load power-ups
    this._loadPowerUps();
    this.maxSleepMeter = 100;
    if (this.activePowerUps['midnight_snack']) {
      const snacks = this.activePowerUps['midnight_snack'];
      this.maxSleepMeter = 100 + snacks * 20;
    }
    this.sleepMeter = this.maxSleepMeter;

    this.bugZapperTimer = 0;
    this.bugZapperCooldown = 25;
    if (this.activePowerUps['bug_zapper']) {
      const lvl = this.activePowerUps['bug_zapper'];
      this.bugZapperCooldown = lvl === 1 ? 25 : (lvl === 2 ? 18 : 12);
    }

    this.teddyGuardTimer = 0;
    this.teddyGuardCooldown = 18;
    if (this.activePowerUps['teddy_guard']) {
      const lvl = this.activePowerUps['teddy_guard'];
      this.teddyGuardCooldown = lvl === 1 ? 18 : (lvl === 2 ? 12 : 8);
    }

    this.sonicPacifierTimer = this.sonicPacifierCooldown; // Start charged
    this.sonicPacifierActive = false;
    this.stickyTrapTimer = 0;
    this.traps = [];
    this.bonusCoins = [];
    this.coinSpawnTimer = 0;

    this.teddySwatEffect = null;

    this.hud.showTutorial = true;
    this.hud.tutorialTimer = 0;
    this.hud.combo = 0;
    this.hud.comboTimer = 0;
    this.hud.coinsEarned = 0;
    this.hud.displayCoins = 0;
    this.hud.setActiveGoodies(this._getActiveGoodieEmojis());
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

    // === COIN MILESTONE CHECK ===
    this._checkCoinMilestones();

    // === SLEEP METER LOGIC ===
    let meterDelta = 1.5 * dt; // Slower passive recovery (was 2)

    // Lullaby Boost: sleep recovers faster
    if (this.activePowerUps['lullaby_boost']) {
      const lvl = this.activePowerUps['lullaby_boost'];
      const boost = 1.0 + lvl * 0.5; // 1.5x, 2.0x, 2.5x
      meterDelta *= boost;
    }

    // Sonic Pacifier: Freeze drain
    if (this.sonicPacifierActive) {
      this.sonicPacifierDuration -= dt;
      if (this.sonicPacifierDuration <= 0) {
        this.sonicPacifierActive = false;
        this.sonicPacifierTimer = 0;
      }
      if (meterDelta < 0) meterDelta = 0;
    } else {
      this.sonicPacifierTimer = Math.min(this.sonicPacifierCooldown, this.sonicPacifierTimer + dt);
    }

    // Proximity drain from flies (buzzing disturbs baby!)
    let anyFlyBuzzing = false;
    for (const fly of this.flies) {
      if (fly.state === 'dead') continue;

      const proximity = fly.getProximity(this.baby.getFaceCenter());

      // Buzzing drain - flies near baby = sleep goes down!
      if (proximity > 0.2) {
        anyFlyBuzzing = true;
        let drainRate = Math.pow(proximity, 1.8) * 12;

        // Sleep Shield: drains slower
        if (this.activePowerUps['sleep_shield']) {
          const lvl = this.activePowerUps['sleep_shield'];
          const reduction = 0.3 + (lvl - 1) * 0.15; // 30%, 45%, 60%
          drainRate *= (1 - reduction);
        }

        meterDelta -= drainRate * dt;
      }

      // Extra drain when circling (the anticipation!)
      if (fly.state === 'circling' && proximity > 0.3) {
        let circleDrain = 5;
        if (this.activePowerUps['sleep_shield']) {
          const lvl = this.activePowerUps['sleep_shield'];
          const reduction = 0.3 + (lvl - 1) * 0.15;
          circleDrain *= (1 - reduction);
        }
        meterDelta -= circleDrain * dt;
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

    this.sleepMeter = clamp(this.sleepMeter + meterDelta, 0, this.maxSleepMeter);

    if (this.sleepMeter <= 0) {
      this._triggerGameOver('Too much buzzing woke the baby up! 🪰😭');
      return;
    }

    // Score: time-based
    this.score += dt * 10;

    // === POWER-UP EFFECTS ===

    // Bug Zapper: auto-zap a fly periodically
    if (this.activePowerUps['bug_zapper']) {
      this.bugZapperTimer += dt;
      if (this.bugZapperTimer >= this.bugZapperCooldown) {
        this._activateBugZapper();
        this.bugZapperTimer = 0;
      }
    }

    // Teddy Guard: periodically shoo a fly
    if (this.activePowerUps['teddy_guard']) {
      this.teddyGuardTimer += dt;
      if (this.teddyGuardTimer >= this.teddyGuardCooldown) {
        this._activateTeddyGuard();
        this.teddyGuardTimer = 0;
      }
    }

    // Update teddy swat visual effect
    if (this.teddySwatEffect) {
      this.teddySwatEffect.timer += dt;
      if (this.teddySwatEffect.timer > 0.8) {
        this.teddySwatEffect = null;
      }
    }

    // Lavender Aura: reduce fly baby bias (applied at spawn only, see _spawnFly)

    // Fan Breeze: passive outward force
    if (this.activePowerUps['fan_breeze']) {
      const lvl = this.activePowerUps['fan_breeze'];
      const force = 10 + lvl * 15;
      const face = this.baby.getFaceCenter();
      for (const fly of this.flies) {
        if (fly.state !== 'dead') {
          const d = dist(fly.x, fly.y, face.x, face.y);
          if (d < 250) {
            const angle = Math.atan2(fly.y - face.y, fly.x - face.x);
            fly.x += Math.cos(angle) * force * dt;
            fly.y += Math.sin(angle) * force * dt;
          }
        }
      }
    }

    // === FLY SPAWNING ===
    this.flySpawnTimer += dt;
    this.flySpawnInterval = Math.max(1.5, 5 - this.timeSurvived / 45);
    const currentMaxFlies = Math.min(this.maxFlies, 1 + Math.floor(this.timeSurvived / 25));

    if (this.flySpawnTimer >= this.flySpawnInterval && this.flies.filter(f => f.state !== 'dead').length < currentMaxFlies) {
      this._spawnFly();
      this.flySpawnTimer = 0;
    }

    // Sticky Trap: deploy periodic traps
    if (this.activePowerUps['sticky_trap']) {
      const lvl = this.activePowerUps['sticky_trap'];
      const interval = 30 - (lvl - 1) * 7; // 30, 23, 16s
      this.stickyTrapTimer += dt;
      if (this.stickyTrapTimer >= interval) {
        this._deployStickyTrap();
        this.stickyTrapTimer = 0;
      }
    }

    // Update traps
    this.traps = this.traps.filter(t => {
      t.life -= dt;
      // Check for fly collision
      for (const fly of this.flies) {
        if (fly.state !== 'dead' && fly.state !== 'shooed' && dist(fly.x, fly.y, t.x, t.y) < 25) {
          fly.squash();
          this.hud.setFunMessage('🕸️ TRAPPED!');
          this.hud.addScorePopup(fly.x, fly.y - 20, 'TRAPPED!');
          this.fliesNeutralized++;
          this.score += 50;
          return false; // Trap consumed
        }
      }
      return t.life > 0;
    });

    // Coin Magnet & Bonus Coins
    if (this.activePowerUps['coin_magnet']) {
      this.coinSpawnTimer += dt;
      if (this.coinSpawnTimer > 15) {
        this._spawnBonusCoin();
        this.coinSpawnTimer = 0;
      }

      const lvl = this.activePowerUps['coin_magnet'];
      const magnetRange = 100 + lvl * 80;
      const touchRange = 30;

      for (const coin of this.bonusCoins) {
        // Attract to last input position if near
        const tapDist = dist(this.input.lastX, this.input.lastY, coin.x, coin.y);
        if (tapDist < magnetRange) {
          const angle = Math.atan2(this.input.lastY - coin.y, this.input.lastX - coin.x);
          coin.vx += Math.cos(angle) * 500 * dt;
          coin.vy += Math.sin(angle) * 500 * dt;
        }

        coin.x += coin.vx * dt;
        coin.y += coin.vy * dt;
        coin.vx *= 0.95;
        coin.vy *= 0.95;

        if (tapDist < touchRange && !coin.collected) {
          coin.collected = true;
          const value = 5 + lvl * 5;
          this.save.addCoins(value);
          this.hud.setCoins(this.save.getCoins());
          this.hud.addScorePopup(coin.x, coin.y, `🪙 +${value}`);
          this.audio.playChime();
        }
      }
      this.bonusCoins = this.bonusCoins.filter(c => !c.collected && c.y < GAME_HEIGHT + 50 && c.x > -60 && c.x < GAME_WIDTH + 60);
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
      // Check for Sonic Pacifier tap
      if (this.activePowerUps['sonic_pacifier'] && !this.sonicPacifierActive && this.sonicPacifierTimer >= this.sonicPacifierCooldown) {
        const pSize = 40;
        const px = GAME_WIDTH - 60;
        const py = GAME_HEIGHT - 60;
        if (tap.x > px - pSize && tap.x < px + pSize && tap.y > py - pSize && tap.y < py + pSize) {
          const lvl = this.activePowerUps['sonic_pacifier'];
          this.sonicPacifierDuration = lvl === 1 ? 5 : (lvl === 2 ? 8 : 12); // 5, 8, 12s
          this.sonicPacifierActive = true;
          this.audio.playChime();
          this.hud.setFunMessage('🤫 SHHHH! QUIET TIME!');
          continue; // Tap consumed by pacifier
        }
      }
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
    this.hud.update(dt, this.sleepMeter, this.score, this.timeSurvived, this.fliesNeutralized, this.maxSleepMeter);

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

    // === LAVENDER AURA PARTICLES ===
    if (this.activePowerUps['lavender_aura'] && Math.random() < dt * 1.5) {
      const face = this.baby.getFaceCenter();
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * 40;
      this.particles.burst(
        face.x + Math.cos(angle) * radius,
        face.y + Math.sin(angle) * radius,
        1,
        {
          minSpeed: 5,
          maxSpeed: 15,
          minSize: 1,
          maxSize: 2.5,
          minLife: 0.5,
          maxLife: 1.2,
          color: 'rgba(170, 130, 220, 0.4)',
          friction: 0.95,
          gravity: -10,
        }
      );
    }
  }

  /** Check for coin milestones */
  _checkCoinMilestones() {
    for (let i = 0; i < COIN_MILESTONES.length; i++) {
      const milestone = COIN_MILESTONES[i];
      if (this.timeSurvived >= milestone.time && i > this.lastMilestoneIndex) {
        this.lastMilestoneIndex = i;

        let coins = milestone.coins;
        if (this.activePowerUps['golden_diaper']) {
          const lvl = this.activePowerUps['golden_diaper'];
          const mult = lvl === 1 ? 1.5 : (lvl === 2 ? 2 : 3);
          coins = Math.round(coins * mult);
        }

        this.coinsEarnedThisSession += coins;
        this.hud.setCoins(this.coinsEarnedThisSession);

        // Coin popup shows the actual (possibly multiplied) amount
        const face = this.baby.getFaceCenter();
        this.hud.addScorePopup(
          GAME_WIDTH / 2,
          face.y - 60,
          `🪙 +${coins}`,
          '#FFD700'
        );

        // Fun message about coins
        this.hud.setFunMessage(milestone.message);

        // Coin particles
        this.particles.burst(GAME_WIDTH / 2, face.y - 40, 12, {
          minSpeed: 30,
          maxSpeed: 90,
          minSize: 2,
          maxSize: 4,
          minLife: 0.5,
          maxLife: 1.0,
          color: '#FFD700',
          friction: 0.92,
          gravity: 60,
        });

        // Audio cue
        this.audio.playChime();
      }
    }
  }

  /** Bug Zapper: auto-eliminate a random fly */
  _activateBugZapper() {
    const aliveFlies = this.flies.filter(f => f.state !== 'dead' && f.state !== 'shooed');
    if (aliveFlies.length === 0) return;

    // Pick a random fly to zap
    const target = aliveFlies[Math.floor(Math.random() * aliveFlies.length)];
    target.squash();
    this.fliesNeutralized++;
    this.score += 30;

    // Visual effect
    this.hud.addScorePopup(target.x, target.y - 20, '⚡ ZAP!', '#FFD700');

    // Zap particles - electric looking
    this.particles.burst(target.x, target.y, 15, {
      minSpeed: 60,
      maxSpeed: 150,
      minSize: 1,
      maxSize: 3,
      minLife: 0.2,
      maxLife: 0.6,
      color: '#FFD700',
      friction: 0.88,
      gravity: 0,
    });

    // Audio
    this.audio.playSquish();

    if (this.hapticsEnabled && navigator.vibrate) {
      navigator.vibrate([20, 10, 30]);
    }
  }

  /** Teddy Guard: shoo a nearby fly */
  _activateTeddyGuard() {
    const babyInfo = this.baby.getFaceCenter();
    let closestFly = null;
    let closestDist = Infinity;

    for (const fly of this.flies) {
      if (fly.state === 'dead' || fly.state === 'shooed') continue;
      const d = dist(fly.x, fly.y, babyInfo.x, babyInfo.y);
      if (d < closestDist) {
        closestDist = d;
        closestFly = fly;
      }
    }

    if (closestFly && closestDist < 200) {
      // Shoo the fly away from baby
      const dx = closestFly.x - babyInfo.x;
      const dy = closestFly.y - babyInfo.y;
      closestFly.shoo(dx, dy, 350);
      this.score += 10;

      // Visual
      this.hud.addScorePopup(closestFly.x, closestFly.y - 20, '🧸 SWAT!', '#C08040');

      // Teddy swat effect
      this.teddySwatEffect = {
        x: babyInfo.x + (closestFly.x - babyInfo.x) * 0.3,
        y: babyInfo.y + (closestFly.y - babyInfo.y) * 0.3,
        timer: 0,
      };

      // Particles
      this.particles.burst(closestFly.x, closestFly.y, 8, {
        minSpeed: 20,
        maxSpeed: 60,
        minSize: 1,
        maxSize: 3,
        minLife: 0.2,
        maxLife: 0.5,
        color: 'rgba(192, 128, 64, 0.5)',
        friction: 0.95,
        gravity: 0,
      });

      this.audio.playWhoosh();
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
      this.sleepMeter = clamp(this.sleepMeter - 2, 0, this.maxSleepMeter);
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
    this.sleepMeter = clamp(this.sleepMeter - 3, 0, this.maxSleepMeter); // Tapping itself costs sleep
    this.baby.stir(); // Any tap near baby area disturbs

    let hitFly = null;
    let hitDist = Infinity;
    let anyNearFly = false;

    // Quick Hands: bigger hit radius
    let squashRadius = 35;
    let baseHitRadius = 50;

    if (this.activePowerUps['quick_hands']) {
      const lvl = this.activePowerUps['quick_hands'];
      baseHitRadius = 50 + lvl * 10;
      squashRadius = 35 + lvl * 10;
    }

    for (const fly of this.flies) {
      if (fly.state === 'dead' || fly.state === 'shooed') continue;

      const d = dist(tap.x, tap.y, fly.x, fly.y);
      if (d < baseHitRadius) {
        anyNearFly = true;

        // Dodge logic: Very high escape chance!
        // Quick Hands: reduces dodge chance
        let dodgeChance = fly.dodgeChance;
        if (this.activePowerUps['quick_hands']) {
          const lvl = this.activePowerUps['quick_hands'];
          const reduction = 0.15 + (lvl - 1) * 0.1; // 15%, 25%, 35%
          dodgeChance = Math.max(0.3, dodgeChance - reduction);
        }

        if (Math.random() < dodgeChance) {
          fly.dodge(tap.x, tap.y);

          // Random dodge taunts
          const taunts = ['DODGED!', 'MISSED!', 'TOO SLOW!', 'NOPE!', 'HA HA!', 'NICE TRY!'];
          const taunt = taunts[Math.floor(Math.random() * taunts.length)];
          this.hud.addScorePopup(fly.x, fly.y - 20, taunt, '#FF6B6B');
          continue;
        }

        if (d < squashRadius && d < hitDist) {
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
      this.sleepMeter = clamp(this.sleepMeter - 6, 0, this.maxSleepMeter);
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

    // Lavender Aura: reduce baby bias for new flies (level-scaled)
    if (this.activePowerUps['lavender_aura']) {
      const lvl = this.activePowerUps['lavender_aura'];
      const reductionMult = 1 - (0.25 + (lvl - 1) * 0.15); // 75%, 60%, 45% of original bias
      fly.babyBias = Math.max(0.08, fly.babyBias * reductionMult);
    }

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

    // Use the accumulated coins (already includes Golden Diaper multiplier)
    // Don't recalculate — coinsEarnedThisSession was tracked correctly in _checkCoinMilestones
    this.save.recordSession(this.score, this.timeSurvived, this.fliesNeutralized, this.coinsEarnedThisSession);

    const totalCoins = this.save.getCoins();

    this.gameOverScreen.show(
      this.score,
      this.timeSurvived,
      this.fliesNeutralized,
      reason,
      isHighScore,
      this.coinsEarnedThisSession,
      totalCoins
    );
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
        this.menuScreen.setCoins(this.save.getCoins());
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
        this.menuScreen.setCoins(this.save.getCoins());
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
        this.menuScreen.setCoins(this.save.getCoins());
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

  _updateShop(dt) {
    this.shopScreen.update(dt);

    const taps = this.input.consumeTaps();
    const swipes = this.input.consumeSwipes();

    // Handle scrolling via swipe
    for (const swipe of swipes) {
      this.shopScreen.handleSwipe(-swipe.dy);
    }

    for (const tap of taps) {
      const action = this.shopScreen.handleTap(tap.x, tap.y);
      if (!action) continue;

      if (action === 'back') {
        this.audio.playChime();
        this.state = 'menu';
        this.menuScreen.reset();
        this.menuScreen.setCoins(this.save.getCoins());
      } else if (action.startsWith('buy_')) {
        const itemId = action.replace('buy_', '');
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (item) {
          const success = this.save.purchaseItem(itemId, item.price);
          if (success) {
            this.audio.playChime();
            this.shopScreen.coinPulse = 1;
            // Refresh shop
            this.shopScreen.show(
              this.save.getCoins(),
              this.save.getPurchasedItems(),
              this.save.getItemLevels(),
              this.save.getEquippedItems()
            );
          }
        }
      } else if (action.startsWith('upgrade_')) {
        const itemId = action.replace('upgrade_', '');
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        const currentLevel = this.save.getItemLevel(itemId);
        if (item && currentLevel < item.maxLevel) {
          const price = item.upgradePrices[currentLevel - 1];
          const success = this.save.upgradeItem(itemId, price);
          if (success) {
            this.audio.playChime();
            this.shopScreen.coinPulse = 1;
            this._loadPowerUps();
            this.shopScreen.show(
              this.save.getCoins(),
              this.save.getPurchasedItems(),
              this.save.getItemLevels(),
              this.save.getEquippedItems()
            );
          }
        }
      } else if (action.startsWith('toggle_')) {
        const itemId = action.replace('toggle_', '');
        const success = this.save.toggleEquip(itemId);
        if (success) {
          this.audio.playChime();
          this._loadPowerUps();
          // Refresh shop
          this.shopScreen.show(
            this.save.getCoins(),
            this.save.getPurchasedItems(),
            this.save.getItemLevels(),
            this.save.getEquippedItems()
          );
        }
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

      case 'shop':
        this.shopScreen.draw(ctx, this.renderer);
        break;
    }

    this.renderer.end();
  }

  _drawGame(ctx) {
    // Draw baby
    if (this.baby) this.baby.draw(ctx);

    // Draw lavender aura ring if active
    if (this.activePowerUps['lavender_aura'] && this.baby && this.state === 'playing') {
      this._drawLavenderAura(ctx);
    }

    // Draw teddy swat effect
    if (this.teddySwatEffect && this.state === 'playing') {
      this._drawTeddySwatEffect(ctx);
    }

    // Draw bug zapper indicator
    if (this.activePowerUps['bug_zapper'] && this.state === 'playing') {
      this._drawBugZapperIndicator(ctx);
    }

    // Draw traps
    for (const trap of this.traps) {
      const alpha = Math.min(1, trap.life);
      ctx.globalAlpha = alpha * 0.7;
      ctx.font = '24px sans-serif';
      ctx.fillText('🪤', trap.x, trap.y);
      ctx.globalAlpha = 1;
    }

    // Draw bonus coins
    for (const coin of this.bonusCoins) {
      ctx.font = '20px sans-serif';
      ctx.fillText('🪙', coin.x, coin.y);
      // Glow
      ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

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

    // Draw Sonic Pacifier Button if equipped
    if (this.activePowerUps['sonic_pacifier']) {
      this._drawSonicPacifierButton(ctx);
    }
  }

  _drawSonicPacifierButton(ctx) {
    const px = GAME_WIDTH - 60;
    const py = GAME_HEIGHT - 60;
    const progress = this.sonicPacifierTimer / this.sonicPacifierCooldown;
    const isActive = this.sonicPacifierActive;

    ctx.save();
    ctx.translate(px, py);

    // Glow if ready
    if (progress >= 1 || isActive) {
      ctx.shadowColor = isActive ? '#44AAFF' : '#FFD700';
      ctx.shadowBlur = 15;
    }

    // Circle background
    ctx.fillStyle = isActive ? 'rgba(68, 170, 255, 0.4)' : 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();

    // Progress arc
    if (!isActive) {
      ctx.strokeStyle = progress >= 1 ? '#FFD700' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
    } else {
      // Duration pulse
      const pulse = 1 + Math.sin(this.timeSurvived * 10) * 0.1;
      ctx.scale(pulse, pulse);
    }

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🤫', 0, 0);

    ctx.restore();
  }

  /** Draw the lavender aura visual effect around the baby */
  _drawLavenderAura(ctx) {
    const face = this.baby.getFaceCenter();
    const radius = 80 + Math.sin(this.timeSurvived * 1.5) * 8;
    const alpha = 0.08 + Math.sin(this.timeSurvived * 0.8) * 0.03;

    // Outer glow ring
    const grad = ctx.createRadialGradient(face.x, face.y, radius * 0.5, face.x, face.y, radius);
    grad.addColorStop(0, 'rgba(170, 130, 220, 0)');
    grad.addColorStop(0.7, `rgba(170, 130, 220, ${alpha})`);
    grad.addColorStop(1, 'rgba(170, 130, 220, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(face.x, face.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner soft glow
    const innerGrad = ctx.createRadialGradient(face.x, face.y, 0, face.x, face.y, radius * 0.6);
    innerGrad.addColorStop(0, `rgba(200, 170, 240, ${alpha * 0.5})`);
    innerGrad.addColorStop(1, 'rgba(200, 170, 240, 0)');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(face.x, face.y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Draw teddy guard swat visual effect */
  _drawTeddySwatEffect(ctx) {
    const { x, y, timer } = this.teddySwatEffect;
    const alpha = Math.max(0, 1 - timer / 0.8);
    const scale = 0.5 + timer * 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Teddy paw print
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐾', 0, 0);

    ctx.restore();
  }

  /** Draw bug zapper charge indicator */
  _drawBugZapperIndicator(ctx) {
    // Small zapper icon in bottom-left with charge progress
    const x = 30;
    const y = GAME_HEIGHT - 30;
    const progress = this.bugZapperTimer / this.bugZapperCooldown;

    ctx.save();
    ctx.globalAlpha = 0.4;

    // Background circle
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Charge arc
    ctx.strokeStyle = progress >= 0.95 ? '#FFD700' : 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();

    // Zapper emoji
    ctx.globalAlpha = progress >= 0.95 ? 0.8 : 0.4;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', x, y);

    ctx.restore();
  }

  /** Deploy a sticky trap at a random location */
  _deployStickyTrap() {
    const margin = 50;
    this.traps.push({
      x: margin + Math.random() * (GAME_WIDTH - margin * 2),
      y: margin + Math.random() * (GAME_HEIGHT - margin * 2),
      life: 15, // lasts 15s
    });
    this.audio.playChime();
  }

  /** Spawn a bonus coin at a random side */
  _spawnBonusCoin() {
    const side = Math.random() > 0.5 ? -30 : GAME_WIDTH + 30;
    this.bonusCoins.push({
      x: side,
      y: 100 + Math.random() * 300,
      vx: side < 0 ? 100 + Math.random() * 100 : -(100 + Math.random() * 100),
      vy: (Math.random() - 0.5) * 50,
      collected: false,
    });
  }
}

// Start the game!
const game = new Game();
