# Stonks - Nodo di Collegamento & Integrazione Firebase (Web ↔ Android)

Questo pacchetto garantisce la sincronizzazione in tempo reale bidirezionale e l'autenticazione completa tra la versione Web e l'applicazione Android di **Stonks**, condividendo lo stesso identico progetto Firebase.

---

## 1. Coordinate Progetto Firebase Condiviso

- **Progetto GCP / Firebase**: `gen-lang-client-0071556773`
- **Web Client App ID**: `1:293899625048:web:stonks-web-app`
- **OAuth Web Client ID (Google Sign-In)**: `293899625048-e1eqcdqmj5ngn19vn0jh6a761mbe5dsf.apps.googleusercontent.com`
- **Firestore Database ID**: `ai-studio-gestionespese-08ea9aff-fba0-474b-a22f-690b78028957`
- **Storage Bucket**: `gen-lang-client-0071556773.firebasestorage.app`
- **Messaging Sender ID**: `293899625048`

---

## 2. Modello Dati e Struttura Firestore

### A. Profilo Utente: `users/{userId}`
- `userId`: string (ID univoco FirebaseAuth)
- `email`: string
- `displayName`: string
- `photoUrl`: string
- `budgetLimit`: number (predefinito 500.0)
- `themeMode`: "SYSTEM" | "LIGHT" | "DARK"
- `appLanguage`: "IT" | "EN" | "ES" | "DE" | "FR"
- `isEmailVerified`: boolean
- `createdAt` / `updatedAt`: serverTimestamp()

### B. Transazioni: `users/{userId}/transactions/{transactionId}`
- `id`: string (coincide con `transactionId`)
- `userId`: string
- `title`: string
- `amount`: number (valore >= 0.0)
- `type`: "EXPENSE" | "INCOME" (maiuscolo)
- `category`: string
- `note`: string
- `isRecurring`: boolean
- `date`: string ("YYYY-MM-DD")
- `timestamp`: Firestore Timestamp
- `createdAt` / `updatedAt`: serverTimestamp()

---

## 3. Servizi Disponibili

- **`firebaseConfig.js`**: Inizializzazione Firebase App, Auth con GoogleProvider e Firestore Database dedicato.
- **`authService.js`**:
  - `loginWithGoogle()`: Accesso tramite account Google con salvataggio automatico del profilo in `users/{userId}`.
  - `loginWithEmail(email, password)`: Accesso tramite email e password.
  - `registerWithEmail(email, password, displayName)`: Creazione account, invio email di verifica e salvataggio profilo su Firestore.
  - `resetPassword(email)`: Invio email di reimpostazione password.
  - `logoutUser()`: Disconnessione sicura.
  - `onAuthChange(callback)`: Listener reattivo dello stato di autenticazione.
- **`firestoreService.js`**:
  - `subscribeToTransactions(callback)`: Sincronizzazione in tempo reale con listener `onSnapshot`.
  - `saveTransaction(...)`: Inserimento o modifica transazione.
  - `deleteTransaction(id)`: Rimozione transazione.
