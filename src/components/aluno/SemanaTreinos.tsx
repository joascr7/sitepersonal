'use client';
import { useEffect, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR, pt, enUS } from 'date-fns/locale';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': { week: 'Sua semana' },
  'pt-PT': { week: 'A sua semana' },
  'en': { week: 'Your week' }
};

export default function SemanaTreinos({ diasTreino, intervalo }: { diasTreino: Date[], intervalo: Date[] }) {
  // Estados UI Premium
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sincroniza o tema e o idioma globais
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
    setMounted(true);

    // Escuta mudanças feitas em outros componentes
    const handleStorageChange = () => {
      const updatedTheme = localStorage.getItem('@premium_theme');
      const updatedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (updatedTheme) setIsDark(updatedTheme === 'dark');
      if (updatedLang) setLang(updatedLang);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = translations[lang] || translations['pt-BR'];

  // Seleciona o Locale do date-fns com base no idioma atual
  const getDateLocale = () => {
    if (lang === 'en') return enUS;
    if (lang === 'pt-PT') return pt;
    return ptBR;
  };

  // Skeleton Premium para evitar Flash of Unstyled Content (FOUC)
  if (!mounted) {
    return <div className="w-full h-32 animate-pulse bg-[var(--surface-sec)] rounded-[2.5rem]" />;
  }

  return (
    <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-[var(--border)] shadow-xl transition-colors duration-500 w-full overflow-hidden">
      <h2 className="text-[9px] sm:text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-6">
        {t.week}
      </h2>
      
      <div className="flex justify-between items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar pb-2">
        {intervalo.map((dia, i) => {
          // Lógica Original Intacta
          const treinou = diasTreino.some(d => isSameDay(d, dia));
          const hoje = isSameDay(dia, new Date());
          const falha = dia < new Date() && !treinou && !hoje;
          
          return (
            <div key={i} className="flex flex-col items-center gap-3 shrink-0">
              <div 
                className={`w-10 sm:w-12 h-10 sm:h-12 rounded-[1rem] sm:rounded-[1.2rem] flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300 ${
                  treinou 
                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30 scale-105' 
                    : falha 
                    ? 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20' 
                    : hoje 
                    ? 'border-2 border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--surface-sec)] scale-110 shadow-sm' 
                    : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/30'
                }`}
              >
                {treinou ? '✓' : falha ? '✕' : hoje ? '●' : ''}
              </div>
              <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest ${hoje ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                {format(dia, 'EEEEE', { locale: getDateLocale() })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}