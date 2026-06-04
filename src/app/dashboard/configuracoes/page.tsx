'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoUploaderContainer from '@/components/LogoUploader.Container';
import { FaChevronLeft, FaGlobe, FaMoon, FaSun, FaPalette } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar',
    title: 'Branding e Cores',
    subtitle: 'Personalize a identidade visual do seu aplicativo',
  },
  'pt-PT': {
    back: 'Voltar',
    title: 'Branding e Cores',
    subtitle: 'Personalize a identidade visual da sua aplicação',
  },
  'en': {
    back: 'Back',
    title: 'Branding & Colors',
    subtitle: 'Customize your app visual identity',
  }
};

export default function ConfiguracoesPage() {
  const router = useRouter();

  // Estados UI Premium
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
    setMounted(true);
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

  const t = translations[lang] || translations['pt-BR'];

  // Configuração Dinâmica do Tema Premium
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      {/* Elementos de Profundidade (Orbs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[100vw] sm:w-[350px] h-[100vw] sm:h-[350px] bg-[var(--primary)]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 animate-in fade-in duration-700">
        
        {/* Toggles Superiores */}
        <div className="flex justify-end gap-2 mb-6">
          <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 relative">
            <FaGlobe size={14} />
            <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{lang.split('-')[0].toUpperCase()}</span>
          </button>
          <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95">
            {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
          </button>
        </div>

        {/* Header Premium */}
        <div className="bg-[var(--surface)] p-8 sm:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-xl mb-8">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors active:scale-95 mb-8"
          >
            <FaChevronLeft size={10} /> {t.back}
          </button>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 bg-[var(--primary)]/10 text-[var(--primary)] rounded-[1.5rem] flex items-center justify-center shadow-inner shrink-0">
              <FaPalette size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[var(--text-primary)]">{t.title}</h1>
              <p className="text-[var(--text-secondary)] font-black uppercase text-[9px] sm:text-[10px] tracking-widest mt-1.5">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Container do Componente de Logo */}
        <div className="bg-[var(--surface)] p-6 sm:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-xl">
          <LogoUploaderContainer />
        </div>

      </div>
    </main>
  );
}