import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWLYmeq9qrjaMfAKSBpP46b_CLXMAOWtc",
  authDomain: "datafy-ed69d.firebaseapp.com",
  projectId: "datafy-ed69d",
  storageBucket: "datafy-ed69d.appspot.com",
  messagingSenderId: "990528724406",
  appId: "1:990528724406:web:d355cad8bb71f613b87517",
  measurementId: "G-PF7V3GF5Q5"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export { app, auth, db, analytics, signOut };
