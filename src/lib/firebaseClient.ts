// src/lib/firebaseClient.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAhz0kZb-FCUbcWtSm3XE5nu0Q_8tlQEfE",
  authDomain: "aurafit-2c4f5.firebaseapp.com",
  projectId: "aurafit-2c4f5",
  storageBucket: "aurafit-2c4f5.firebasestorage.app",
  messagingSenderId: "749760468896",
  appId: "1:749760468896:web:f7a165c336c509235f76c5"
};

const app = initializeApp(firebaseConfig);

// Só inicializa o messaging se estiver no navegador e o navegador suportar Push
let messaging: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

export { app, messaging, getToken, onMessage };