// /public/firebase-messaging-sw.js
// Scripts for Firebase v9+
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

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

// This is required to receive notifications in the background.
const messaging = firebase.messaging();

// Optional: You can add a background message handler here if needed
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // Optional: path to an icon
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
