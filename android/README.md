# Guida al Rilascio Google Play Store - Stonks (Android Production)

Questo modulo contiene l'architettura pronta per la produzione e la pubblicazione su **Google Play Store**, conforme alle direttive Google Play 2024/2025/2026.

---

## 1. Specifiche e Versionamento Play Store
- **Application ID**: `com.stonks.app`
- **compileSdk**: `35` (Android 15)
- **targetSdk**: `35` (Android 15 - Requisito Google Play)
- **minSdk**: `26` (Android 8.0 Oreo - Supporto 95%+ dispositivi, WebCrypto & Android Keystore)
- **versionCode**: `1`
- **versionName**: `"1.0.0"`

---

## 2. Sicurezza e Protezione Dati (Separazione Web / Android)
- **Crittografia Locale Hardware-Backed**: Implementata tramite `AndroidSecurityBridge` in `MainActivity.kt` con `EncryptedSharedPreferences` (algoritmi **AES-256 SIV** per le chiavi e **AES-256 GCM** per i valori, con MasterKey generata e protetta da Android Keystore).
- **Isolamento Piattaforma Web**: Sul Web (`isWebPlatform()`), l'app continua a usare in modo sincrono e immediato `localStorage`, garantendo **0ms di latenza**, compatibilità totale per Safari/Chrome desktop e iOS, e nessun rischio di corruzione dei dati esistenti.
- **Rete e Connessioni HTTPS Rigide**:
  - File `network_security_config.xml` con `cleartextTrafficPermitted="false"`.
  - `android:usesCleartextTraffic="false"` in `AndroidManifest.xml`.
  - `WebViewClient` intercetta e rifiuta categoricamente qualsiasi richiesta non HTTPS.
- **Sandbox Rinforzata**:
  - `allowFileAccess = false` e `allowContentAccess = false` per prevenire accessi o leak a livello di file system locale.
  - `allowBackup="false"` per impedire esportazioni non autorizzate di dati sensibili tramite backup cloud non cifrati.

---

## 3. Ottimizzazione e R8 / ProGuard
- **Minificazione e Offuscamento**: Abilitati in `app/build.gradle.kts` tramite `isMinifyEnabled = true` e `isShrinkResources = true`.
- **Regole R8 (`proguard-rules.pro`)**:
  - Eliminazione automatica di log di debug (`android.util.Log.v`, `d`, `i`) in release.
  - Preservazione delle interfacce `@JavascriptInterface` per il bridge sicuro.
  - Preservazione delle classi di crittografia AndroidX Security Crypto.
- **Fluidità UI (Zero UI Lag)**:
  - `android:hardwareAccelerated="true"` per il rendering fluido a 60/120Hz.
  - Gestione insets Edge-to-Edge trasparente (Nothing OS aesthetic).
  - CacheMode ottimizzato `LOAD_DEFAULT`.

---

## 4. Comandi per Compilare l'Android App Bundle (AAB)
1. **Generare la Keystore di firma (se non già presente)**:
   ```bash
   keytool -genkey -v -keystore stonks-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias stonks
   ```

2. **Compilare l'Android App Bundle (AAB) per il Play Store**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   L'artefatto per il caricamento su Google Play Console sarà generato in:
   `app/build/outputs/bundle/release/app-release.aab`

3. **Verificare o compilare un APK di test**:
   ```bash
   ./gradlew assembleRelease
   ```
