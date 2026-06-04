'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaLock, FaLockOpen, FaShieldAlt } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    header: 'Política de Acesso',
    active: 'Ativo',
    restricted: 'Restrito',
    grantedTitle: 'Acesso total concedido',
    blockedTitle: 'Acesso bloqueado por inadimplência',
    grantedDesc: 'O aluno possui permissões completas no sistema e app.',
    blockedDesc: 'O acesso a treinos e métricas está temporariamente desativado.',
    processing: 'Processando...',
    revoke: 'Revogar Acesso',
    grant: 'Conceder Acesso'
  },
  'pt-PT': {
    header: 'Política de Acesso',
    active: 'Ativo',
    restricted: 'Restrito',
    grantedTitle: 'Acesso total concedido',
    blockedTitle: 'Acesso bloqueado por incumprimento',
    grantedDesc: 'O aluno possui permissões completas no sistema e app.',
    blockedDesc: 'O acesso a treinos e métricas está temporariamente desativado.',
    processing: 'A processar...',
    revoke: 'Revogar Acesso',
    grant: 'Conceder Acesso'
  },
  'en': {
    header: 'Access Policy',
    active: 'Active',
    restricted: 'Restricted',
    grantedTitle: 'Full access granted',
    blockedTitle: 'Access blocked due to default',
    grantedDesc: 'The student has full permissions in the system and app.',
    blockedDesc: 'Access to workouts and metrics is temporarily disabled.',
    processing: 'Processing...',
    revoke: 'Revoke Access',
    grant: 'Grant Access'
  }
};

export default function ControleFinanceiro({ alunoId, initialStatus }: { alunoId: string, initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados UI Premium
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sincroniza o idioma salvo globalmente
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    setMounted(true);

    // Escuta mudanças de idioma feitas no pai
    const handleStorageChange = () => {
      const updatedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (updatedLang) setLang(updatedLang);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleStatus = async () => {
    setIsProcessing(true);
    const novoStatus = status === 'ativo' ? 'bloqueado' : 'ativo';
    
    const { error } = await supabase
      .from('alunos')
      .update({ status_pagamento: novoStatus })
      .eq('id', alunoId);

    if (!error) {
      setStatus(novoStatus);
    }
    setIsProcessing(false);
  };

  const t = translations[lang] || translations['pt-BR'];

  if (!mounted) return <div className="h-40 w-full animate-pulse bg-[var(--surface-sec)] rounded-[2.5rem] mt-8" />;

  return (
    <section className="bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)] shadow-xl overflow-hidden mt-8 transition-colors duration-500 w-full text-left">
      {/* Header do Widget Premium */}
      <div className="px-6 sm:px-8 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-sec)]/50">
        <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] flex items-center gap-2">
          <FaShieldAlt size={12} className="text-[var(--primary)]" />
          {t.header}
        </h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status === 'ativo' ? 'bg-[var(--success)] shadow-[0_0_8px_var(--success)]' : 'bg-[var(--danger)] shadow-[0_0_8px_var(--danger)]'}`} />
          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${status === 'ativo' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {status === 'ativo' ? t.active : t.restricted}
          </span>
        </div>
      </div>

      {/* Conteúdo do Widget */}
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-8">
        <div className="flex flex-col gap-2">
          <p className={`text-sm sm:text-base font-black ${status === 'ativo' ? 'text-[var(--text-primary)]' : 'text-[var(--danger)]'}`}>
            {status === 'ativo' ? t.grantedTitle : t.blockedTitle}
          </p>
          <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] max-w-[300px] leading-relaxed font-medium">
            {status === 'ativo' ? t.grantedDesc : t.blockedDesc}
          </p>
        </div>

        <button 
          onClick={toggleStatus}
          disabled={isProcessing}
          className={`w-full sm:w-auto px-6 sm:px-8 py-4 rounded-[1.2rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shrink-0
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            ${status === 'ativo' 
              ? 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--danger)]/50 hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 shadow-sm' 
              : 'border-[var(--success)]/50 text-[var(--success)] hover:bg-[var(--success)]/10 shadow-[0_0_15px_var(--success)]/20'}`}
        >
          {isProcessing ? (
            <div className="w-3 h-3 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
          ) : status === 'ativo' ? (
            <FaLock size={10} />
          ) : (
            <FaLockOpen size={10} />
          )}
          {isProcessing ? t.processing : status === 'ativo' ? t.revoke : t.grant}
        </button>
      </div>
    </section>
  );
}