// src/lib/notificationService.ts
import { supabase } from './supabaseClient';

// Declaração de tipos para compatibilidade nativa com Capacitor sem quebrar o build Web
declare global {
  interface Window {
    Capacitor?: any;
  }
}

export class NotificationService {
  private static isNative(): boolean {
    return typeof window !== 'undefined' && window.Capacitor !== undefined && window.Capacitor.Plugins !== undefined;
  }

  /**
   * Solicita permissões e registra o dispositivo para receber Push Notifications
   */
  public static async registrarDispositivo(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (this.isNative()) {
        // Fluxo Nativo para iOS e Android usando Plugins do Capacitor
        const { PushNotifications } = window.Capacitor.Plugins;

        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive === 'granted') {
          await PushNotifications.register();
          
          // Captura o token nativo gerado pelo APNS (iOS) ou FCM (Android)
          PushNotifications.addListener('registration', async (token: any) => {
            const plataforma = window.Capacitor.getPlatform(); // 'ios' | 'android'
            await this.salvarTokenNoBanco(user.id, token.value, plataforma);
          });

          // Ouvinte para quando o app está aberto em primeiro plano (Foreground)
          PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
            console.log('Push recebido em primeiro plano:', notification);
            window.dispatchEvent(new Event('atualizar_badges_global'));
          });
        }
      } else {
        // Fluxo Web / PWA usando Firebase Cloud Messaging nativo do navegador
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const fcmVapidKey = "BInbrpAdfv-lHOx4cUXHXCX1xBHIn1hSb8z0mIIgeJ8gIFOdFzXLZRj7wp3ONqQKt-hKWSwKWeWaw6ZQrYLvMuA"; 
          
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            // AQUI ESTÁ A CORREÇÃO: Forçando o cast 'as any' para ignorar o conflito de ArrayBufferView
            applicationServerKey: this.urlBase64ToUint8Array(fcmVapidKey) as any
          });

          if (subscription) {
            const tokenWeb = btoa(JSON.stringify(subscription));
            await this.salvarTokenNoBanco(user.id, tokenWeb, 'web');
          }
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar registro de notificações:', error);
    }
  }

  /**
   * Salva ou atualiza o token de forma limpa no Supabase
   */
  private static async salvarTokenNoBanco(userId: string, token: string, plataforma: 'ios' | 'android' | 'web'): Promise<void> {
    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token: token,
        plataforma: plataforma,
        atualizado_em: new Date().toISOString()
      },
      { onConflict: 'token' }
    );
  }

  /**
   * Auxiliar para conversão de chaves públicas VAPID na Web
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}