# Mousejig

Mousejig turns an Android phone or iPhone into a moving surface for an optical mouse. Leave the mouse connected to your PC and rest its sensor on the phone. The app shifts a high-contrast texture and holds it until the next nudge. Phones with vibration support can also nudge the side of the mouse while its sensor stays on its usual pad. Both native apps work offline.

[Open Mousejig on your phone](https://phongtrl.github.io/Mousejig/app/)

## Try your mouse

1. Lay the phone flat, select **Fine grain**, and tap **Test my mouse**.
2. Place the mouse’s sensor over the textured area. Watch the PC pointer during the eight-second test. Look for a small nudge once a second. If it stays still, turn up the brightness and repeat with **Wide bars**.
3. Choose a **Move every** interval of 1, 5, 10, 30 or 60 seconds and a **Run for** duration, then tap **Start jiggling**. Choose an interval shorter than the PC’s idle timeout. Leave the phone face up with the app in the foreground.
4. Lift the mouse and tap **Stop jiggling** to end early. Switching away or locking the phone also ends the session.

Try a single layer of thin paper over the screen if the pattern remains visible through it. Some sensors cannot track a phone display.

If **Vibrate** is available, leave the mouse on its usual pad, rest the phone against its side, and repeat the test. The phone pulses once a second during the test and at your selected interval during a session. The amount of movement depends on the phone, mouse and surface. Vibration requires a compatible native device or a browser with vibration support. Watch the PC pointer to confirm either method works.

## Android

Use a phone running Android 8.0 or newer with an up-to-date Android System WebView. Download **Mousejig-Android** from a successful **Build mobile apps** GitHub Actions run, unzip it, and open the APK on the phone. Android may ask you to allow installation from the app that opened the file. Android can reject an update if a previous debug APK used a different signing key. In that case you can use the web app, or uninstall the old debug build before installing the new one. Uninstalling clears its settings.

To build locally, open `android/` in Android Studio, or use JDK 17 and Android SDK 35:

```sh
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## iPhone and iPad

Open `ios/Mousejig.xcodeproj` in Xcode 16 or newer on a Mac. Choose the **Mousejig** scheme and an iOS 16+ simulator, then press **Run**. For a physical device, select your development team in **Signing & Capabilities**, connect and select the device, then press **Run**. If Xcode asks for a unique bundle identifier, enter one registered to your team.

The build workflow also compiles for iPhone and packages a simulator build. To use the **Mousejig-iOS-Simulator** artifact, unzip both archives, start an iOS simulator on the Mac and drag **Mousejig.app** onto it.

## Home-screen web app

Open the link above in your phone’s browser. In Safari use **Share → Add to Home Screen**. In Android Chrome use **Install app** or **Add to home screen**. Allow the first online load to finish so the app can cache its files for offline sessions. Browser screen-wake support depends on the OS and browser version. If a previously installed pad still shows only the older intervals, reopen it online and refresh once the new files have downloaded.

The native projects bundle `app/` directly. Each supplies its platform’s screen-awake control and releases it when the session stops or the app leaves the foreground.
