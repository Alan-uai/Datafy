
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // Adicionado GoogleAuthProvider e signInWithPopup
// import { getFirestore, type Firestore } from "firebase/firestore"; // Descomente quando for usar Firestore

// Log immediately at module scope to catch SSR and client-side issues
const apiKeyFromEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
console.log('[Firebase Init Debug] Type of NEXT_PUBLIC_FIREBASE_API_KEY:', typeof apiKeyFromEnv);
if (typeof apiKeyFromEnv === 'string') {
  console.log('[Firebase Init Debug] Length of NEXT_PUBLIC_FIREBASE_API_KEY:', apiKeyFromEnv.length);
  // For security, avoid logging the full key. Log first few chars if truly needed for debugging.
  // console.log('[Firebase Init Debug] NEXT_PUBLIC_FIREBASE_API_KEY starts with:', apiKeyFromEnv.substring(0, 5) + "...");
} else {
  console.warn('[Firebase Init Debug] NEXT_PUBLIC_FIREBASE_API_KEY is undefined or not a string.');
}

const firebaseConfig = {
  apiKey: apiKeyFromEnv, // Use the variable captured at module scope
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error(
    "!!! FIREBASE API KEY IS MISSING in firebaseConfig !!!\n" +
    "This means NEXT_PUBLIC_FIREBASE_API_KEY was likely undefined or not a string when read from process.env.\n" +
    "Please ensure you have a .env.local file in the ROOT of your project with the correct Firebase configuration.\n" +
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
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
// const db: Firestore = getFirestore(app); // Descomente quando for usar Firestore

// Exportar o provedor e a função para uso na página de login
export { app, auth, GoogleAuthProvider, signInWithPopup /*, db*/ };
