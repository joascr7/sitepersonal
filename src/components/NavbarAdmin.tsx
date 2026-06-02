'use client';
import { FaUserShield, FaChartLine, FaUsers, FaSignOutAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function NavbarAdmin() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login-admin');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:left-0 md:w-64 md:h-screen bg-neutral-950/90 backdrop-blur-2xl border-t md:border-t-0 md:border-r border-white/5 p-4 flex md:flex-col justify-between z-50 transition-all duration-300">
      <div>
        {/* Header Admin */}
        <div className="hidden md:flex items-center gap-3 font-black text-lg mb-12 p-4 text-white">
          <div className="p-2 bg-blue-600 rounded-xl">
            <FaUserShield className="text-white" />
          </div>
          AURA-ADMIN
        </div>

        {/* Links de Gestão */}
        <div className="flex md:flex-col gap-2">
          <button 
            onClick={() => router.push('/admin/financeiro?aba=gestao')} 
            className="flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all font-black text-xs uppercase tracking-widest text-neutral-400 hover:text-white"
          >
            <FaUsers className="text-lg" /> <span className="hidden md:block">Gestão</span>
          </button>
          <button 
            onClick={() => router.push('/admin/financeiro?aba=relatorio')} 
            className="flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all font-black text-xs uppercase tracking-widest text-neutral-400 hover:text-white"
          >
            <FaChartLine className="text-lg" /> <span className="hidden md:block">Relatório</span>
          </button>

          <button 
            onClick={() => router.push('/admin/biblioteca?aba=biblioteca')} 
            className="flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all font-black text-xs uppercase tracking-widest text-neutral-400 hover:text-white"
          >
            <FaChartLine className="text-lg" /> <span className="hidden md:block">Biblioteca</span>
          </button>
        </div>
      </div>

      {/* Logout */}
      <button 
        onClick={handleLogout} 
        className="flex items-center justify-center md:justify-start gap-3 p-4 text-red-500 font-black text-xs uppercase tracking-widest hover:text-red-400 transition-all"
      >
        <FaSignOutAlt className="text-lg" /> <span className="hidden md:block">Sair</span>
      </button>
    </nav>
  );
}