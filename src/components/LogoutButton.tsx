'use client';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Força o redirecionamento limpando o cache de navegação
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors duration-200 active:scale-[0.98] cursor-pointer"
      aria-label="Sair da conta"
    >
      Sair
    </button>
  );
}