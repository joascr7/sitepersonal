import NavbarAdmin from "@/components/NavbarAdmin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      {/* Navbar específica do Admin */}
      <NavbarAdmin />
      
      {/* Área principal do Admin */}
      <main className="flex-1 md:pl-64">
        {children}
      </main>
    </div>
  );
}