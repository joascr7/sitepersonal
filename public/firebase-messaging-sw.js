// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Suas credenciais exatas do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAhz0kZb-FCUbcWtSm3XE5nu0Q_8tlQEfE",
  authDomain: "aurafit-2c4f5.firebaseapp.com",
  projectId: "aurafit-2c4f5",
  storageBucket: "aurafit-2c4f5.firebasestorage.app",
  messagingSenderId: "749760468896",
  appId: "1:749760468896:web:f7a165c336c509235f76c5"
};

// Inicializa o Firebase no Background
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Lida com as mensagens quando o app está FECHADO ou em SEGUNDO PLANO
messaging.onBackgroundMessage(function(payload) {
  console.log('[Background] Notificação recebida: ', payload);
  
  const notificationTitle = payload.notification?.title || 'Nova Notificação';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icon.png', // Se tiver um ícone do app na pasta public, coloque o nome aqui
    badge: '/icon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});