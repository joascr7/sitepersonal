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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover', // <-- Estica a tela ignorando as travas do iOS
};

export const metadata: Metadata = {
  title: "AuraFit",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Faz a barra de status se integrar à cor do app
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
        {/* Script inline executado antes do primeiro render para evitar o flash branco */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('@premium_theme') || 'dark';
                  document.documentElement.classList.add(theme);
                  var bg = theme === 'dark' ? '#0F1115' : '#F3F6FB';
                  document.documentElement.style.backgroundColor = bg;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-[100dvh] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white overscroll-none">
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
