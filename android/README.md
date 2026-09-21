# Progetto Android Studio per Stonks (App FinTech Minimal)

Questo modulo contiene la documentazione e le indicazioni architetturali per generare ed eseguire **Stonks** come applicazione nativa Android su Android Studio.

## Struttura del Progetto
- `settings.gradle.kts`: Configurazione repository Maven Central e Google
- `build.gradle.kts`: Gradle root con plugin Android e Kotlin
- `app/build.gradle.kts`: Modulo Android con dipendenze AndroidX, WebKit e supporto `WindowInsets`
- `app/src/main/AndroidManifest.xml`: Configurazione permessi Internet, stato rete e orientamento
- `app/src/main/java/com/stonks/app/MainActivity.kt`: Activity moderna con gestione edge-to-edge e safe-area
- `app/src/main/res/values/themes.xml`: Tema Nothing OS con status bar dinamica
