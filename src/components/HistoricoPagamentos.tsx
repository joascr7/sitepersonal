'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaHistory, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Histórico de Pagamentos',
    empty: 'Nenhum pagamento registrado.'
  },
  'pt-PT': {
    title: 'Histórico de Pagamentos',
    empty: 'Nenhum pagamento registado.'
  },
  'en': {
    title: 'Payment History',
    empty: 'No payments recorded.'
  }
};

export default function HistoricoPagamentos({ personalId }: { personalId: string }) {
  const [historico, setHistorico] = useState<any[]>([]);
  
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

  useEffect(() => {
    const carregarHistorico = async () => {
      const { data } = await supabase
        .from('financeiro')
        .select('*')
        .eq('personal_id', personalId)
        .order('data_pagamento', { ascending: false });
      
      setHistorico(data || []);
    };
    if (personalId) carregarHistorico();
  }, [personalId]);

  const t = translations[lang] || translations['pt-BR'];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--success': '#22C55E',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--success': '#16A34A',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  if (!mounted) return <div className="mt-8 h-64 bg-[var(--surface)] rounded-[2.5rem] animate-pulse" />;

  return (
    <div 
      style={themeStyles} 
      className="mt-8 bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
    >
      {/* Efeito Glow Decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-[var(--primary)]/10" />

      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-2 h-6 bg-[var(--primary)] rounded-full" />
        <h3 className="font-black text-[var(--text-primary)] text-base tracking-tight">
          {t.title}
        </h3>
      </div>
      
      <div className="space-y-2 relative z-10">
        {historico.length > 0 ? historico.map((p) => (
          <div 
            key={p.id} 
            className="flex justify-between items-center p-4 rounded-[1.2rem] bg-[var(--surface-sec)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-[var(--success)] bg-[var(--success)]/10 p-2 rounded-lg">
                <FaMoneyBillWave size={14} />
              </div>
              <span className="font-black text-[var(--text-primary)] text-sm">
                R$ {Number(p.valor).toFixed(2).replace('.', ',')}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <FaCalendarAlt size={10} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {new Date(p.data_pagamento).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR')}
              </span>
            </div>
          </div>
        )) : (
          <div className="text-center py-8">
            <FaHistory className="mx-auto text-[var(--text-secondary)]/30 text-3xl mb-3" />
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
              {t.empty}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}