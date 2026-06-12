'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaGlobe, FaMoon, FaSun, FaArrowRight, FaUserAlt, FaUserTie, FaCheck, FaTimes } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    platform: 'Plataforma de Alta Performance',
    studentBtn: 'Entrar como Aluno',
    auth: 'Autenticando...',
    trainerBtn: 'Painel do Personal',
    redirect: 'Redirecionando...',
    access: 'Acesso ao Ecossistema',
    selectLanguage: 'Selecione o Idioma'
  },
  'pt-PT': {
    platform: 'Plataforma de Alta Performance',
    studentBtn: 'Entrar como Aluno',
    auth: 'A autenticar...',
    trainerBtn: 'Painel do Personal',
    redirect: 'A redirecionar...',
    access: 'Acesso ao Ecossistema',
    selectLanguage: 'Selecione o Idioma'
  },
  'en': {
    platform: 'High Performance Platform',
    studentBtn: 'Student Login',
    auth: 'Authenticating...',
    trainerBtn: 'Trainer Panel',
    redirect: 'Redirecting...',
    access: 'Ecosystem Access',
    selectLanguage: 'Select Language'
  }
};

const languages = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

export default function Page() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  // Estados de Tema e i18n
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);
  
  // Estado do Modal de Idiomas (Padrão Enterprise)
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // Inicialização de Tema e Idioma
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
    window.addEventListener('config-updated', updateSettings);

    return () => {
      window.removeEventListener('storage', updateSettings);
      window.removeEventListener('config-updated', updateSettings);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light');
    window.dispatchEvent(new Event('config-updated'));
  };

  const handleSelectLanguage = (newLang: string) => {
    setLang(newLang as any);
    localStorage.setItem('@premium_lang', newLang);
    window.dispatchEvent(new Event('config-updated'));
    setIsLangModalOpen(false);
  };

  const t = translations[lang];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': 'rgba(21, 26, 34, 0.65)', // Glassmorphism escuro refinado
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--primary-soft': '#60A5FA',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': 'rgba(255, 255, 255, 0.7)', // Glassmorphism claro refinado
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--primary-soft': '#60A5FA',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LÓGICA DE NEGÓCIO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const tipoSalvo = localStorage.getItem('usuario_tipo');
      if (tipoSalvo) {
        router.push(tipoSalvo === 'aluno' ? '/login-aluno' : '/login-personal');
      }
    };
    checkSessionAndRedirect();
  }, [router]);

  const handleNavigation = (path: string, tipo: 'aluno' | 'personal') => {
    setIsNavigating(path);
    localStorage.setItem('usuario_tipo', tipo);
    router.push(path);
  };

  if (!mounted) return (
    <main className="min-h-screen bg-[#0F1115] flex items-center justify-center px-6" />
  );

  return (
    <main 
      style={themeStyles} 
      className="min-h-[100dvh] flex items-center justify-center bg-[var(--bg)] text-[var(--text-primary)] px-5 relative overflow-hidden font-sans transition-colors duration-500 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* ━━━━━━━━━━ TOGGLES (THEME / LANG) ━━━━━━━━━━ */}
      <div className="absolute top-[max(env(safe-area-inset-top,20px),20px)] right-5 z-40 flex gap-2 animate-in fade-in duration-700">
        <button 
          onClick={() => setIsLangModalOpen(true)}
          className="relative w-10 h-10 rounded-full bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 transition-all active:scale-95"
          aria-label="Change Language"
        >
          <FaGlobe size={16} />
          <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
            {lang.split('-')[0].toUpperCase()}
          </span>
        </button>
        <button 
          onClick={toggleTheme} 
          className="relative w-10 h-10 rounded-full bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 transition-all active:scale-95"
          aria-label="Toggle Theme"
        >
          {isDark ? <FaSun size={16} /> : <FaMoon size={16} />}
        </button>
      </div>

      {/* ━━━━━━━━━━ ELEMENTOS DE PROFUNDIDADE (BLUR ORBS) ━━━━━━━━━━ */}
      <div className="absolute top-[-15%] left-[-15%] w-[120vw] sm:w-[500px] h-[120vw] sm:h-[500px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen transition-colors duration-700" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[100vw] sm:w-[400px] h-[100vw] sm:h-[400px] bg-[var(--primary-soft)]/10 rounded-full blur-[120px] pointer-events-none transition-colors duration-700" />

      {/* ━━━━━━━━━━ CARD PRINCIPAL (GLASSMORPHISM PREMIUM) ━━━━━━━━━━ */}
      <div className="w-full max-w-[380px] flex flex-col items-center p-8 sm:p-10 bg-[var(--surface)] backdrop-blur-3xl rounded-[3rem] border border-[var(--border)] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-700">
        
        {/* Branding */}
        <div className="mb-14 text-center w-full mt-4">
          <h1 className="text-5xl font-black tracking-tighter mb-1 text-[var(--text-primary)]">
            AURA<span className="text-[var(--primary)]">FIT</span>
          </h1>
          <div className="w-12 h-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-soft)] mx-auto rounded-full mt-3 shadow-[0_0_15px_var(--primary)]" />
          <p className="text-[9px] font-bold text-[var(--text-secondary)] tracking-[0.4em] uppercase mt-6 whitespace-nowrap">
            {t.platform}
          </p>
        </div>
        
        {/* Ações / Botões */}
        <div className="w-full space-y-4 mb-4">
          <button 
            onClick={() => handleNavigation('/login-aluno', 'aluno')} 
            disabled={!!isNavigating}
            className="group relative w-full overflow-hidden bg-[var(--primary)] text-white h-[60px] rounded-[1.2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-[0.98] shadow-[0_8px_30px_rgb(59,130,246,0.3)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.5)] hover:bg-blue-600 disabled:opacity-80 flex items-center justify-between px-6"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="bg-white/20 p-2 rounded-lg">
                <FaUserAlt className="text-sm" />
              </div>
              <span>{isNavigating === '/login-aluno' ? t.auth : t.studentBtn}</span>
            </div>
            {!isNavigating && <FaArrowRight className="text-[10px] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all relative z-10" />}
          </button>
          
          <button 
            onClick={() => handleNavigation('/login-personal', 'personal')} 
            disabled={!!isNavigating}
            className="group w-full bg-transparent border-2 border-[var(--border)] text-[var(--text-secondary)] h-[60px] rounded-[1.2rem] font-bold text-[11px] uppercase tracking-widest hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] hover:bg-[var(--text-secondary)]/5 transition-all duration-300 active:scale-[0.98] flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-3">
              <div className="bg-[var(--text-secondary)]/10 p-2 rounded-lg group-hover:bg-[var(--text-secondary)]/20 transition-colors">
                <FaUserTie className="text-sm" />
              </div>
              <span>{isNavigating === '/login-personal' ? t.redirect : t.trainerBtn}</span>
            </div>
            {!isNavigating && <FaArrowRight className="text-[10px] opacity-0 group-hover:opacity-50 group-hover:translate-x-1 transition-all" />}
          </button>
        </div>

        {/* Rodapé Sutil B2B */}
        <div className="mt-8 text-center w-full flex items-center gap-4 opacity-50">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            {t.access}
          </span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>
      </div>

      {/* ━━━━━━━━━━ MODAL DE SELEÇÃO DE IDIOMA (Enterprise Bottom Sheet) ━━━━━━━━━━ */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-5">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsLangModalOpen(false)} 
          />
          <div className="w-full max-w-sm bg-[var(--bg)] border border-[var(--border)] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="font-black text-lg tracking-tight text-[var(--text-primary)]">
                {t.selectLanguage}
              </h3>
              <button 
                onClick={() => setIsLangModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors active:scale-95"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="space-y-2">
              {languages.map((language) => {
                const isActive = lang === language.code;
                return (
                  <button
                    key={language.code}
                    onClick={() => handleSelectLanguage(language.code)}
                    className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border transition-all active:scale-[0.98] ${
                      isActive 
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' 
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{language.flag}</span>
                      <span className={`font-bold text-sm ${isActive ? 'text-[var(--primary)]' : ''}`}>
                        {language.name}
                      </span>
                    </div>
                    {isActive && <FaCheck className="text-[var(--primary)]" />}
                  </button>
                );
              })}
            </div>
            
            {/* Indicador de Swipe Mobile (Trancinho) */}
            <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mt-6 sm:hidden" />
          </div>
        </div>
      )}
    </main>
  );
}
