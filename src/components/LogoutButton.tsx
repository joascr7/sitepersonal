'use client';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors duration-200 active:scale-[0.98]"
    >
      Sair
    </button>
  );
}