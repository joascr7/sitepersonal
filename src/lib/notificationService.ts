// src/lib/notificationService.ts
import { supabase } from './supabaseClient';

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
   * Solicita permissões e regista o dispositivo para receber Push Notifications
   */
  public static async registrarDispositivo(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Nenhum utilizador logado para registar notificações.');
        return;
      }

      if (this.isNative()) {
        // ━━━━━━━━━━ FLUXO NATIVO (CAPACITOR) ━━━━━━━━━━
        const { PushNotifications } = window.Capacitor.Plugins;

        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive === 'granted') {
          await PushNotifications.register();
          
          PushNotifications.addListener('registration', async (token: any) => {
            const plataforma = window.Capacitor.getPlatform();
            await this.salvarTokenNoBanco(user.id, token.value, plataforma);
          });
        }
      } else {
        // ━━━━━━━━━━ FLUXO WEB / PWA (FIREBASE) ━━━━━━━━━━
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          
          // 1. Força a abertura da janela de permissão do navegador
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            const fcmVapidKey = "BInbrpAdfv-lHOx4cUXHXCX1xBHIn1hSb8z0mIIgeJ8gIFOdFzXLZRj7wp3ONqQKt-hKWSwKWeWaw6ZQrYLvMuA"; 
            
            // 2. ATENÇÃO: Regista explicitamente o Service Worker para evitar o congelamento
            console.log('A registar Service Worker do Firebase...');
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            
            // 3. Aguarda ele ficar pronto
            const registration = await navigator.serviceWorker.ready;

            // 4. Cria a assinatura push com a chave VAPID
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: this.urlBase64ToUint8Array(fcmVapidKey) as any
            });

            if (subscription) {
              // Converte o objeto de subscrição para uma string segura (Base64) para salvar como Token
              const tokenWeb = btoa(JSON.stringify(subscription));
              await this.salvarTokenNoBanco(user.id, tokenWeb, 'web');
              console.log('✅ Token Web gerado e guardado com sucesso!');
            }
          } else {
            console.warn('⚠️ O utilizador recusou a permissão de notificações.');
          }
        } else {
          console.warn('⚠️ Este navegador não suporta Notificações Push.');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar registo de notificações:', error);
    }
  }

  private static async salvarTokenNoBanco(userId: string, token: string, plataforma: 'ios' | 'android' | 'web'): Promise<void> {
    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token: token,
        plataforma: plataforma,
        atualizado_em: new Date().toISOString()
      },
      { onConflict: 'token' }
    );
    if (error) console.error('Erro ao gravar token no Supabase:', error);
  }

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