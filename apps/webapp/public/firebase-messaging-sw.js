// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
// Replace 10.13.2 with latest version of the Firebase JS SDK.
importScripts(
  "https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js",
);

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyCK41ua-daiBaquE1csQQfQlL3NVFC5GRo",
  authDomain: "dudy-tpp.firebaseapp.com",
  projectId: "dudy-tpp",
  storageBucket: "dudy-tpp.firebasestorage.app",
  messagingSenderId: "158676318007",
  appId: "1:158676318007:web:bcf6b105e36c42d380ccb2",
  measurementId: "G-QZJBTZB7D6",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
