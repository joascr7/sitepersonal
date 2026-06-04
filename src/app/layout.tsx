'use client';
import { useEffect, useState } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { LogoProvider } from "@/components/LogoProvider";
import "./globals.css";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FONTES GLOBAIS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const geistSans = Geist({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({ 
  variable: "--font-geist-mono", 
  subsets: ["latin"],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // Estado para garantir que a hidratação ocorra após montar o tema no client
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INICIALIZAÇÃO DE REVENUE CAT E SISTEMA GLOBAL DE TEMA (PWA/MOBILE)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    // 1. RevenueCat Original Preservado
    const initRevenueCat = async () => {
      try {
        const Purchases = (await import('react-native-purchases')).default;
        Purchases.configure({ apiKey: "test_mDDTbbsCmieDaWEsCfyTXVrzbwu" });
      } catch (e) {
        console.log("RevenueCat inicializado apenas em ambiente mobile.");
      }
    };
    initRevenueCat();

    // 2. Inicialização Global do Tema Premium
    const initTheme = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      const isDarkMode = savedTheme ? savedTheme === 'dark' : true; // Dark by default
      setIsDark(isDarkMode);
      
      // Injeta as variáveis de design system premium diretamente no :root para uso global
      const root = document.documentElement;
      
      if (isDarkMode) {
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
      
      // Inicializa o idioma padrão caso não exista
      if (!localStorage.getItem('@premium_lang')) {
        localStorage.setItem('@premium_lang', 'pt-BR');
      }
    };

    initTheme();
    setMounted(true);

    // Observer para escutar mudanças no localStorage (ex: quando o botão de tema for clicado em outras páginas)
    const handleStorageChange = () => initTheme();
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event para o mesmo contexto de aba
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value]);
      if(key === '@premium_theme') initTheme();
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  return (
    <html
      lang="pt-br"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ backgroundColor: isDark ? '#0F1115' : '#F3F6FB' }}
    >
      <head>
        {/* VIEWPORT PWA / CAPACITOR / MOBILE PREMIUM */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        
        {/* iOS NATIVE WEB APP TAGS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AuraFit" />
        
        {/* DYNAMIC THEME COLOR FOR NOTCH/STATUS BAR */}
        <meta name="theme-color" content={isDark ? '#0F1115' : '#F3F6FB'} />
      </head>
      
      {/* 
        Ajuste do Body Premium:
        - min-h-screen & flex-col: Garante que o layout ocupe a tela inteira.
        - overscroll-none: Previne o efeito "bounce" indesejado do iOS Safari ao fazer scroll nos limites.
        - bg-[var(--bg)]: Aplica o sistema dinâmico de cores automaticamente.
        - transições suaves aplicadas de forma global.
      */}
      <body 
        className={`
          min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-primary)] font-sans 
          selection:bg-[var(--primary)] selection:text-white overscroll-none
          ${mounted ? 'transition-colors duration-500' : ''}
        `}
      >
        <LogoProvider>
          {/* ConditionalNavbar injetada com o contexto correto de theme */}
          <ConditionalNavbar />
          
          {/* 
            Container Principal (AppLayout Architecture)
            - flex-grow: Permite que o conteúdo ocupe o espaço livre sem distorções.
            - w-full: Previne scroll horizontal acidental.
            - relative: Cria contexto de empilhamento para overlays e modais nativas.
          */}
          <main className="flex-grow w-full relative">
            {children}
          </main>
        </LogoProvider>
      </body>
    </html>
  );
}
