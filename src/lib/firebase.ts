
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore"; // Descomentado

// Log immediately at module scope to catch SSR and client-side issues
const apiKeyFromEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (typeof window !== 'undefined') { // Client-side logging
  console.log('[Firebase Init Debug Client] Type of NEXT_PUBLIC_FIREBASE_API_KEY from process.env:', typeof apiKeyFromEnv);
  if (typeof apiKeyFromEnv === 'string') {
    console.log('[Firebase Init Debug Client] Length of NEXT_PUBLIC_FIREBASE_API_KEY from process.env:', apiKeyFromEnv.length);
  } else {
    console.warn('[Firebase Init Debug Client] NEXT_PUBLIC_FIREBASE_API_KEY from process.env is undefined or not a string.');
  }
}


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  const errorMessage =
    "!!! FIREBASE API KEY IS MISSING !!!\n" +
    "NEXT_PUBLIC_FIREBASE_API_KEY is not set in your environment variables.\n" +
    "Please ensure you have a .env.local file in the ROOT of your project with the correct Firebase configuration.\n" +
    "Example .env.local content:\n" +
    "NEXT_PUBLIC_FIREBASE_API_KEY=\"YOUR_API_KEY\"\n" +
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=\"YOUR_AUTH_DOMAIN\"\n" +
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID=\"YOUR_PROJECT_ID\"\n" +
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=\"YOUR_STORAGE_BUCKET\"\n" +
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=\"YOUR_MESSAGING_SENDER_ID\"\n" +
    "NEXT_PUBLIC_FIREBASE_APP_ID=\"YOUR_APP_ID\"\n" +
    "After creating or updating .env.local, YOU MUST RESTART your Next.js development server (stop and start `npm run dev`).";

  if (typeof window !== 'undefined') {
    console.error("[Firebase Init Debug Client]", errorMessage);
  } else {
    console.error("[Firebase Init Debug Server]", errorMessage);
  }
}


let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app); // Inicializado Firestore

export { app, auth, db, GoogleAuthProvider, signInWithPopup };
