# 🌙 Sleep Tight - v1.1.0 Update Notes

Mav reporting for duty! Here's the situation report on the upgrades for "Sleep Tight". We've pushed the visual fidelity to "Disney Pixar" levels.

## 🎨 Visual Overhaul "Project Pixar"
- **Magical Atmosphere**:
  - Added **God Rays** streaming through the nursery window during twilight transitions.
  - Implemented a cinematic **Vignette** to focus attention on the baby.
  - Enhanced **Star Twinkling** logic for a dreamy night sky.
- **Character Polish**:
  - The **Fly** is now cuter and rounder! Bigger eyes with pupils and a little smile to match the "non-scary" mandate.
  - The **Baby** now emits **"Zzz" sleep particles** when sleeping peacefully.
- **UI & UX**:
  - Brand new **Animated Loading Screen** with drift effects and shimmer.
  - Smoother **Sleep Meter** gradients.

## 🛠️ Build & Release
- **Automated Build Script**: 
  - Created `build_android.bat` to handle the entire build pipeline (Web -> Capacitor -> Android -> APK/AAB).
  - Handles detection of `keystore.properties` automatically.
  - Includes a fallback for missing `local.properties`.

## 📦 Deliverables
To build your release artifacts, simply run:
```cmd
.\build_android.bat
```

This will generate:
- `android/app/build/outputs/apk/debug/app-debug.apk` (For testing)
- `android/app/build/outputs/bundle/release/app-release.aab` (For Play Store, assuming keystore is set)

Mission accomplished. The nursery is secure and looking swanky. Over and out! ✈️
