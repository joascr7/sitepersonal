import { supabase } from './supabaseClient';

// Configuração movida para uma constante isolada, sem inicializar nada ainda
const firebaseConfig = {
  apiKey: "AIzaSyAhz0kZb-FCUbcWtSm3XE5nu0Q_8tlQEfE",
  authDomain: "aurafit-2c4f5.firebaseapp.com",
  projectId: "aurafit-2c4f5",
  storageBucket: "aurafit-2c4f5.firebasestorage.app",
  messagingSenderId: "749760468896",
  appId: "1:749760468896:web:f7a165c336c509235f76c5",
  measurementId: "G-H6WKDGXZNE"
};

export class NotificationService {
  private static isNative(): boolean {
    return typeof window !== 'undefined' && (window as any).Capacitor !== undefined;
  }

  // Função interna para inicializar o Firebase apenas quando necessário
  private static async getFirebaseMessaging() {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");
    
    // Verifica se já não foi inicializado para evitar erros
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    return { messaging: getMessaging(app), getToken };
  }

  public static async registrarDispositivo(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (this.isNative()) {
        const { PushNotifications } = (window as any).Capacitor.Plugins;
        await PushNotifications.requestPermissions();
        await PushNotifications.register();
        PushNotifications.addListener('registration', async (token: any) => {
          await this.salvarTokenNoBanco(user.id, token.value, 'android');
        });
      } else {
        // Fluxo WEB com inicialização segura
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const { messaging, getToken } = await this.getFirebaseMessaging();
          
          const fcmToken = await getToken(messaging, { 
            vapidKey: "BInbrpAdfv-lHOx4cUXHXCX1xBHIn1hSb8z0mIIgeJ8gIFOdFzXLZRj7wp3ONqQKt-hKWSwKWeWaw6ZQrYLvMuA" 
          });
          
          if (fcmToken) {
            await this.salvarTokenNoBanco(user.id, fcmToken, 'web');
            console.log('✅ Token FCM gerado e enviado ao Supabase!');
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro no registo:', error);
    }
  }

  private static async salvarTokenNoBanco(userId: string, token: string, plataforma: string): Promise<void> {
    await supabase.from('push_tokens').upsert({
      user_id: userId,
      token: token,
      plataforma: plataforma,
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'token' });
  }
}