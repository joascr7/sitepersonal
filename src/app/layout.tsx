import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import { LogoProvider } from "@/components/LogoProvider"; // Importante: Importar o Provider
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AURAFIT | Gestão de Alta Performance",
  description: "Sistema de gestão de alunos e treinos",
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
      <body className="min-h-full flex flex-col bg-[#FAFAFA]">
        {/* LogoProvider: Envolve todo o conteúdo para que a logo 
          seja acessível em qualquer página sem novas buscas ao banco.
        */}
        <LogoProvider>
          <ConditionalNavbar />
          
          {/* flex-grow: Garante que o main ocupe todo o espaço restante.
            pb-24: Padding inferior para a navbar mobile fixa (evita corte de conteúdo).
            md:pb-0: Remove o padding extra no desktop.
          */}
          <main className="flex-grow pb-24 md:pb-0">
            {children}
          </main>
        </LogoProvider>
      </body>
    </html>
  );
}