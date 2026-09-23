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
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        // Stile moderno: status & navigation bar trasparenti con sfondo scuro
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

        // Sandbox di sicurezza: blocco accessi a file system e content provider
        webSettings.allowFileAccess = false
        webSettings.allowContentAccess = false
        @Suppress("DEPRECATION")
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            webSettings.allowFileAccessFromFileURLs = false
            webSettings.allowUniversalAccessFromFileURLs = false
        }

        // Bridge nativo per hardware-backed EncryptedSharedPreferences (AES-256 GCM)
        webView.addJavascriptInterface(AndroidSecurityBridge(this), "AndroidBridge")

        // Inizializza WebViewAssetLoader: serve gli asset di dist su HTTPS virtuale sicuro
        assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/res/", WebViewAssetLoader.ResourcesPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                request?.url?.let { uri ->
                    val response = assetLoader.shouldInterceptRequest(uri)
                    if (response != null) return response
                }
                return super.shouldInterceptRequest(view, request)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("http://")) {
                    return true // Blocca HTTP non sicuro
                }
                return false
            }
        }

        webView.webChromeClient = WebChromeClient()

        // Caricamento sicuro offline e online tramite dominio virtuale HTTPS
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        // CORREZIONE CRITICA: Gestione corretta e moderna del tasto indietro (Back Press API)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

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
        fun getPlatform(): String = "android_native"

        @JavascriptInterface
        fun isNativeApp(): Boolean = true

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
