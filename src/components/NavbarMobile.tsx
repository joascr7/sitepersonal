export default function NavbarMobile() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 flex justify-around z-50">
      <a href="/dashboard" className="text-[10px] font-black text-gray-900 uppercase">Dashboard</a>
      <a href="/financeiro" className="text-[10px] font-black text-gray-400 uppercase">Financeiro</a>
      <a href="/perfil" className="text-[10px] font-black text-gray-400 uppercase">Sair</a>
    </nav>
  );
}