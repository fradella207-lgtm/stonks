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
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:293899625048:web:stonks-web-app",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD2_9THCLgd9EBn5TfTN_H8rR09c4b0jqY",
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
      if (parsed.projectId === defaultFirebaseConfig.projectId) {
        return {
          ...defaultFirebaseConfig,
          ...parsed,
        };
      } else {
        localStorage.removeItem('stonks_custom_firebase_config');
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
  
  // Try parsing as google-services.json first
  try {
    const json = JSON.parse(snippet);
    if (json.project_info) {
      // It's a google-services.json from Android!
      const projId = json.project_info.project_id;
      const projNumber = json.project_info.project_number;
      const bucket = json.project_info.storage_bucket;
      const currentKey = json.client?.[0]?.api_key?.[0]?.current_key;
      const mobilesdkAppId = json.client?.[0]?.client_info?.mobilesdk_app_id;
      const oauthClient = json.client?.[0]?.oauth_client?.[0]?.client_id;

      if (projId) result.projectId = projId;
      if (currentKey) result.apiKey = currentKey;
      if (mobilesdkAppId) result.appId = mobilesdkAppId;
      if (bucket) result.storageBucket = bucket;
      if (projNumber) result.messagingSenderId = projNumber;
      if (projId) result.authDomain = `${projId}.firebaseapp.com`;
      if (oauthClient) result.oAuthClientId = oauthClient;

      return result;
    }
  } catch {
    // Not valid JSON, proceed to regex extraction
  }

  // Extract key-value pairs from JS object or JSON text
  const extract = (key: string) => {
    const match = snippet.match(new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i'));
    return match ? match[1] : undefined;
  };

  const apiKey = extract('apiKey') || extract('api_key') || extract('current_key');
  const authDomain = extract('authDomain') || extract('auth_domain');
  const projectId = extract('projectId') || extract('project_id');
  const storageBucket = extract('storageBucket') || extract('storage_bucket');
  const messagingSenderId = extract('messagingSenderId') || extract('project_number');
  const appId = extract('appId') || extract('app_id') || extract('mobilesdk_app_id');
  const measurementId = extract('measurementId');
  const firestoreDatabaseId = extract('firestoreDatabaseId') || extract('databaseId') || extract('database_id');

  if (apiKey) result.apiKey = apiKey;
  if (authDomain) result.authDomain = authDomain;
  if (projectId) {
    result.projectId = projectId;
    if (!result.authDomain) result.authDomain = `${projectId}.firebaseapp.com`;
    if (!result.storageBucket) result.storageBucket = `${projectId}.firebasestorage.app`;
  }
  if (storageBucket) result.storageBucket = storageBucket;
  if (messagingSenderId) result.messagingSenderId = messagingSenderId;
  if (appId) result.appId = appId;
  if (measurementId) result.measurementId = measurementId;
  if (firestoreDatabaseId) result.firestoreDatabaseId = firestoreDatabaseId;

  return result;
}

export const firebaseConfig = getActiveFirebaseConfig();

