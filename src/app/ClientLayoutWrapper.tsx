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

    // 2. Leitura inicial do Tema
    const initTheme = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      const isDarkMode = savedTheme ? savedTheme === 'dark' : true; 
      setIsDark(isDarkMode);
      
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
    
    // Sobrescrita Mágica do localStorage
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
    const preventWheelZoom = (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault(); };
    const preventKeyZoom = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) e.preventDefault(); };

    window.addEventListener('touchstart', preventPinchZoom as any, { passive: false });
    window.addEventListener('touchmove', preventPinchZoom as any, { passive: false });
    document.addEventListener('gesturestart', preventAppleGestures as any, { passive: false });
    document.addEventListener('wheel', preventWheelZoom as any, { passive: false });
    document.addEventListener('keydown', preventKeyZoom as any);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
      window.removeEventListener('touchstart', preventPinchZoom as any);
      window.removeEventListener('touchmove', preventPinchZoom as any);
      document.removeEventListener('gesturestart', preventAppleGestures as any);
      document.removeEventListener('wheel', preventWheelZoom as any);
      document.removeEventListener('keydown', preventKeyZoom as any);
    };
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // A MÁGICA EDGE-TO-EDGE ACONTECE AQUI: PINTURA DINÂMICA FORÇADA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (!mounted) return;
    const bg = isDark ? '#0F1115' : '#F3F6FB';

    // Injeta estilo bruto no HTML e BODY
    let styleTag = document.getElementById('premium-theme-fix');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'premium-theme-fix';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `
      html, body, #__next {
        background-color: ${bg} !important;
      }
      :root {
        --bg: ${bg};
        --surface: ${isDark ? '#151A22' : '#FFFFFF'};
        --surface-sec: ${isDark ? '#1B2330' : '#E8EEF9'};
        --primary: ${isDark ? '#3B82F6' : '#2563EB'};
        --text-primary: ${isDark ? '#F8FAFC' : '#111827'};
        --text-secondary: ${isDark ? '#94A3B8' : '#6B7280'};
        --border: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)'};
        --danger: ${isDark ? '#EF4444' : '#DC2626'};
        --success: ${isDark ? '#22C55E' : '#16A34A'};
      }
    `;

    // Atualiza a Meta Tag que pinta o fundo do relógio/bateria do iPhone
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', bg);
  }, [isDark, mounted]);

  return (
    <div className="flex flex-col min-h-[100dvh] w-full transition-colors duration-500 pb-28">
      <AlunoProvider>
        <LogoProvider>
          <ConditionalNavbar />
          <main className="flex flex-col flex-grow w-full relative">
            <div className="flex-grow w-full">
              {children}
            </div>
            {/* Espaço extra para evitar que a Navbar móvel sobreponha conteúdo */}
            <div className="h-[100px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
          </main>
        </LogoProvider>
      </AlunoProvider>
    </div>
  );
}
