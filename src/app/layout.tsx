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
      <body className="min-h-full flex flex-col bg-gray-50">
        {/* O ConditionalNavbar agora gerencia toda a lógica de visibilidade.
          Certifique-se de que NÃO exista nenhum <Navbar /> ou <LogoutButton /> 
          dentro dos seus arquivos page.tsx.
        */}
        <ConditionalNavbar />
        
        {/* flex-grow: Garante que o main ocupe todo o espaço restante.
          pb-24: Espaço para a navbar mobile fixa.
          md:pb-0: Remove o padding no desktop.
        */}
        <main className="flex-grow pb-24 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}