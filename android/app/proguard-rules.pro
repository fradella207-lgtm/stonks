# R8 / ProGuard rules for Stonks Android Release Build
# Optimizes bytecode without interfering with web assets or Vite scripts

-repackageclasses
-allowaccessmodification

# Strip Android debug and verbose logs in production release
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# Preserve Android WebKit and JavaScript Interface methods for secure native bridge
-keepattributes JavascriptInterface,EnclosingMethod,InnerClasses,Signature,*Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep native Bridge classes intact
-keep class com.stonks.app.** { *; }

# Keep AndroidX WebKit AssetLoader and Security Crypto components
-keep class androidx.webkit.** { *; }
-keep interface androidx.webkit.** { *; }
-keep class androidx.security.crypto.** { *; }

# Suppress harmless warnings for non-critical classes
-dontwarn androidx.webkit.**
-dontwarn java.lang.invoke.**
-dontwarn javax.annotation.**
