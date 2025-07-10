// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWLYmeq9qrjaMfAKSBpP46b_CLXMAOWtc",
  authDomain: "datafy-ed69d.firebaseapp.com",
  projectId: "datafy-ed69d",
  storageBucket: "datafy-ed69d.appspot.com",
  messagingSenderId: "990528724406",
  appId: "1:990528724406:web:d355cad8bb71f613b87517",
  measurementId: "G-PF7V3GF5Q5"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export { app, analytics };
