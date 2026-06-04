import NavbarAdmin from "@/components/NavbarAdmin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Utilizamos variáveis de tema para manter a consistência com o restante do app
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500">
      
      {/* Navbar específica do Admin (fixa ou responsiva dependendo do componente) */}
      <NavbarAdmin />
      
      {/* Área principal do Admin com preenchimento responsivo */}
      <main className="flex-1 w-full md:pl-64 transition-all duration-300">
        {/* Adicionei um container global para limitar a largura e manter o respiro */}
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 min-h-[100dvh]">
          {children}
        </div>
      </main>

    </div>
  );
}