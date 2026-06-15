'use client';
import { useEffect, useState } from 'react';
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { LogoProvider } from "@/components/LogoProvider";
import { AlunoProvider } from "@/app/context/AlunoContext";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // 1. RevenueCat
    const initRevenueCat = async () => {
      try {
        const Purchases = (await import('react-native-purchases')).default;
        Purchases.configure({ apiKey: "test_mDDTbbsCmieDaWEsCfyTXVrzbwu" });
      } catch (e) {
        console.log("RevenueCat inicializado apenas em ambiente mobile.");
      }
    };
    initRevenueCat();

    // 2. Sincronização de Tema via Classes Nativas (Alta Performance)
    const initTheme = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      const isDarkMode = savedTheme ? savedTheme === 'dark' : true; 
      setIsDark(isDarkMode);
      
      const root = document.documentElement;
      
      // Remove classes antigas e adiciona a nova classe de tema na raiz real do HTML
      if (isDarkMode) {
        root.classList.remove('light');
        root.classList.add('dark');
        
        // Define variáveis para os componentes
        root.style.setProperty('--bg', '#0F1115');
        root.style.setProperty('--surface', '#151A22');
        root.style.setProperty('--surface-sec', '#1B2330');
        root.style.setProperty('--primary', '#3B82F6');
        root.style.setProperty('--primary-soft', '#60A5FA');
        root.style.setProperty('--text-primary', '#F8FAFC');
        root.style.setProperty('--text-secondary', '#94A3B8');
        root.style.setProperty('--border', 'rgba(255,255,255,0.05)');
        root.style.setProperty('--success', '#22C55E');
        root.style.setProperty('--warning', '#F59E0B');
        root.style.setProperty('--danger', '#EF4444');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        
        root.style.setProperty('--bg', '#F3F6FB');
        root.style.setProperty('--surface', '#FFFFFF');
        root.style.setProperty('--surface-sec', '#E8EEF9');
        root.style.setProperty('--primary', '#2563EB');
        root.style.setProperty('--primary-soft', '#60A5FA');
        root.style.setProperty('--text-primary', '#111827');
        root.style.setProperty('--text-secondary', '#6B7280');
        root.style.setProperty('--border', 'rgba(15,23,42,0.06)');
        root.style.setProperty('--success', '#16A34A');
        root.style.setProperty('--warning', '#D97706');
        root.style.setProperty('--danger', '#DC2626');
      }

      // Atualiza a Meta Tag da bateria/relógio nativa do iOS
      const bgHex = isDarkMode ? '#0F1115' : '#F3F6FB';
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', bgHex);
      
      if (!localStorage.getItem('@premium_lang')) {
        localStorage.setItem('@premium_lang', 'pt-BR');
      }
    };

    initTheme();
    setMounted(true);

    const handleStorageChange = () => {
      initTheme();
      window.dispatchEvent(new Event('config-updated'));
    };
    window.addEventListener('storage', handleStorageChange);
    
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value]);
      if (key === '@premium_theme') initTheme();
      if (key === '@premium_theme' || key === '@premium_lang') {
        window.dispatchEvent(new Event('config-updated'));
      }
    };

    // 3. Bloqueio Definitivo de Zoom
    const preventPinchZoom = (e: TouchEvent) => { if (e.touches && e.touches.length > 1) e.preventDefault(); };
    const preventAppleGestures = (e: Event) => e.preventDefault();
    
    window.addEventListener('touchstart', preventPinchZoom as any, { passive: false });
    window.addEventListener('touchmove', preventPinchZoom as any, { passive: false });
    document.addEventListener('gesturestart', preventAppleGestures as any, { passive: false });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
      window.removeEventListener('touchstart', preventPinchZoom as any);
      window.removeEventListener('touchmove', preventPinchZoom as any);
      document.removeEventListener('gesturestart', preventAppleGestures as any);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] w-full pb-28">
      <AlunoProvider>
        <LogoProvider>
          <ConditionalNavbar />
          <main className="flex flex-col flex-grow w-full relative">
            <div className="flex-grow w-full">
              {children}
            </div>
            <div className="h-[100px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
          </main>
        </LogoProvider>
      </AlunoProvider>
    </div>
  );
}
