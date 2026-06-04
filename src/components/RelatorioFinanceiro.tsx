'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaChartBar, FaFileInvoiceDollar, FaUserCircle } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Relatório de Receitas',
    empty: 'Nenhum registro encontrado.',
    removedUser: 'Usuário Removido'
  },
  'pt-PT': {
    title: 'Relatório de Receitas',
    empty: 'Nenhum registo encontrado.',
    removedUser: 'Utilizador Removido'
  },
  'en': {
    title: 'Revenue Report',
    empty: 'No records found.',
    removedUser: 'Removed User'
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN PREMIUM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RelatorioSkeleton = () => (
  <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl mt-10 w-full animate-pulse">
    <div className="h-6 w-48 bg-[var(--surface-sec)] rounded-lg mb-8" />
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-[var(--surface-sec)] rounded-[1.5rem] border border-[var(--border)] w-full" />
      ))}
    </div>
  </div>
);

export default function RelatorioFinanceiro() {
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados UI Premium
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sincroniza o idioma salvo globalmente
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    setMounted(true);

    // Escuta mudanças de idioma feitas em outras partes do app
    const handleStorageChange = () => {
      const updatedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (updatedLang) setLang(updatedLang);
    };
    window.addEventListener('storage', handleStorageChange);

    // Lógica Original Intacta
    const fetchPagamentos = async () => {
      const { data } = await supabase
        .from('financeiro')
        .select('*, personais(nome)')
        .order('data_pagamento', { ascending: false });
      
      setPagamentos(data || []);
      setLoading(false);
    };
    fetchPagamentos();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const formatarMes = (data: string) => {
    const d = new Date(data);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const t = translations[lang] || translations['pt-BR'];

  if (!mounted) return <div className="h-64 w-full animate-pulse bg-[var(--surface-sec)] rounded-[2.5rem] mt-10" />;

  if (loading) return <RelatorioSkeleton />;

  return (
    <section className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl mt-10 transition-colors duration-500 w-full text-left">
      <h2 className="font-black text-[var(--text-primary)] text-lg sm:text-xl mb-6 sm:mb-8 tracking-tighter flex items-center gap-2">
        <FaChartBar className="text-[var(--primary)]" />
        {t.title}
      </h2>
      
      <div className="space-y-4">
        {pagamentos.length > 0 ? (
          pagamentos.map((p) => (
            <div 
              key={p.id} 
              className="flex flex-col sm:flex-row justify-between sm:items-center p-5 sm:p-6 bg-[var(--surface-sec)] rounded-[1.5rem] border border-[var(--border)] hover:border-[var(--primary)]/40 hover:shadow-md transition-all gap-4 sm:gap-0 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--primary)]/10 text-[var(--primary)] rounded-[1rem] flex items-center justify-center shrink-0 border border-[var(--primary)]/20 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                  <FaUserCircle size={20} />
                </div>
                <div>
                  <p className="font-black text-sm sm:text-base text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-[300px]">
                    {p.personais?.nome || t.removedUser}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-widest mt-0.5">
                    {formatarMes(p.data_pagamento)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:justify-end shrink-0 bg-[var(--surface)] sm:bg-transparent px-4 py-3 sm:p-0 rounded-xl sm:rounded-none border border-[var(--border)] sm:border-none">
                <FaFileInvoiceDollar className="text-[var(--success)] sm:hidden" />
                <p className="font-black text-sm sm:text-base text-[var(--success)]">
                  {new Intl.NumberFormat(lang, { 
                    style: 'currency', 
                    currency: lang === 'pt-PT' ? 'EUR' : lang === 'en' ? 'USD' : 'BRL' 
                  }).format(p.valor)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center border-2 border-dashed border-[var(--border)] rounded-[1.5rem] bg-[var(--surface)]/50 py-10 sm:py-12 flex flex-col items-center gap-3">
            <FaChartBar size={24} className="text-[var(--text-secondary)]/50" />
            <p className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-[9px] sm:text-[10px]">
              {t.empty}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}