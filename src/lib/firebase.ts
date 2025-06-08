
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // Adicionado GoogleAuthProvider e signInWithPopup
// import { getFirestore, type Firestore } from "firebase/firestore"; // Descomente quando for usar Firestore

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
// const db: Firestore = getFirestore(app); // Descomente quando for usar Firestore

// Exportar o provedor e a função para uso na página de login
export { app, auth, GoogleAuthProvider, signInWithPopup /*, db*/ };

