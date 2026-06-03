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
      {/* Removi o bg-black fixo e mantive a flex col para layout 
        O reset de margens vem do globals.css que criamos.
      */}
      <body className="flex flex-col min-h-screen font-sans selection:bg-blue-600 selection:text-white">
        <LogoProvider>
          <ConditionalNavbar />
          
          {/* Removido mx-auto para evitar comportamentos de centralização 
            indesejada em telas pequenas.
          */}
          <main className="flex-grow w-full box-border">
            {children}
          </main>
        </LogoProvider>
      </body>
    </html>
  );
}