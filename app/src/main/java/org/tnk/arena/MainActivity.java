package org.tnk.arena;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

public class MainActivity extends Activity {
    private static final String TAG = "TNK_AdMob";

    // Google AdMob Ad Unit IDs (Defaults to Google official test IDs for safe development)
    // When deploying to Google Play Store, these are replaced with your real Ad Unit IDs
    private static final String AD_UNIT_BANNER = "ca-app-pub-3940256099942544/6300978111";
    private static final String AD_UNIT_INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712";
    private static final String AD_UNIT_REWARDED = "ca-app-pub-3940256099942544/5224354917";

    private FrameLayout rootLayout;
    private WebView webView;
    private AdView bannerAdView;
    private InterstitialAd interstitialAd;
    private RewardedAd rewardedAd;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on during active match
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemUI();

        // Root container for WebView + Overlay Banner Ad
        rootLayout = new FrameLayout(this);
        rootLayout.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // 1. Setup WebView
        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        // Cyber Defense Armor: Prevent cross-origin and file schemes from leaking private assets
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        // Hardware Acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Bind Native AdBridge to JavaScript
        webView.addJavascriptInterface(new AdMobJavaScriptInterface(), "AndroidBridge");

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Load local game files
        webView.loadUrl("file:///android_asset/www/index.html");

        rootLayout.addView(webView);
        setContentView(rootLayout);

        // 2. Initialize Google Mobile Ads SDK
        MobileAds.initialize(this, new OnInitializationCompleteListener() {
            @Override
            public void onInitializationComplete(@NonNull InitializationStatus initializationStatus) {
                Log.d(TAG, "AdMob SDK Initialized Successfully");
                runOnUiThread(() -> {
                    setupBannerAd();
                    loadInterstitialAd();
                    loadRewardedAd();
                });
            }
        });
    }

    // ==========================================
    // GOOGLE ADMOB: BANNER ADS
    // ==========================================
    private void setupBannerAd() {
        try {
            bannerAdView = new AdView(this);
            bannerAdView.setAdUnitId(AD_UNIT_BANNER);
            bannerAdView.setAdSize(AdSize.BANNER);

            FrameLayout.LayoutParams bannerParams = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
            bannerParams.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
            bannerAdView.setLayoutParams(bannerParams);
            bannerAdView.setVisibility(View.GONE); // Controlled via Javascript

            rootLayout.addView(bannerAdView);

            AdRequest adRequest = new AdRequest.Builder().build();
            bannerAdView.loadAd(adRequest);
        } catch (Exception e) {
            Log.e(TAG, "Error setting up banner: " + e.getMessage());
        }
    }

    // ==========================================
    // GOOGLE ADMOB: INTERSTITIAL ADS
    // ==========================================
    private void loadInterstitialAd() {
        AdRequest adRequest = new AdRequest.Builder().build();
        InterstitialAd.load(this, AD_UNIT_INTERSTITIAL, adRequest, new InterstitialAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull InterstitialAd ad) {
                interstitialAd = ad;
                Log.d(TAG, "Interstitial Ad Loaded Ready");

                interstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                    @Override
                    public void onAdDismissedFullScreenContent() {
                        interstitialAd = null;
                        hideSystemUI();
                        loadInterstitialAd(); // Preload next ad
                    }

                    @Override
                    public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                        interstitialAd = null;
                        hideSystemUI();
                        loadInterstitialAd();
                    }
                });
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                interstitialAd = null;
                Log.d(TAG, "Interstitial load error: " + loadAdError.getMessage());
            }
        });
    }

    // ==========================================
    // GOOGLE ADMOB: REWARDED VIDEO ADS
    // ==========================================
    private void loadRewardedAd() {
        AdRequest adRequest = new AdRequest.Builder().build();
        RewardedAd.load(this, AD_UNIT_REWARDED, adRequest, new RewardedAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull RewardedAd ad) {
                rewardedAd = ad;
                Log.d(TAG, "Rewarded Ad Loaded Ready");

                rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                    @Override
                    public void onAdDismissedFullScreenContent() {
                        rewardedAd = null;
                        hideSystemUI();
                        loadRewardedAd(); // Preload next rewarded ad
                    }

                    @Override
                    public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                        rewardedAd = null;
                        hideSystemUI();
                        loadRewardedAd();
                    }
                });
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                rewardedAd = null;
                Log.d(TAG, "Rewarded load error: " + loadAdError.getMessage());
            }
        });
    }

    // Check if device currently has active internet connectivity
    public boolean isNetworkAvailable() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network network = cm.getActiveNetwork();
                if (network == null) return false;
                NetworkCapabilities actNw = cm.getNetworkCapabilities(network);
                return actNw != null && (actNw.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                        actNw.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                        actNw.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
            } else {
                NetworkInfo nwInfo = cm.getActiveNetworkInfo();
                return nwInfo != null && nwInfo.isConnected();
            }
        } catch (Exception e) {
            return true;
        }
    }

    // ==========================================
    // NATIVE JAVASCRIPT INTERFACE BRIDGE
    // ==========================================
    public class AdMobJavaScriptInterface {
        @JavascriptInterface
        public boolean isConnectedToInternet() {
            return isNetworkAvailable();
        }

        @JavascriptInterface
        public void showWinningAd() {
            runOnUiThread(() -> {
                if (!isNetworkAvailable()) {
                    Log.d(TAG, "Offline mode detected: Skipping winning ad.");
                    return;
                }
                if (interstitialAd != null) {
                    Log.d(TAG, "Playing post-win interstitial ad.");
                    interstitialAd.show(MainActivity.this);
                } else {
                    Log.d(TAG, "Post-win ad not cached yet, preloading for next round.");
                    loadInterstitialAd();
                }
            });
        }

        @JavascriptInterface
        public void showInterstitialAd() {
            runOnUiThread(() -> {
                if (!isNetworkAvailable()) {
                    Log.d(TAG, "Offline mode: skipping interstitial ad.");
                    return;
                }
                if (interstitialAd != null) {
                    interstitialAd.show(MainActivity.this);
                } else {
                    Log.d(TAG, "Interstitial not ready yet, preloading...");
                    loadInterstitialAd();
                }
            });
        }

        @JavascriptInterface
        public void showRewardedAd() {
            runOnUiThread(() -> {
                if (!isNetworkAvailable()) {
                    Log.d(TAG, "Offline mode: cannot load rewarded video.");
                    webView.evaluateJavascript("if(window.showAdToast) { window.showAdToast('📶 Connect to internet to watch ads!'); }", null);
                    return;
                }
                if (rewardedAd != null) {
                    rewardedAd.show(MainActivity.this, rewardItem -> {
                        int amount = rewardItem.getAmount() > 0 ? rewardItem.getAmount() : 50;
                        Log.d(TAG, "User earned reward: " + amount);
                        // Notify game in webview to credit coins
                        webView.evaluateJavascript("if(window.AdBridge) { window.AdBridge.onRewardSuccess(" + amount + "); }", null);
                    });
                } else {
                    Log.d(TAG, "Rewarded ad not loaded yet, trying reload");
                    loadRewardedAd();
                }
            });
        }

        @JavascriptInterface
        public void showBannerAd() {
            runOnUiThread(() -> {
                if (bannerAdView != null && isNetworkAvailable()) {
                    bannerAdView.setVisibility(View.VISIBLE);
                }
            });
        }

        @JavascriptInterface
        public void hideBannerAd() {
            runOnUiThread(() -> {
                if (bannerAdView != null) {
                    bannerAdView.setVisibility(View.GONE);
                }
            });
        }
    }

    private void hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            final WindowInsetsController insetsController = getWindow().getInsetsController();
            if (insetsController != null) {
                insetsController.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                insetsController.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
            );
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (bannerAdView != null) bannerAdView.resume();
        hideSystemUI();
    }

    @Override
    protected void onPause() {
        if (bannerAdView != null) bannerAdView.pause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (bannerAdView != null) bannerAdView.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
