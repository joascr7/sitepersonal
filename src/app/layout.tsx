'use client';
import { useEffect } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { LogoProvider } from "@/components/LogoProvider";
import "./globals.css";

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

  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        const Purchases = (await import('react-native-purchases')).default;
        Purchases.configure({ apiKey: "test_mDDTbbsCmieDaWEsCfyTXVrzbwu" });
      } catch (e) {
        console.log("RevenueCat inicializado apenas em ambiente mobile.");
      }
    };
    initRevenueCat();
  }, []);

  return (
    <html
      lang="pt-br"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Ajuste do Body:
        - min-h-screen: Garante que o fundo preto cubra toda a tela.
        - flex-col: Organiza o layout.
        - Não há margens/paddings aqui para não criar espaços no topo.
      */}
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-blue-600 selection:text-white">
        <LogoProvider>
          {/* IMPORTANTE: Se o espaço continuar, abra o arquivo ConditionalNavbar.tsx
            e certifique-se de que ele não possui classes como 'pt-10' ou 'mt-10'.
          */}
          <ConditionalNavbar />
          
          {/* flex-grow: Garante que o conteúdo principal ocupe o espaço disponível 
            sem margens laterais automáticas (mx-auto removido).
          */}
          <main className="flex-grow w-full">
            {children}
          </main>
        </LogoProvider>
      </body>
    </html>
  );
}