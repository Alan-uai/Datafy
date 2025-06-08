
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // Adicionado GoogleAuthProvider e signInWithPopup
// import { getFirestore, type Firestore } from "firebase/firestore"; // Descomente quando for usar Firestore

// Log immediately at module scope to catch SSR and client-side issues
const apiKeyFromEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
console.log('[Firebase Init Debug] Type of NEXT_PUBLIC_FIREBASE_API_KEY from process.env:', typeof apiKeyFromEnv);
if (typeof apiKeyFromEnv === 'string') {
  console.log('[Firebase Init Debug] Length of NEXT_PUBLIC_FIREBASE_API_KEY from process.env:', apiKeyFromEnv.length);
} else {
  console.warn('[Firebase Init Debug] NEXT_PUBLIC_FIREBASE_API_KEY from process.env is undefined or not a string.');
}

// =================================================================================
// TEMPORARY DEBUGGING STEP: Hardcoding Firebase config
// IMPORTANT: This is NOT for production. This is to isolate if the issue is with
// the credential values themselves or with the environment variable loading.
// Revert to using process.env variables once the issue is understood.
// =================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAfBw4JG-wsnX4cmmwMi9XtNPKoU62umO8",
  authDomain: "dashify-gxfvj.firebaseapp.com",
  projectId: "dashify-gxfvj",
  storageBucket: "dashify-gxfvj.firebasestorage.app",
  messagingSenderId: "371540094385",
  appId: "1:371540094385:web:f8802468597a1e37b7e190"
};

console.log('[Firebase Init Debug] HARDCODED apiKey being used:', firebaseConfig.apiKey);
console.log('[Firebase Init Debug] HARDCODED projectId being used:', firebaseConfig.projectId);
// =================================================================================

// This check was originally for process.env.NEXT_PUBLIC_FIREBASE_API_KEY
// Now it effectively checks the hardcoded key.
if (!firebaseConfig.apiKey) {
  console.error(
    "!!! FIREBASE API KEY IS MISSING in HARDCODED firebaseConfig !!!\n" +
    "This should not happen if the config object above is correct.\n" +
    "Please ensure you have a .env.local file in the ROOT of your project with the correct Firebase configuration for long-term use.\n" +
    "Example .env.local content:\n" +
    "NEXT_PUBLIC_FIREBASE_API_KEY=\"YOUR_API_KEY\"\n" +
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=\"YOUR_AUTH_DOMAIN\"\n" +
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID=\"YOUR_PROJECT_ID\"\n" +
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=\"YOUR_STORAGE_BUCKET\"\n" +
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=\"YOUR_MESSAGING_SENDER_ID\"\n" +
    "NEXT_PUBLIC_FIREBASE_APP_ID=\"YOUR_APP_ID\"\n" +
    "After creating or updating .env.local, YOU MUST RESTART your Next.js development server (stop and start `npm run dev`)."
  );
}

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig); // Using the hardcoded config
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
// const db: Firestore = getFirestore(app); // Descomente quando for usar Firestore

// Exportar o provedor e a função para uso na página de login
export { app, auth, GoogleAuthProvider, signInWithPopup /*, db*/ };
