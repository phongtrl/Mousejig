# Mousejig

Mousejig turns an Android phone or iPhone into a moving surface for an optical mouse. Leave the mouse connected to your PC and rest its sensor on the phone. The app shifts a textured pattern a short distance and back at the interval you choose. Both native apps work offline.

[Open Mousejig on your phone](https://phongtrl.github.io/Mousejig/app/)

## Try your mouse

1. Put the phone flat next to the computer and tap **Test my mouse**.
2. Place the mouse’s sensor over the textured area. Watch the PC pointer for eight seconds. A small movement means the sensor can track the screen.
3. Choose **Move every** and **Run for**, then tap **Start jiggling**. Choose an interval shorter than the PC’s idle timeout. Leave the phone face up with the app in the foreground.
4. Lift the mouse and tap **Stop jiggling** to end early. Switching away or locking the phone also ends the session.

Tracking depends on the sensor, screen and brightness. If the pointer stays still, try raising the brightness, repositioning the sensor or using another optical mouse. The app cannot detect the pointer or verify the PC’s idle status.

## Android

Use a phone running Android 8.0 or newer with an up-to-date Android System WebView. Download **Mousejig-Android** from a successful **Build mobile apps** GitHub Actions run, unzip it, and open the APK on the phone. Android may ask you to allow installation from the app that opened the file.

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

Open the link above in your phone’s browser. In Safari use **Share → Add to Home Screen**. In Android Chrome use **Install app** or **Add to home screen**. Allow the first online load to finish so the app can cache its files for offline sessions. Browser screen-wake support depends on the OS and browser version.

The native projects bundle `app/` directly. Each supplies its platform’s screen-awake control and releases it when the session stops or the app leaves the foreground.
