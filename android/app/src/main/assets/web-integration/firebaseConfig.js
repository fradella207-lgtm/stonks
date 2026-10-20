import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  signOut 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Configurazione Firebase Stonks sincronizzata 1:1 con l'App Android
 * Progetto Google Cloud / Firebase: gen-lang-client-0071556773
 */
export const firebaseConfig = {
  apiKey: "AIzaSyD2_9THCLgd9EBn5TfTN_H8rR09c4b0jqY",
  authDomain: "gen-lang-client-0071556773.firebaseapp.com",
  projectId: "gen-lang-client-0071556773",
  firestoreDatabaseId: "ai-studio-gestionespese-08ea9aff-fba0-474b-a22f-690b78028957",
  storageBucket: "gen-lang-client-0071556773.firebasestorage.app",
  messagingSenderId: "293899625048",
  appId: "1:293899625048:web:stonks-web-app",
  oAuthClientId: "293899625048-e1eqcdqmj5ngn19vn0jh6a761mbe5dsf.apps.googleusercontent.com"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connessione Firestore al database dell'applicazione
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
