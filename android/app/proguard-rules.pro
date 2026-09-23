# R8 / ProGuard rules for Stonks Android Release Build
# Ensures high performance, lightweight apk/aab, and code obfuscation

# Optimization settings
-repackageclasses
-allowaccessmodification

# Strip Android debug and verbose logs in production release
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# Keep Android WebKit and JavaScript Interface methods for secure native bridge
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep native Bridge classes
-keep class com.stonks.app.** { *; }

# Keep AndroidX Security Crypto components
-keep class androidx.security.crypto.** { *; }

# Keep Kotlin Coroutines and reflection safe
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-dontwarn java.lang.invoke.**
-dontwarn javax.annotation.**
