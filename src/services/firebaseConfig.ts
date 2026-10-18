/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FirebaseConfigObject {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

export const defaultFirebaseConfig: FirebaseConfigObject = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0071556773",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:293899625048:web:7e08b7d695733cb10d202d",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDmOdlIZY74kq2hXgKkWU3QVRL4MbqyWig",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0071556773.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-gestionespese-08ea9aff-fba0-474b-a22f-690b78028957",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0071556773.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "293899625048",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || "293899625048-e1eqcdqmj5ngn19vn0jh6a761mbe5dsf.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

export function getActiveFirebaseConfig(): FirebaseConfigObject {
  try {
    const custom = localStorage.getItem('stonks_custom_firebase_config');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.projectId && parsed.apiKey && parsed.appId) {
        return {
          ...defaultFirebaseConfig,
          ...parsed,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse custom firebase config:', e);
  }
  return defaultFirebaseConfig;
}

export function saveCustomFirebaseConfig(config: Partial<FirebaseConfigObject>): void {
  try {
    const current = getActiveFirebaseConfig();
    const updated = { ...current, ...config };
    localStorage.setItem('stonks_custom_firebase_config', JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save custom firebase config:', e);
  }
}

export function resetFirebaseConfigToDefault(): void {
  try {
    localStorage.removeItem('stonks_custom_firebase_config');
  } catch (e) {}
}

export function parseFirebaseConfigSnippet(snippet: string): Partial<FirebaseConfigObject> {
  const result: Partial<FirebaseConfigObject> = {};
  
  // Extract key-value pairs from JS object or JSON text
  const extract = (key: string) => {
    const match = snippet.match(new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i'));
    return match ? match[1] : undefined;
  };

  const apiKey = extract('apiKey');
  const authDomain = extract('authDomain');
  const projectId = extract('projectId');
  const storageBucket = extract('storageBucket');
  const messagingSenderId = extract('messagingSenderId');
  const appId = extract('appId');
  const measurementId = extract('measurementId');
  const firestoreDatabaseId = extract('firestoreDatabaseId') || extract('databaseId');

  if (apiKey) result.apiKey = apiKey;
  if (authDomain) result.authDomain = authDomain;
  if (projectId) result.projectId = projectId;
  if (storageBucket) result.storageBucket = storageBucket;
  if (messagingSenderId) result.messagingSenderId = messagingSenderId;
  if (appId) result.appId = appId;
  if (measurementId) result.measurementId = measurementId;
  if (firestoreDatabaseId) result.firestoreDatabaseId = firestoreDatabaseId;

  return result;
}

export const firebaseConfig = getActiveFirebaseConfig();

