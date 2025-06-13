
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Critical configuration check
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
  // Throw an error to prevent the app from starting with a critically misconfigured Firebase
  throw new Error("Firebase configuration is missing critical values. Check server logs.");
}

const firebaseConfig = {
  apiKey: firebaseConfigValues.apiKey,
  authDomain: firebaseConfigValues.authDomain,
  projectId: firebaseConfigValues.projectId,
  storageBucket: firebaseConfigValues.storageBucket,
  messagingSenderId: firebaseConfigValues.messagingSenderId,
  appId: firebaseConfigValues.appId,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    console.log('[Firebase Debug] Firebase app initialized on the client.');
  } else {
    console.log('[Firebase Debug] Firebase app initialized on the server.');
  }
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, GoogleAuthProvider, signInWithPopup };
