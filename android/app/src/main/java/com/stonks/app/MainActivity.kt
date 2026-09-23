package com.stonks.app

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.WindowInsetsController
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        // Nothing OS immersive aesthetic: transparent status & navigation bar
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.parseColor("#09090b")
        window.decorView.setBackgroundColor(Color.parseColor("#09090b"))

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
            window.isStatusBarContrastEnforced = false
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.navigationBarDividerColor = Color.TRANSPARENT
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.setSystemBarsAppearance(
                0,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            )
        }

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#09090b"))
            isHapticFeedbackEnabled = true
        }
        setContentView(webView)

        // Web app handles insets via viewport-fit=cover and CSS env(safe-area-inset-*).
        // Zero padding on WebView prevents white system background under navigation bar.
        ViewCompat.setOnApplyWindowInsetsListener(webView) { v, insets ->
            v.setPadding(0, 0, 0, 0)
            insets
        }

        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        webSettings.loadsImagesAutomatically = true
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT

        // Hardened sandbox security: disable access to local file system and content providers
        webSettings.allowFileAccess = false
        webSettings.allowContentAccess = false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            webSettings.allowFileAccessFromFileURLs = false
            webSettings.allowUniversalAccessFromFileURLs = false
        }

        // Register secure native bridge for hardware-backed EncryptedSharedPreferences
        webView.addJavascriptInterface(AndroidSecurityBridge(this), "AndroidBridge")

        // Secure WebViewClient: Enforce strict HTTPS connections only
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                // Reject any unencrypted HTTP scheme navigation
                if (url.startsWith("http://")) {
                    return true
                }
                return false
            }
        }

        webView.webChromeClient = WebChromeClient()

        // Sostituisci con l'URL di deployment del tuo Stonks
        webView.loadUrl("https://stonks.app")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    /**
     * Native Android Security Bridge
     * Provides hardware-backed AES-256 GCM encrypted storage via AndroidX Security Crypto MasterKey.
     * Accessible by JavaScript only on native Android, leaving web environments completely untouched.
     */
    inner class AndroidSecurityBridge(context: Context) {
        private val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        private val encryptedPrefs = EncryptedSharedPreferences.create(
            context,
            "stonks_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )

        @JavascriptInterface
        fun getPlatform(): String {
            return "android_native"
        }

        @JavascriptInterface
        fun isNativeApp(): Boolean {
            return true
        }

        @JavascriptInterface
        fun encryptAndStore(key: String, value: String): Boolean {
            return try {
                encryptedPrefs.edit().putString(key, value).commit()
            } catch (e: Exception) {
                false
            }
        }

        @JavascriptInterface
        fun readAndDecrypt(key: String): String? {
            return try {
                encryptedPrefs.getString(key, null)
            } catch (e: Exception) {
                null
            }
        }

        @JavascriptInterface
        fun removeSecure(key: String): Boolean {
            return try {
                encryptedPrefs.edit().remove(key).commit()
            } catch (e: Exception) {
                false
            }
        }
    }
}
