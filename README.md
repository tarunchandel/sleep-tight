# 🌙 Sleep Tight

> **Protect the sleeping baby from buzzing flies!**

A premium, fun, and addictive mobile game built with HTML5 Canvas and wrapped for Android with Capacitor. Shoo or squash pesky flies before they wake the baby — but be careful not to tap the baby!

---

## 🎮 Gameplay

### Core Mechanics
- **Sleep Meter (0–100%)**: Shows how deeply the baby is sleeping
  - **Passive Recovery**: Slowly regenerates when no flies are nearby
  - **Proximity Drain**: Drains exponentially faster as flies approach the baby
  - **Landing Penalty**: 5x drain if a fly lands on the baby
  - **Instant Loss**: Fly on face > 1 second, or tapping a fly while it's on the baby

### Controls
| Gesture | Action | Risk | Reward |
|---------|--------|------|--------|
| **Swipe** | Shoo — pushes fly away | ✅ Safe | +5 points |
| **Tap** | Squash — kills the fly | ⚠️ Risky near baby | +25 points |

### Scoring
- **10 points/second** for keeping the baby asleep
- **+5 points** per fly shooed
- **+25 points** per fly squashed (with combo multipliers)
- **Combo system**: Chain squashes for bonus points!

### Difficulty Progression
- Fly speed increases over time
- More flies spawn as the game progresses
- Flies become more aggressive (stronger baby-bias)

---

## ✨ Features

- 🎨 **Rich Procedural Graphics** — Hand-drawn nursery with crib, nightlight, window with stars/moon, mobile hanger, and teddy bear
- 🌅 **Dynamic Lighting** — Room transitions from sunset → twilight → moonlight
- 👶 **Expressive Baby** — Sleep, stir, pout, cry animations with tear drops
- 🪰 **Smart Fly AI** — Wander, approach, landing behaviors with increasing difficulty
- 🔊 **Spatial Audio** — Procedurally generated buzzing that pans and changes volume based on fly position
- 📳 **Haptic Feedback** — Heartbeat vibration when sleep meter is critical
- 🏆 **Local Leaderboard** — Top 10 scores with time and fly count
- 💾 **Offline-First** — Zero internet required, all data stays on device
- 📤 **Export/Import** — Backup and restore your save data as JSON
- 🎯 **Tutorial Overlay** — "Swipe to Shoo, Tap to Squash — Don't hit the baby!"
- 🎵 **ASMR Ambient** — Soft white noise and breathing sounds

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Rendering** | HTML5 Canvas 2D (60fps) |
| **Game Logic** | Vanilla JavaScript (ES Modules) |
| **Build Tool** | Vite 6 |
| **Android Wrapper** | Capacitor 6 |
| **Audio** | Web Audio API (procedural, no external files) |
| **Persistence** | LocalStorage |
| **Font** | Nunito (Google Fonts) |

---

## 📦 Project Structure

```
sleep-tight/
├── index.html                 # Game shell with loading screen
├── src/
│   ├── main.js                # Game loop, state machine, core logic
│   ├── engine/
│   │   ├── renderer.js        # Canvas renderer with auto-scaling
│   │   ├── input.js           # Touch/mouse input with gesture detection
│   │   ├── particles.js       # Particle effects system
│   │   └── utils.js           # Math, easing, formatting utilities
│   ├── entities/
│   │   ├── nursery.js         # Background: room, crib, nightlight, window
│   │   ├── baby.js            # Baby entity with sleep/stir/wake animations
│   │   └── fly.js             # Fly AI with procedural behavior
│   ├── audio/
│   │   └── audio.js           # Web Audio: spatial buzz, SFX, ambient
│   ├── ui/
│   │   ├── hud.js             # Sleep meter, score, combo, tutorial
│   │   └── screens.js         # Menu, Game Over, Leaderboard, Settings
│   └── data/
│       └── save.js            # LocalStorage persistence + export/import
├── android/                   # Capacitor Android project
├── releases/                  # Built APK/AAB files
│   ├── sleep-tight-v1.0.0.apk
│   └── sleep-tight-v1.0.0.aab
├── docs/
│   ├── game_concept_brainstorm.md
│   ├── production_ready_prompt.md
│   └── implementation_plan.md
├── capacitor.config.json
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (developed on v24)
- **Java 17** (for Android builds)
- **Android SDK** (with Build Tools 34)

### Development
```bash
# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev

# Open http://localhost:5173 in browser
```

### Production Build (Automated)
Run the provided script to automate the entire process:
```bash
./build_android.bat
```

This will:
1. Build web assets (`npm run build`)
2. Sync with Android (`npx cap sync android`)
3. Build artifacts (`android/app/build/outputs/`)

### Release Artifacts
After minimal build, your signed files are at:
- **APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Android Configuration

| Setting | Value |
|---------|-------|
| **Package ID** | `com.genaiapps.sleeptight` |
| **Min SDK** | 22 (Android 5.1) |
| **Target SDK** | 34 (Android 14) |
| **Orientation** | Portrait locked |
| **Keep Screen On** | Yes |
| **Internet Permission** | Removed (fully offline) |

---

## 🔐 Data Privacy

- **Zero-Sharing Policy**: All player data stays strictly on the user's device
- **No Internet Required**: The INTERNET permission has been removed
- **No Analytics/Telemetry**: No Firebase, no tracking, no data collection
- **Backup & Restore**: Users can export/import their data as JSON files

---

## 🗺️ Roadmap

### V1.0 (MVP) ✅
- [x] Single Room: Classic Nursery
- [x] Endless Scoring: time + flies neutralized
- [x] Local High-Score Leaderboard
- [x] Restart/Home UI loop
- [x] Tutorial Overlay
- [x] Export/Import save data
- [x] Signed APK + AAB

### Future (Not in MVP)
- [ ] **Power-ups**: Electric Racket, Lavender Spray, White Noise Machine
- [ ] **Additional Rooms**: Garden, Airplane, Living Room
- [ ] **Fly Variants**: Drunk Fly, Mosquito (stealth)
- [ ] **Skin Customization**: Different hands and baby outfits
- [ ] **Daily Challenges**: Afternoon Nap, Midnight Sleep
- [ ] **Achievements System**

---

## 📄 License

Private project. All rights reserved.

---

*Built with ❤️ and lots of ☕ — keeping babies sleeping since 2026!*
