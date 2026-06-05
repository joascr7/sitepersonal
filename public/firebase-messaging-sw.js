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
  console.log('[Background] Notificação recebida: ', payload);
  
  // 1. Extraímos os dados brutos da notificação
  const notificationTitle = payload.notification?.title || 'AuraFit';
  const notificationBody = payload.notification?.body || '';

  // 2. Configurações de exibição
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png', // Certifique-se que este ficheiro existe na pasta public
    badge: '/icon-192.png',
    data: {
      url: payload.fcmOptions?.link || payload.data?.url || '/'
    }
  };

  // 3. Exibição limpa
  // O sistema operativo já exibirá "AuraFit" no cabeçalho.
  // Ao passar apenas o title e o body, evitamos a duplicidade.
  return self.registration.showNotification(notificationTitle, notificationOptions);
});