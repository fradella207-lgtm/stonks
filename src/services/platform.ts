/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Platform Detection & Runtime Environment Isolation
 *
 * Guarantees that Android optimizations and secure bridges are activated ONLY
 * when running inside the native Android container, leaving web desktop, Safari,
 * and mobile browsers 100% untouched, reactive, and fluid.
 */

export interface AndroidNativeBridge {
  getPlatform?: () => string;
  isNativeApp?: () => boolean;
  encryptAndStore?: (key: string, value: string) => boolean;
  readAndDecrypt?: (key: string) => string | null;
  removeSecure?: (key: string) => boolean;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidNativeBridge;
  }
}

/**
 * Checks whether the current runtime is inside the native Android App wrapper
 */
export function isAndroidNative(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.AndroidBridge &&
    typeof window.AndroidBridge.getPlatform === 'function' &&
    window.AndroidBridge.getPlatform() === 'android_native'
  );
}

/**
 * Checks if the platform is standard Web (Desktop browser, iOS Safari, Android Chrome, etc.)
 */
export function isWebPlatform(): boolean {
  return !isAndroidNative();
}
