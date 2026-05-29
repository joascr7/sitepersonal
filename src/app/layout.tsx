import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { LogoProvider } from "@/components/LogoProvider";
import "./globals.css";

const geistSans = Geist({ 
  variable: "--font-geist-sans", 
  subsets: ["latin"],
  display: 'swap', // Melhora o carregamento da fonte
});

const geistMono = Geist_Mono({ 
  variable: "--font-geist-mono", 
  subsets: ["latin"],
  display: 'swap',
});

// Configuração para o comportamento do PWA no mobile
export const viewport: Viewport = {
  themeColor: "#FAFAFA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "AURAFIT | Gestão de Alta Performance",
  description: "Sistema de gestão de alunos e treinos",
  manifest: "/manifest.json", // Link para o PWA que configuramos
  appleWebApp: {
    capable: true,
    title: "AURAFIT",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAFA] font-sans">
        <LogoProvider>
          {/* NavBar condicional: O componente deve gerenciar o render (null se for tela de login) */}
          <ConditionalNavbar />
          
          {/* Main Content */}
          <main className="flex-grow w-full mx-auto pb-24 md:pb-0 box-border">
            {children}
          </main>
        </LogoProvider>
      </body>
    </html>
  );
}