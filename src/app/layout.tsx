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

// A MÁGICA DE TELA CHEIA (EDGE-TO-EDGE) ACONTECE AQUI!
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover', // <-- Isso estica a tela removendo bordas brancas do iOS
};

export const metadata: Metadata = {
  title: "AuraFit",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Transforma a barra de status em transparente
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
        {/* Injeta as variáveis globalmente para travar o branco */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root, html, body {
              margin: 0;
              padding: 0;
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
