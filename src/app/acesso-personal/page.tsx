'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaLock, FaGlobe, FaMoon, FaSun, FaArrowRight } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Acesso Limitado',
    desc: 'Seu período de teste encerrou. Para continuar utilizando a inteligência AuraFit Pro, selecione um plano e ative sua assinatura.',
    btnPlans: 'Ver Planos e Assinar',
    btnBack: 'Voltar ao Login'
  },
  'pt-PT': {
    title: 'Acesso Limitado',
    desc: 'O seu período de teste terminou. Para continuar a utilizar a inteligência AuraFit Pro, selecione um plano e ative a sua assinatura.',
    btnPlans: 'Ver Planos e Assinar',
    btnBack: 'Voltar ao Login'
  },
  'en': {
    title: 'Limited Access',
    desc: 'Your trial period has ended. To continue using the AuraFit Pro intelligence, select a plan and activate your subscription.',
    btnPlans: 'View Plans and Subscribe',
    btnBack: 'Back to Login'
  }
};

export default function AcessoPersonal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Estados UI Premium
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sincroniza tema e idioma
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
    setMounted(true);

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login-personal');
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

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

  // Configuração Dinâmica do Tema
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--text-primary': '#FFFFFF', '--text-secondary': '#94A3B8', '--primary': '#3B82F6'
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--primary': '#2563EB'
  } as React.CSSProperties;

  if (loading || !mounted) return <main style={themeStyles} className="min-h-screen bg-[var(--bg)]" />;

  return (
    <main style={themeStyles} className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6 transition-colors duration-500 font-sans">
      
      {/* Toggles Superiores */}
      <div className="fixed top-6 right-6 flex gap-2">
        <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all">
          <FaGlobe size={14} />
        </button>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all">
          {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
        </button>
      </div>

      <div className="max-w-md w-full bg-[var(--surface)] p-10 sm:p-12 rounded-[2.5rem] border border-[var(--border)] shadow-2xl text-center animate-in zoom-in-95 duration-500">
        
        {/* Ícone de bloqueio minimalista */}
        <div className="w-20 h-20 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
           <FaLock size={32} />
        </div>

        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-4 tracking-tighter">{t.title}</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-10 leading-relaxed font-medium">
          {t.desc}
        </p>
        
        <button 
          onClick={() => router.push('/planos')}
          className="w-full bg-[var(--primary)] text-white py-5 rounded-[1.2rem] font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-[var(--primary)]/20 flex items-center justify-center gap-2"
        >
          {t.btnPlans} <FaArrowRight size={10} />
        </button>

        <button 
          onClick={() => router.push('/login-personal')}
          className="w-full mt-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] hover:text-[var(--primary)] transition-colors"
        >
          {t.btnBack}
        </button>
      </div>
    </main>
  );
}