# Sleep Tight - Implementation Plan

## Architecture Decision
- **Rendering**: HTML5 Canvas 2D (high-performance, 60fps capable)
- **Framework**: Vanilla JS with Vite bundler (fast HMR, optimized builds)
- **Android Wrapper**: Capacitor 6 (compatible with Java 17)
- **Art Style**: Procedurally drawn 2D illustrations with particle effects and smooth animations
- **Audio**: Web Audio API for spatial buzzing + ASMR ambient (all procedural, zero external files)

## Phase 1: Project Setup ✅
- [x] Initialize Vite project
- [x] Configure project structure (engine/, entities/, ui/, audio/, data/)
- [x] Set up Canvas rendering loop with fixed 400x720 resolution

## Phase 2: Core Game Engine ✅
- [x] Game state machine (Loading → Menu → Tutorial → Playing → GameOver)
- [x] Canvas rendering pipeline with auto-scaling to any screen size
- [x] Input system (touch swipe + tap detection with gesture recognition)
- [x] Particle effects system (dust motes, squash bursts, shoo trails)
- [x] Easing library for smooth animations

## Phase 3: Game Objects ✅
- [x] Baby entity (sleep/stir/wake animations, expressive face, tears)
- [x] Fly AI (wander/approach/landing/shooed/dead states, baby-biased pathfinding)
- [x] Sleep Meter (0-100, passive recovery, proximity drain, landing penalty)
- [x] Safe Zone collision detection (circular zone around baby)
- [x] Nursery background (crib, nightlight, window, mobile hanger, shelf, teddy bear)

## Phase 4: Gameplay Logic ✅
- [x] Swipe → Shoo (physics force on fly, +5 points)
- [x] Tap → Squash (kill fly if outside safe zone, +25 points with combos)
- [x] Game Over if tapping fly on baby
- [x] Sleep meter mechanics (passive recovery, proximity drain, 5x landing drain)
- [x] Instant loss (fly on face >1s, tap on baby)
- [x] Scoring (time survived + flies neutralized + combo multiplier)
- [x] Difficulty progression (fly speed + count increase, baby bias increases)

## Phase 5: Audio & Haptics ✅
- [x] Spatial buzzing (panning + volume based on fly position)
- [x] Ambient nursery sounds (white noise via web audio)
- [x] SFX (whoosh shoo, squish squash, baby cry, heartbeat, chime)
- [x] Haptic feedback (heartbeat vibration <20%, squash tap, game over pattern)

## Phase 6: UI & Polish ✅
- [x] Main menu screen (animated title, play/scores/settings buttons)
- [x] Tutorial overlay ("Swipe to Shoo, Tap to Squash — Don't hit the baby!")
- [x] HUD (animated sleep meter bar, score counter, time, fly count)
- [x] Game Over screen with "Why I Woke Up" explanation + stats
- [x] High score leaderboard (local, top 10 with medals)
- [x] Settings (sound toggle, haptics toggle)
- [x] Save/Load system (LocalStorage)
- [x] Export/Import save data (JSON files)
- [x] Combo system with visual popup text

## Phase 7: Visual Polish ✅
- [x] Nursery background with warm lighting
- [x] Dynamic lighting (sunset → twilight → moonlight via light cycle)
- [x] Particle effects (dust motes, squash debris, shoo wind)
- [x] Screen vignette when sleep meter is critical
- [x] Swipe trail visual effect
- [x] Score popup animations
- [x] Baby cheek blushing when stressed
- [x] Stars & moon in window

## Phase 8: Android Build ✅
- [x] Add Capacitor 6 Android platform
- [x] Configure portrait-only, keep-screen-on
- [x] Remove INTERNET permission (100% offline)
- [x] Configure release signing (keystore)
- [x] Build signed APK (2.86 MB)
- [x] Build signed AAB (2.69 MB)
- [x] Copy to releases/ folder

## Phase 9: Documentation ✅
- [x] Updated comprehensive README.md
- [x] Build & release workflow (.agent/workflows/build-release.md)
- [x] Dev run workflow (.agent/workflows/run-local.md)
- [x] Implementation plan (this file)

## Release Artifacts
- `releases/sleep-tight-v1.0.0.apk` — Direct install APK (2.86 MB)
- `releases/sleep-tight-v1.0.0.aab` — Play Store bundle (2.69 MB)
