'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaLock } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Acesso Suspenso',
    description: 'Identificamos que seu acesso foi pausado pelo seu treinador. Entre em contato para reativar sua jornada e continuar seus treinos.',
    btnBack: 'Voltar ao Login'
  },
  'pt-PT': {
    title: 'Acesso Suspenso',
    description: 'Identificamos que o seu acesso foi pausado pelo seu treinador. Entre em contacto para reativar a sua jornada e continuar os seus treinos.',
    btnBack: 'Voltar ao Início de Sessão'
  },
  'en': {
    title: 'Access Suspended',
    description: 'We noticed your access has been paused by your trainer. Please reach out to them to reactivate your journey and continue your workouts.',
    btnBack: 'Back to Login'
  }
};

export default function PaginaInativa() {
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

  const t = translations[lang] || translations['pt-BR'];

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

  if (!mounted) return (
    <main className="min-h-screen bg-[#0F1115] flex items-center justify-center animate-pulse" />
  );

  return (
    <main style={themeStyles} className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6 text-center relative overflow-hidden transition-colors duration-500 font-sans antialiased">
      
      {/* Elemento de luz de fundo para um tom de alerta (Danger Glow) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--danger)]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-[380px] bg-[var(--surface)]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Ícone de Cadeado Premium */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-full flex items-center justify-center shadow-inner relative">
            <div className="absolute inset-0 bg-[var(--danger)]/20 rounded-full blur-md animate-pulse" />
            <FaLock className="text-3xl text-[var(--danger)] relative z-10" />
          </div>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mb-4 tracking-tight leading-tight">
          {t.title}
        </h1>
        
        <p className="text-[var(--text-secondary)] text-sm font-bold leading-relaxed mb-10">
          {t.description}
        </p>

        <button 
          onClick={() => router.push('/login-aluno')}
          className="w-full bg-[var(--primary)] hover:brightness-110 text-white py-4 rounded-[1.2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-[0.98] shadow-[0_10px_30px_-10px_var(--primary)]"
        >
          {t.btnBack}
        </button>
      </div>
    </main>
  );
}
