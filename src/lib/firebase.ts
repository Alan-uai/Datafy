
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// --- BEGIN ENHANCED DEBUG LOGGING ---
const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("[Firebase Config Debug - Module Load/Server-Side]");
console.table(firebaseConfigValues);

if (typeof window !== 'undefined') { // Client-side logging
  console.log('[Firebase Config Debug - Client-Side]');
  console.table(firebaseConfigValues);
}

if (!firebaseConfigValues.apiKey || !firebaseConfigValues.projectId) {
  const errorMessage =
    "!!! CRITICAL FIREBASE CONFIG ERROR !!!\n" +
    "NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing or undefined.\n" +
    "Ensure your .env.local file in the ROOT of your project contains all Firebase configuration variables.\n" +
    "Example .env.local content:\n" +
    "NEXT_PUBLIC_FIREBASE_API_KEY=\"YOUR_API_KEY\"\n" +
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=\"YOUR_AUTH_DOMAIN\"\n" +
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID=\"YOUR_PROJECT_ID\"\n" +
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=\"YOUR_STORAGE_BUCKET\"\n" +
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=\"YOUR_MESSAGING_SENDER_ID\"\n" +
    "NEXT_PUBLIC_FIREBASE_APP_ID=\"YOUR_APP_ID\"\n" +
    "After creating or updating .env.local, YOU MUST RESTART your Next.js development server.";

  console.error(errorMessage);
  // Potentially throw an error here or handle it gracefully depending on desired app behavior
  // For now, we'll let initialization proceed so other logs can be seen, but the app will likely fail.
}
// --- END ENHANCED DEBUG LOGGING ---

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, GoogleAuthProvider, signInWithPopup };
