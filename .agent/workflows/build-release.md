---
description: Build and release Sleep Tight APK/AAB
---

# Build & Release Sleep Tight

// turbo-all

## Steps

1. Make sure you're in the project root: `c:\Repo\sleep-tight`

2. Build the web assets:
```powershell
npm run build
```

3. Sync web assets to Android:
```powershell
npx cap sync android
```

4. Set ANDROID_HOME and build the release APK:
```powershell
$env:ANDROID_HOME = "C:\Users\Tarun\AppData\Local\Android\Sdk"
cd android
.\gradlew.bat assembleRelease
```

5. Build the release AAB (for Play Store):
```powershell
.\gradlew.bat bundleRelease
```

6. Copy release artifacts:
```powershell
cd ..
New-Item -ItemType Directory -Path releases -Force
Copy-Item android\app\build\outputs\apk\release\app-release.apk releases\sleep-tight-v1.0.0.apk -Force
Copy-Item android\app\build\outputs\bundle\release\app-release.aab releases\sleep-tight-v1.0.0.aab -Force
```

7. Verify the releases:
```powershell
Get-ChildItem releases
```

8. Upload to Google Play Console:
```powershell
cd android
.\gradlew.bat publishReleaseBundle
```

## Notes
- The keystore is at `android/sleep-tight-release.jks`
- Keystore properties are at `android/keystore.properties` (gitignored)
- You MUST have a `android/google-play.json` service account file for automation to work.
- Before uploading to Play Store, bump `versionCode` in `android/app/build.gradle`
