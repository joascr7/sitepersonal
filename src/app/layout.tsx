import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Consultoria PT",
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
      <body className="min-h-full flex flex-col">
        {/* Navbar responsiva controlada pelo ConditionalNavbar */}
        <ConditionalNavbar />
        
        {/* pb-24: Adiciona espaço no fundo apenas no mobile para não cortar o conteúdo 
          md:pb-0: Remove esse espaço no desktop, onde a navbar não é fixa no rodapé 
        */}
        <main className="flex-grow pb-24 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}