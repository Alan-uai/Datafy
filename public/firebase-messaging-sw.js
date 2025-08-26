// DO NOT USE 'import' statements in this file. It's a service worker.
// This script will be executed in a separate thread by the browser.

// Scripts for Firebase
self.importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
self.importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker
// Pass in the messagingSenderId from your project credentials.
const firebaseConfig = {
  apiKey: "AIzaSyBWLYmeq9qrjaMfAKSBpP46b_CLXMAOWtc",
  authDomain: "datafy-ed69d.firebaseapp.com",
  projectId: "datafy-ed69d",
  storageBucket: "datafy-ed69d.appspot.com",
  messagingSenderId: "990528724406",
  appId: "1:990528724406:web:d355cad8bb71f613b87517",
  measurementId: "G-PF7V3GF5Q5"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png' // Make sure you have an icon in your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
