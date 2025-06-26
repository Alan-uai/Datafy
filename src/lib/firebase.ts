// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import getFirestore
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWLYmeq9qrjaMfAKSBpP46b_CLXMAOWtc",
  authDomain: "datafy-ed69d.firebaseapp.com",
  projectId: "datafy-ed69d",
  storageBucket: "datafy-ed69d.firebaseastorage.app",
  messagingSenderId: "990528724406",
  appId: "1:990528724406:web:c714dc4ed9291e3cb87517",
  measurementId: "G-YWT6DV5548"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in the browser environment
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup }; // Export db