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
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:left-0 md:w-64 md:h-screen bg-white border-r border-gray-100 p-4 flex md:flex-col justify-between z-50">
      <div>
        <div className="hidden md:flex items-center gap-2 font-black text-xl mb-10 p-4">
          <FaUserShield /> AURA-ADMIN
        </div>
        <div className="flex md:flex-col gap-2">
          <button onClick={() => router.push('/admin/financeiro?aba=gestao')} className="flex-1 md:flex-none flex items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 font-black text-sm">
            <FaUsers /> <span className="hidden md:block">Gestão</span>
          </button>
          <button onClick={() => router.push('/admin/financeiro?aba=relatorio')} className="flex-1 md:flex-none flex items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 font-black text-sm">
            <FaChartLine /> <span className="hidden md:block">Relatório</span>
          </button>
        </div>
      </div>
      <button onClick={handleLogout} className="flex items-center gap-3 p-4 text-red-600 font-black text-sm">
        <FaSignOutAlt /> <span className="hidden md:block">Sair</span>
      </button>
    </nav>
  );
}