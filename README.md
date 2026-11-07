# TNK Games Arena - Android APK with Google AdMob Play Store Monetization

This project compiles your TNK Games Arena (Tic-Tac-Toe, Puli-Maka, and Cyber Neon Ludo) into a production-grade Android `.apk` integrated with **Google AdMob Mobile Ads SDK**.

---

## 📱 Google Play Store AdMob Integration Summary

### Included Ad Formats:
1. **Rewarded Video Ads**: Players can tap "Watch Ad for +50 Coins" to watch a short video and earn in-game coins!
2. **Interstitial Ads**: Displayed cleanly between matches when a game is completed or won.
3. **Banner Ads**: Anchored non-intrusively at the bottom without blocking gameplay.

---

## 🔑 How to Setup Your Real AdMob IDs Before Launching on Google Play

The code currently uses **official Google AdMob Test IDs** so the app builds and works out of the box without ad-serving penalties.

When you are ready to publish on Google Play Console:
1. Go to [Google AdMob Console](https://admob.google.com).
2. Click **Apps** -> **Add App** -> Select **Android** and **Yes, the app is listed on a supported app store** (or No if not yet published).
3. Copy your **AdMob App ID** (`ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`).
4. Replace it in `app/src/main/AndroidManifest.xml` at:
   ```xml
   <meta-data
       android:name="com.google.android.gms.ads.APPLICATION_ID"
       android:value="YOUR_ADMOB_APP_ID_HERE" />
   ```
5. In AdMob Console, create 3 Ad Units:
   - **Banner**: Copy Ad Unit ID (`ca-app-pub-XXXXXXXXXXXX/YYYYYYYY`)
   - **Interstitial**: Copy Ad Unit ID (`ca-app-pub-XXXXXXXXXXXX/YYYYYYYY`)
   - **Rewarded**: Copy Ad Unit ID (`ca-app-pub-XXXXXXXXXXXX/YYYYYYYY`)
6. Open `app/src/main/java/org/tnk/arena/MainActivity.java` and paste your 3 IDs into lines 44-46.

---

## ⚡ 1-Click Free Cloud APK Build on GitHub Actions (Zero Linux/Studio Setup)
1. Push this entire project folder to a GitHub repository.
2. Go to the **Actions** tab on your GitHub repository.
3. Click on **"Build TNK Arena Android APK with AdMob"** -> **Run workflow**.
4. GitHub's cloud servers build your `.apk` in 2-3 minutes.
5. Download your `TNK-Arena-Android-APK.zip` from the Artifacts section!
