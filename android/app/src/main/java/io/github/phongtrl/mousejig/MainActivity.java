package io.github.phongtrl.mousejig;

import android.app.Activity;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends Activity {
    private WebView web;
    private boolean foreground;
    private Vibrator vibrator;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        vibrator = getSystemService(Vibrator.class);
        web = new WebView(this);
        web.setBackgroundColor(0xfff7f8f3);
        setContentView(web);
        if (android.os.Build.VERSION.SDK_INT >= 35) {
            web.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assets.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true;
            }
        });
        web.addJavascriptInterface(new PowerControl(), "MousejigPower");
        web.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }

    final class PowerControl {
        @JavascriptInterface
        public boolean hasVibrator() {
            return vibrator != null && vibrator.hasVibrator();
        }

        @JavascriptInterface
        public void pulse(boolean enabled) {
            runOnUiThread(() -> {
                if (!hasVibrator()) return;
                if (enabled && foreground) vibrator.vibrate(VibrationEffect.createOneShot(350, 255));
                else vibrator.cancel();
            });
        }

        @JavascriptInterface
        public void keepAwake(boolean enabled) {
            runOnUiThread(() -> web.setKeepScreenOn(foreground && enabled));
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        foreground = true;
        web.onResume();
    }

    @Override
    protected void onPause() {
        foreground = false;
        if (vibrator != null) vibrator.cancel();
        web.setKeepScreenOn(false);
        web.evaluateJavascript("window.mousejig && window.mousejig.suspend()", null);
        web.onPause();
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.mousejig ? window.mousejig.back() : false", handled -> {
            if (!"true".equals(handled)) super.onBackPressed();
        });
    }
}
