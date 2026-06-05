importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAhz0kZb-FCUbcWtSm3XE5nu0Q_8tlQEfE",
  authDomain: "aurafit-2c4f5.firebaseapp.com",
  projectId: "aurafit-2c4f5",
  storageBucket: "aurafit-2c4f5.firebasestorage.app",
  messagingSenderId: "749760468896",
  appId: "1:749760468896:web:f7a165c336c509235f76c5"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  // Agora lemos do objeto 'data' e não do 'notification'
  const data = payload.data || {};
  const notificationTitle = data.title || 'AuraFit';
  const notificationOptions = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});