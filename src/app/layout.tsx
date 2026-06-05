'use client';
import { useEffect, useState } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { LogoProvider } from "@/components/LogoProvider";
import { AlunoProvider } from "@/app/context/AlunoContext";
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

  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INICIALIZAÇÃO DE REVENUE CAT E SISTEMA GLOBAL DE TEMA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    // 1. RevenueCat Original
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
      const isDarkMode = savedTheme ? savedTheme === 'dark' : true; 
      setIsDark(isDarkMode);
      
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
      
      if (!localStorage.getItem('@premium_lang')) {
        localStorage.setItem('@premium_lang', 'pt-BR');
      }
    };

    initTheme();
    setMounted(true);

    const handleStorageChange = () => initTheme();
    window.addEventListener('storage', handleStorageChange);
    
    // Sobrescrita segura do localStorage para atualizar o tema em tempo real
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AuraFit" />
        <meta name="theme-color" content={isDark ? '#0F1115' : '#F3F6FB'} />
      </head>
      <body 
        className={`
          min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-primary)] font-sans 
          selection:bg-[var(--primary)] selection:text-white overscroll-none
          ${mounted ? 'transition-colors duration-500' : ''}
        `}
      >
        <AlunoProvider>
          <LogoProvider>
            <ConditionalNavbar />
            
            {/* CORREÇÃO GLOBAL DEFINITIVA PARA A NAVBAR */}
            <main className="flex flex-col flex-grow w-full relative">
              
              {/* O conteúdo de todas as páginas carrega aqui */}
              <div className="flex-grow w-full">
                {children}
              </div>
              
              {/* Bloco Físico Invisível: 
                  Empurra a rolagem para cima, tirando o último item de trás da Navbar.
              */}
              <div className="h-[130px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
              
            </main>
            
          </LogoProvider>
        </AlunoProvider>
      </body>
    </html>
  );
}