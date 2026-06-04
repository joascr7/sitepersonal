'use client';
import { useState, useEffect } from 'react';
import { FaUserShield, FaChartLine, FaUsers, FaSignOutAlt, FaMoon, FaSun, FaGlobe } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    admin: 'AURA-ADMIN',
    management: 'Gestão',
    report: 'Relatório',
    library: 'Biblioteca',
    logout: 'Sair'
  },
  'pt-PT': {
    admin: 'AURA-ADMIN',
    management: 'Gestão',
    report: 'Relatório',
    library: 'Biblioteca',
    logout: 'Sair'
  },
  'en': {
    admin: 'AURA-ADMIN',
    management: 'Management',
    report: 'Report',
    library: 'Library',
    logout: 'Logout'
  }
};

export default function NavbarAdmin() {
  const router = useRouter();

  // Estados de Tema e i18n
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const updateSettings = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
      
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);
    };

    updateSettings();
    setMounted(true);

    window.addEventListener('storage', updateSettings);
    return () => window.removeEventListener('storage', updateSettings);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
  };

  const toggleLang = () => {
    const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en'];
    const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(nextLang);
    localStorage.setItem('@premium_lang', nextLang);
  };

  const t = translations[lang];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--danger': '#EF4444',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--danger': '#DC2626',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login-admin');
  };

  if (!mounted) return null;

  return (
    <div style={themeStyles} className="transition-colors duration-500">
      
      {/* ━━━━━━━━━━ DESKTOP SIDEBAR ━━━━━━━━━━ */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 bg-[var(--surface)]/90 backdrop-blur-2xl border-r border-[var(--border)] p-6 flex-col justify-between z-50 shadow-2xl">
        <div>
          {/* Header Admin */}
          <div className="flex items-center gap-4 font-black text-xl mb-12 text-[var(--text-primary)]">
            <div className="p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-2xl shadow-inner">
              <FaUserShield className="text-[var(--primary)]" />
            </div>
            <span className="tracking-tight">{t.admin}</span>
          </div>

          {/* Links de Gestão */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => router.push('/admin/financeiro?aba=gestao')} 
              className="group flex items-center gap-4 p-4 rounded-[1.2rem] hover:bg-[var(--surface-sec)] border border-transparent hover:border-[var(--border)] transition-all duration-300 font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full text-left"
            >
              <div className="text-lg group-hover:text-[var(--primary)] group-hover:scale-110 transition-all"><FaUsers /></div>
              <span>{t.management}</span>
            </button>
            
            <button 
              onClick={() => router.push('/admin/financeiro?aba=relatorio')} 
              className="group flex items-center gap-4 p-4 rounded-[1.2rem] hover:bg-[var(--surface-sec)] border border-transparent hover:border-[var(--border)] transition-all duration-300 font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full text-left"
            >
              <div className="text-lg group-hover:text-[var(--primary)] group-hover:scale-110 transition-all"><FaChartLine /></div>
              <span>{t.report}</span>
            </button>

            <button 
              onClick={() => router.push('/admin/biblioteca?aba=biblioteca')} 
              className="group flex items-center gap-4 p-4 rounded-[1.2rem] hover:bg-[var(--surface-sec)] border border-transparent hover:border-[var(--border)] transition-all duration-300 font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full text-left"
            >
              <div className="text-lg group-hover:text-[var(--primary)] group-hover:scale-110 transition-all"><FaChartLine /></div>
              <span>{t.library}</span>
            </button>
          </div>
        </div>

        {/* Rodapé da Sidebar (Toggles + Logout) */}
        <div className="flex flex-col gap-6">
          {/* Theme & Lang Toggles */}
          <div className="flex gap-2 p-1 bg-[var(--surface-sec)] rounded-[1.2rem] border border-[var(--border)] shadow-inner">
            <button onClick={toggleLang} className="flex-1 py-2.5 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface)] transition-all">
              <FaGlobe size={14} />
            </button>
            <button onClick={toggleTheme} className="flex-1 py-2.5 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface)] transition-all">
              {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>
          </div>

          <button 
            onClick={handleLogout} 
            className="group flex items-center gap-4 p-4 rounded-[1.2rem] bg-[var(--danger)]/5 border border-[var(--danger)]/20 hover:bg-[var(--danger)]/10 transition-all duration-300 font-black text-xs uppercase tracking-widest text-[var(--danger)] w-full text-left active:scale-[0.98]"
          >
            <div className="text-lg group-hover:-translate-x-1 transition-transform"><FaSignOutAlt /></div>
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* ━━━━━━━━━━ MOBILE BOTTOM NAVIGATION ━━━━━━━━━━ */}
      <nav 
        className="md:hidden fixed left-5 right-5 z-50 bg-[var(--surface)]/90 backdrop-blur-2xl border border-[var(--border)] rounded-[2rem] py-3 px-6 flex justify-between items-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)]"
        style={{ bottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
      >
        <button 
          onClick={() => router.push('/admin/financeiro?aba=gestao')} 
          className="flex flex-col items-center gap-1.5 transition-all duration-300 w-16 group text-[var(--text-secondary)] hover:text-[var(--primary)]"
        >
          <div className="relative flex items-center justify-center w-10 h-8 rounded-full transition-all duration-300 group-hover:bg-[var(--surface-sec)] group-hover:scale-105">
            <FaUsers className="text-lg" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-70 group-hover:opacity-100 truncate w-full text-center">{t.management}</span>
        </button>

        <button 
          onClick={() => router.push('/admin/financeiro?aba=relatorio')} 
          className="flex flex-col items-center gap-1.5 transition-all duration-300 w-16 group text-[var(--text-secondary)] hover:text-[var(--primary)]"
        >
          <div className="relative flex items-center justify-center w-10 h-8 rounded-full transition-all duration-300 group-hover:bg-[var(--surface-sec)] group-hover:scale-105">
            <FaChartLine className="text-lg" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-70 group-hover:opacity-100 truncate w-full text-center">{t.report}</span>
        </button>

        <button 
          onClick={() => router.push('/admin/biblioteca?aba=biblioteca')} 
          className="flex flex-col items-center gap-1.5 transition-all duration-300 w-16 group text-[var(--text-secondary)] hover:text-[var(--primary)]"
        >
          <div className="relative flex items-center justify-center w-10 h-8 rounded-full transition-all duration-300 group-hover:bg-[var(--surface-sec)] group-hover:scale-105">
            <FaChartLine className="text-lg" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-70 group-hover:opacity-100 truncate w-full text-center">{t.library}</span>
        </button>

        {/* Logout Mobile */}
        <button 
          onClick={handleLogout} 
          className="flex flex-col items-center gap-1.5 transition-all duration-300 w-16 group text-[var(--text-secondary)]"
        >
          <div className="relative flex items-center justify-center w-10 h-8 rounded-full transition-all duration-300 group-hover:bg-[var(--danger)]/10 group-hover:text-[var(--danger)] active:scale-95">
            <FaSignOutAlt className="text-lg" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-70 group-hover:text-[var(--danger)] transition-colors truncate w-full text-center">{t.logout}</span>
        </button>
      </nav>
      
    </div>
  );
}
