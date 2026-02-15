@echo off
echo Building Sleep Tight for Android...

echo 1. Building web assets...
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

echo 2. Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 exit /b %errorlevel%

echo 3. Building Android APK (Debug)...
cd android
if not exist local.properties (
    echo WARNING: local.properties not found! Android SDK location is unknown.
    echo Please create 'android/local.properties' with 'sdk.dir=PATH_TO_SDK'
    echo Taking a guess at default location...
    echo sdk.dir=C:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk > local.properties
)
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo Error building Debug APK.
    cd ..
    exit /b %errorlevel%
)

echo 4. Building Android Bundle (Release)...
if exist keystore.properties (
    call gradlew bundleRelease
    if %errorlevel% neq 0 (
        echo Error building Release Bundle. Check keystore configuration.
    ) else (
        echo Releases built successfully!
    )
) else (
    echo Skipping Release build (keystore.properties not found).
    echo You can find the Debug APK at: android\app\build\outputs\apk\debug\app-debug.apk
)

cd ..
pause
