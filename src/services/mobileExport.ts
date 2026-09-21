/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';

export async function generateMobileAppZip(appUrl: string): Promise<Blob> {
  const zip = new JSZip();

  // Root gradle settings
  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "stonks"
include(":app")
`
  );

  // Root build.gradle.kts
  zip.file(
    'build.gradle.kts',
    `plugins {
    id("com.android.application") version "8.7.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
}
`
  );

  // gradle.properties
  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`
  );

  // app/build.gradle.kts
  zip.file(
    'app/build.gradle.kts',
    `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.stonks.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.stonks.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
}
`
  );

  // AndroidManifest.xml
  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.Stonks"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`
  );

  // MainActivity.kt with status bar safe-area edge-to-edge support & photo capture
  zip.file(
    'app/src/main/java/com/stonks/app/MainActivity.kt',
    `package com.stonks.app

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val data = result.data
        var results: Array<Uri>? = null
        if (result.resultCode == RESULT_OK && data != null) {
            val dataString = data.dataString
            if (dataString != null) {
                results = arrayOf(Uri.parse(dataString))
            } else if (data.clipData != null) {
                val count = data.clipData!!.itemCount
                results = Array(count) { i -> data.clipData!!.getItemAt(i).uri }
            }
        }
        filePathCallback?.onReceiveValue(results)
        filePathCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Configurazione Edge-to-Edge: non intralcia la barra di stato e la barra di navigazione
        WindowCompat.setDecorFitsSystemWindows(window, false)

        webView = WebView(this)
        setContentView(webView)

        // Insets Safe-Area: aggiunge padding dinamico rispettando notch, fotocamera punch-hole e barra di sistema
        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
            userAgentString = userAgentString + " StonksApp/1.0 (Android)"
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                    return false // Apri all'interno dell'app
                }
                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    true
                } catch (e: Exception) {
                    false
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "image/*"
                }
                fileChooserLauncher.launch(intent)
                return true
            }
        }

        // Gestione tasto Indietro
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        // Caricamento URL dell'applicazione
        val targetUrl = "${appUrl}"
        webView.loadUrl(targetUrl)
    }
}
`
  );

  // Strings.xml
  zip.file(
    'app/src/main/res/values/strings.xml',
    `<resources>
    <string name="app_name">stonks</string>
</resources>
`
  );

  // Themes.xml (Night & Day with transparent system bars)
  zip.file(
    'app/src/main/res/values/themes.xml',
    `<resources>
    <style name="Theme.Stonks" parent="Theme.Material3.DayNight.NoActionBar">
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@android:color/transparent</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>
</resources>
`
  );

  // iOS Setup Guide & Swift WKWebView Controller
  zip.file(
    'ios/ViewController.swift',
    `//
//  ViewController.swift
//  stonks iOS Native Wrapper
//

import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {

    var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.scrollView.contentInsetAdjustmentBehavior = .always
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 8/255, green: 8/255, blue: 10/255, alpha: 1.0)

        view.addSubview(webView)

        // Safe Area Constraints: Protezione automatica dalla barra di stato, Dynamic Island e Notch
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor)
        ])

        if let url = URL(string: "${appUrl}") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
}
`
  );

  // Apple & PWA instructions
  zip.file(
    'ios/README_APPLE_INSTALL.md',
    `# stonks su Dispositivi Apple (iPhone & iPad)

## Metodo 1: Installazione Diretta PWA (Consigliato, 10 secondi)
1. Apri **Safari** sul tuo iPhone o iPad.
2. Vai all'indirizzo web dell'app: \`${appUrl}\`.
3. Tocca il tasto **Condividi** (l'icona del quadrato con la freccia verso l'alto al centro in basso).
4. Scorri verso il basso e tocca **"Aggiungi alla schermata Home"**.
5. Conferma con **"Aggiungi"** in alto a destra.
6. L'app verrà installata come applicazione nativa a schermo intero, isolata dal browser, con l'icona sul tuo display.
7. **Barra di Stato & Safe Area**: L'app ha già configurato \`viewport-fit=cover\` e \`safe-area-inset-top\` per non toccare la Dynamic Island o la fotocamera Notch.

---

## Metodo 2: Progetto Xcode (App Nativa iOS)
- Trovi il codice \`ViewController.swift\` in questa cartella.
- Crea un nuovo progetto iOS in Xcode (iOS App con Storyboard o UIKit).
- Sostituisci il file \`ViewController.swift\` con quello fornito.
- Esegui sul simulatore o sul tuo dispositivo iPhone collegato.
`
  );

  // Android Studio Instructions
  zip.file(
    'README_ANDROID_STUDIO.md',
    `# stonks - Progetto Android Studio Pronto all'Uso

Questo archivio contiene l'intera struttura di progetto pronta per Android Studio con supporto Safe Area per la barra di stato.

## Come Aprire in Android Studio:
1. Estrai questo archivio ZIP sul tuo computer.
2. Apri **Android Studio** (Koala, Ladybug o successivo).
3. Seleziona **"Open"** o **"File > Open..."** e seleziona la cartella estratta.
4. Android Studio eseguirà automaticamente la sincronizzazione Gradle (*Sync Project with Gradle Files*).
5. Collega il tuo smartphone Android via cavo USB (con *Debug USB* attivo) o avvia un emulatore Android.
6. Clicca sul pulsante verde **"Run" (Play)** in alto per installare e avviare **stonks** sul tuo dispositivo.

## Caratteristiche Integrate:
- **Barra di stato protetta**: Utilizza \`WindowCompat.setDecorFitsSystemWindows(window, false)\` e \`ViewCompat.setOnApplyWindowInsetsListener\` per non coprire mai la fotocamera o l'orologio.
- **Supporto Fotocamera & Scontrini**: Implementa \`onShowFileChooser\` per consentire lo scatto e il caricamento delle ricevute.
- **Target SDK 35 (Android 15)** e compatibile fino ad Android 7.0 (API 24).
- **Gestione Indietro Nativa**: Tasto back gestito direttamente nella cronologia.
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
