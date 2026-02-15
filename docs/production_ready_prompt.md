# Production Artifact: "Sleep Tight" Master Implementation Prompt

**Project Goal**: Build a production-ready, high-polish Android game called "Sleep Tight" where users protect a sleeping baby from a buzzing fly using touch gestures. The game must feel "premium, fun, and light."

---

## 1. Visual & Aesthetic Architecture
- **Style**: **Stylized 3D (Pixar/Disney inspired)**. Large expressive eyes for the baby, soft rounded edges, and vibrant but warm lighting.
- **Environment**: A cozy Nursery (MVP Room). Focus on textures like soft wool, polished wood, and glowing nightlights.
- **The Baby**: Must have a "Sleep State" animation loop (soft breathing). If the fly gets close, trigger "Stirring" animations (pouting, slight movement).
- **The Fly**: A slightly stylized, non-scary fly with visible wing-blur and a clear buzzing sound.

## 2. Technical Stack Recommendation
- **Engine**: Unity or Godot (preferred for 3D mobile performance and easy Android deployment).
- **UI Framework**: Native engine UI system (Canvas/Control nodes) with custom-styled buttons matching the Pixar aesthetic.
- **Save System**: **Offline-First**. Use Local JSON or a lightweight SQLite database. No external cloud sync or telemetry tracking (e.g., Firebase) to be included in the MVP.

## 3. Data Privacy & Persistence
- **Zero-Sharing Policy**: All player data, high scores, and settings must remain strictly on the user's device.
- **Backup & Restore**: Provide a menu option to "Export Save Data" (generating a local encrypted file or JSON) and "Import Save Data" to allow users to move their progress between devices manually.
- **Persistence**: Ensure and verify that data is not wiped during app updates.

## 4. Core Gameplay Logic (MVP)
### A. The Sleep Meter (0-100)
- **Passive Recovery**: Increases slowly if no flies are near.
- **Proximity Drain**: Drains exponentially faster as a fly gets within a certain radius of the baby's head.
- **Landing Penalty**: If a fly lands on the baby, drain is 5x faster.
- **Instant Loss**: If a fly stays on the face for >1.0s or if the user taps the fly WHILE it is on the baby.

### B. Controls & Actions
- **Swipe (Shoo)**: Applies a physics force to the fly, pushing it away from the baby. Safest action.
- **Tap (Squash)**: Removes the fly from the screen. Must be disabled if the fly's collider overlaps with the baby's "Safe Zone" (triggering a Loss if attempted).

### C. Fly AI
- **Behavior**: Procedural "Wander" with a weighted bias toward the baby's center.
- **Speed**: Increases over time as the session score grows.

## 4. Audio & Haptics
- **Spatial Audio**: High-fidelity 3D buzzing that gets louder and pans based on the fly's position.
- **ASMR Elements**: Soft white noise, gentle breathing, and satisfying "squish" or "whoosh" sounds.
- **Haptics**: Subtle "heartbeat" vibration when the Sleep Meter is critical (<20%).

## 5. MVP Feature List (Release V1.0)
- [ ] Single Room: Classic Nursery.
- [ ] Endless Scoring: Based on survival time + total flies neutralized.
- [ ] High-Score Leaderboard (Local).
- [ ] Restart/Home UI loop.
- [ ] Tutorial Overlay: "Swipe to Shoo, Tap to Squash - Don't hit the baby!"

## 6. Acceptance Criteria for Builder Agent
1. **Performance**: Must maintain 60 FPS on mid-range Android devices.
2. **Visuals**: Lighting must look baked/consistent; no "default asset" feel.
3. **UX**: Loss conditions must be crystal clear to the user (e.g., a "Game Over" screen showing the baby crying with a "Why I Woke Up" explanation).
4. **Build**: Provide a signed APK/AAB and a clear "ReadMe" for Play Store deployment.

---
**Future Context (Do Not Implement for MVP)**:
- Powerups (Electric Rackets, Lavender Spray).
- Additional Rooms (Garden, Airplane, Living Room).
- Skin/Customization for the hand and baby.
