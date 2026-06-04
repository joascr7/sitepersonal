'use client';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaSignOutAlt } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': { logout: 'Sair', aria: 'Sair da conta' },
  'pt-PT': { logout: 'Sair', aria: 'Sair da conta' },
  'en': { logout: 'Logout', aria: 'Sign out' }
};

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  iconOnly?: boolean;
}

export default function LogoutButton({ 
  className = '', 
  children,
  iconOnly = false 
}: LogoutButtonProps) {
  const router = useRouter();
  
  // Estado de i18n
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const updateLang = () => {
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);
    };
    
    updateLang();
    setMounted(true);
    
    // Escuta mudanças de idioma em tempo real
    window.addEventListener('storage', updateLang);
    return () => window.removeEventListener('storage', updateLang);
  }, []);

  // Lógica Original Preservada
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

  const t = translations[lang] || translations['pt-BR'];

  return (
    <button 
      onClick={handleLogout}
      className={`group flex items-center justify-center gap-2 text-inherit hover:text-[var(--danger)] font-bold text-sm transition-all duration-300 active:scale-90 cursor-pointer ${className}`}
      aria-label={t.aria}
      title={t.logout}
    >
      {/* 
        Renderização flexível: 
        1. Se passar children, renderiza o que foi passado.
        2. Se passar iconOnly, renderiza só o ícone.
        3. Padrão: Ícone animado + Texto
      */}
      {children ? (
        children
      ) : (
        <>
          <FaSignOutAlt className={`text-lg group-hover:-translate-x-1 transition-transform ${iconOnly ? '' : 'hidden sm:block'}`} />
          {!iconOnly && <span>{mounted ? t.logout : 'Sair'}</span>}
        </>
      )}
    </button>
  );
}
