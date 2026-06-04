'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaHome, FaUser, FaDumbbell, FaCommentDots } from 'react-icons/fa';
import { useLogo } from '@/components/LogoProvider';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    home: 'Início',
    workouts: 'Treinos',
    feedback: 'Feedback',
    profile: 'Perfil'
  },
  'pt-PT': {
    home: 'Início',
    workouts: 'Treinos',
    feedback: 'Feedback',
    profile: 'Perfil'
  },
  'en': {
    home: 'Home',
    workouts: 'Workouts',
    feedback: 'Feedback',
    profile: 'Profile'
  }
};

export default function NavbarAluno() {
  const pathname = usePathname();
  const { logo, nome } = useLogo();

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
  
  // Lógica Original de Ocultação
  if (pathname === '/pagamento-pendente') return null;

  // Lógica Original de Extração do ID
  const parts = pathname.split('/');
  const alunoId = parts[2];

  const navLinks = [
    { name: t.home, path: alunoId ? `/aluno/${alunoId}` : '#', icon: <FaHome /> },
    { name: t.workouts, path: alunoId ? `/aluno/${alunoId}/treinos` : '#', icon: <FaDumbbell /> },
    { name: t.feedback, path: alunoId ? `/aluno/${alunoId}/feedback` : '#', icon: <FaCommentDots /> },
    { name: t.profile, path: alunoId ? `/aluno/${alunoId}/perfil` : '#', icon: <FaUser /> },
  ];

  // Evita hidratação incorreta antes de carregar o tema
  if (!mounted) return null;

  return (
    <>
      {/* ━━━━━━━━━━ DESKTOP NAVBAR ━━━━━━━━━━ */}
      <nav 
        style={themeStyles} 
        className="hidden md:flex sticky top-0 z-50 bg-[var(--surface)]/90 backdrop-blur-2xl border-b border-[var(--border)] px-10 py-4 justify-between items-center transition-colors duration-500 shadow-sm"
      >
        {/* Branding */}
        <div className="flex items-center gap-4 h-10 w-auto group cursor-pointer">
          {logo ? (
            <img src={logo} className="h-full w-auto object-contain group-hover:scale-105 transition-transform" alt="Logo" />
          ) : (
            <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
              <span className="font-black text-[var(--primary)]">AF</span>
            </div>
          )}
          <span className="font-black tracking-tight text-2xl text-[var(--primary)]">
            {nome || 'AuraFit'}
          </span>
        </div>
        
        {/* Navigation Items */}
        <div className="flex gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <a 
                key={link.name} 
                href={link.path} 
                className={`relative py-2 transition-all duration-300 hover:text-[var(--primary)] ${
                  isActive ? 'text-[var(--primary)] font-black' : ''
                }`}
              >
                {link.name}
                {/* Active Indicator Line */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)] rounded-full shadow-[0_0_8px_var(--primary)] animate-in fade-in zoom-in duration-300" />
                )}
              </a>
            );
          })}
        </div>
      </nav>

      {/* ━━━━━━━━━━ MOBILE HEADER (AGORA STICKY DE FATO) ━━━━━━━━━━ */}
      <header 
        style={themeStyles} 
        className="md:hidden sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-b border-[var(--border)] flex items-center justify-center pb-3 pt-[max(env(safe-area-inset-top),1rem)] shadow-sm transition-colors duration-500"
      >
        <div className="flex items-center gap-2">
          {logo && <img src={logo} className="h-6 w-auto object-contain" alt="Logo" />}
          <span className="font-black tracking-tight text-lg text-[var(--text-primary)] uppercase truncate max-w-[200px]">
            {nome || 'AuraFit'}
          </span>
        </div>
      </header>

      {/* ━━━━━━━━━━ MOBILE BOTTOM NAVIGATION ━━━━━━━━━━ */}
      <nav 
        style={{ ...themeStyles, bottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
        className="md:hidden fixed left-5 right-5 z-50 bg-[var(--surface)]/90 backdrop-blur-2xl border border-[var(--border)] rounded-[2rem] py-3 px-6 flex justify-between items-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-colors duration-500"
      >
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          return (
            <a 
              key={link.name} 
              href={link.path} 
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 group ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              {/* Ícone com Active Pill */}
              <div className={`relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${
                isActive ? 'bg-[var(--primary)]/15 scale-110' : 'group-hover:bg-[var(--surface-sec)] group-hover:scale-105'
              }`}>
                <span className={`text-lg ${isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''}`}>
                  {link.icon}
                </span>
              </div>
              {/* Rótulo */}
              <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${
                isActive ? 'opacity-100' : 'opacity-70'
              }`}>
                {link.name}
              </span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
