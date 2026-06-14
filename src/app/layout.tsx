import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayoutWrapper from "./ClientLayoutWrapper";
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

// A REGRA DE OURO PARA REMOVER BORDAS BRANCAS NO IOS
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover', // <-- Isso estica a tela para o topo e rodapé
};

export const metadata: Metadata = {
  title: "AuraFit",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // Permite a cor de fundo dominar a barra superior
    title: "AuraFit",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* CSS GLOBAL BRUTO: Trava o Scroll de Borracha e zera margens */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overscroll-behavior: none; /* Trava o 'bounce' elástico do iOS */
            }
          `
        }} />
      </head>
      <body className="min-h-[100dvh] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white overscroll-none">
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
