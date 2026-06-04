'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import LogoutButton from './LogoutButton';
import { FaChartLine, FaWallet, FaUser } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    dashboard: 'Dashboard',
    financial: 'Financeiro',
    profile: 'Perfil',
    logout: 'Sair'
  },
  'pt-PT': {
    dashboard: 'Dashboard',
    financial: 'Financeiro',
    profile: 'Perfil',
    logout: 'Sair'
  },
  'en': {
    dashboard: 'Dashboard',
    financial: 'Financial',
    profile: 'Profile',
    logout: 'Logout'
  }
};

export default function Navbar() {
  const pathname = usePathname();

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

    // Escuta mudanças no localStorage para atualizar a navbar em tempo real
    window.addEventListener('storage', updateSettings);
    return () => window.removeEventListener('storage', updateSettings);
  }, []);

  const t = translations[lang];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const rotasExcluidas = [
    '/', 
    '/login-professor', 
    '/login-aluno', 
    '/login-professor-cadastro', 
    '/nova-senha',
    '/pagamento-pendente'
  ];
  
  if (rotasExcluidas.includes(pathname) || pathname.startsWith('/aluno')) return null;

  const navItems = [
    { name: t.dashboard, path: '/dashboard', icon: <FaChartLine /> },
    { name: t.financial, path: '/dashboard/financeiro', icon: <FaWallet /> },
    { name: t.profile, path: '/perfil', icon: <FaUser /> },
  ];

  if (!mounted) return null;

  return (
    <>
      {/* ━━━━━━━━━━ DESKTOP NAVBAR ━━━━━━━━━━ */}
      <nav 
        style={themeStyles} 
        className="hidden md:flex sticky top-0 z-50 bg-[var(--surface)]/90 backdrop-blur-2xl border-b border-[var(--border)] px-10 py-4 justify-between items-center transition-colors duration-500 shadow-sm"
      >
        {/* Branding Estático (Consistente com a Navbar do Aluno) */}
        <div className="flex items-center gap-4 h-10 w-auto group cursor-pointer">
          <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="font-black text-[var(--primary)]">AF</span>
          </div>
          <span className="font-black tracking-tight text-2xl text-[var(--primary)]">
            AURAFIT
          </span>
        </div>
        
        {/* Navigation Items */}
        <div className="flex gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <a 
                key={item.path} 
                href={item.path} 
                className={`relative py-2 transition-all duration-300 hover:text-[var(--primary)] ${
                  isActive ? 'text-[var(--primary)] font-black' : ''
                }`}
              >
                {item.name}
                {/* Active Indicator Line */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)] rounded-full shadow-[0_0_8px_var(--primary)] animate-in fade-in zoom-in duration-300" />
                )}
              </a>
            );
          })}
          
          <div className="pl-6 ml-2 border-l border-[var(--border)] flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors">
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* ━━━━━━━━━━ MOBILE HEADER (AGORA STICKY DE FATO) ━━━━━━━━━━ */}
      <header 
        style={themeStyles} 
        className="md:hidden sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-b border-[var(--border)] flex items-center justify-center pb-3 pt-[max(env(safe-area-inset-top),1rem)] shadow-sm transition-colors duration-500"
      >
        <div className="flex items-center gap-2">
          <span className="font-black tracking-tight text-lg text-[var(--text-primary)] uppercase truncate max-w-[200px]">
            AURAFIT
          </span>
        </div>
      </header>

      {/* ━━━━━━━━━━ MOBILE BOTTOM NAVIGATION ━━━━━━━━━━ */}
      <nav 
        style={{ ...themeStyles, bottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
        className="md:hidden fixed left-5 right-5 z-50 bg-[var(--surface)]/90 backdrop-blur-2xl border border-[var(--border)] rounded-[2rem] py-3 px-6 flex justify-between items-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-colors duration-500"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <a 
              key={item.path} 
              href={item.path} 
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 group ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <div className={`relative flex items-center justify-center w-10 h-8 rounded-full transition-all duration-300 ${
                isActive ? 'bg-[var(--primary)]/15 scale-110' : 'group-hover:bg-[var(--surface-sec)] group-hover:scale-105'
              }`}>
                <span className={`text-lg ${isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''}`}>
                  {item.icon}
                </span>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${
                isActive ? 'opacity-100' : 'opacity-70'
              }`}>
                {item.name}
              </span>
            </a>
          );
        })}
        
        {/* Logout Mobile */}
        <div className="flex flex-col items-center gap-1.5 text-[var(--text-secondary)] w-16 group">
           <div className="relative flex items-center justify-center w-10 h-8 rounded-full transition-all duration-300 group-hover:bg-[var(--danger)]/10 group-hover:text-[var(--danger)] active:scale-95">
              <div className="text-lg flex items-center justify-center">
                <LogoutButton />
              </div>
           </div>
           <span className="text-[8px] font-black uppercase tracking-widest opacity-70 group-hover:text-[var(--danger)] transition-colors">{t.logout}</span>
        </div>
      </nav>
    </>
  );
}
