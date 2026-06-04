'use client';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardPerformance from '@/components/DashboardPerformance';
import { FaChevronLeft, FaMoon, FaSun, FaGlobe } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Meu Progresso',
    subtitle: 'Análise de performance detalhada',
    back: 'Voltar'
  },
  'pt-PT': {
    title: 'O Meu Progresso',
    subtitle: 'Análise de performance detalhada',
    back: 'Voltar'
  },
  'en': {
    title: 'My Progress',
    subtitle: 'Detailed performance analysis',
    back: 'Back'
  }
};

export default function ProgressoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Estados de Tema e i18n
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  // Inicialização de Tema e Idioma (Persistência)
  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light');
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
    '--primary-soft': '#60A5FA',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--primary-soft': '#60A5FA',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  // Evitar hidratação incorreta antes de carregar o tema
  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#0F1115] p-6 space-y-8 animate-pulse pt-[max(env(safe-area-inset-top),2rem)]">
         <div className="w-24 h-8 bg-[#151A22] rounded-full mb-10" />
         <div className="w-48 h-10 bg-[#151A22] rounded-xl" />
         <div className="w-32 h-4 bg-[#151A22] rounded-full" />
      </main>
    );
  }

  return (
    <main 
      style={themeStyles} 
      className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pt-[max(env(safe-area-inset-top),1.5rem)] pb-[env(safe-area-inset-bottom)] px-4"
    >
      <div className="max-w-4xl mx-auto pb-32">
        
        {/* ━━━━━━━━━━ HEADER PREMIUM ━━━━━━━━━━ */}
        <header className="flex justify-between items-center mb-6 pt-4 px-2">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface)] px-4 py-2.5 rounded-full border border-[var(--border)] active:scale-95 transition-all shadow-sm"
          >
            <FaChevronLeft size={10} /> {t.back}
          </button>
          
          <div className="flex bg-[var(--surface)] rounded-full border border-[var(--border)] p-1 shadow-sm">
            <button onClick={toggleLang} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
              <FaGlobe size={14} />
            </button>
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
              {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>
          </div>
        </header>

        {/* ━━━━━━━━━━ TÍTULO ━━━━━━━━━━ */}
        <div className="mb-10 px-2">
          <h1 className="text-4xl font-black tracking-tight leading-tight">{t.title}</h1>
          <p className="text-[var(--primary)] font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-80"></span>
            {t.subtitle}
          </p>
        </div>
        
        {/* ━━━━━━━━━━ CONTEÚDO PRINCIPAL (DASHBOARD) ━━━━━━━━━━ */}
        <div className="relative z-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DashboardPerformance alunoId={id} />
        </div>

        {/* ESPAÇADOR DE SEGURANÇA: Garante scroll livre no final da página (Navbar inferior) */}
        <div className="h-20 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}