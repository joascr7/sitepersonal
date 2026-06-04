'use client';
import { useEffect, useState } from 'react';
import { FaWhatsapp, FaLock, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    restricted: 'Restrito', active: 'Assinatura Ativa',
    blockedAccount: 'Conta Bloqueada', premiumPlan: 'Plano Premium',
    dueDate: 'Vencimento', notAvailable: 'N/A', contactPersonal: 'Falar com Personal'
  },
  'pt-PT': {
    restricted: 'Restrito', active: 'Assinatura Ativa',
    blockedAccount: 'Conta Bloqueada', premiumPlan: 'Plano Premium',
    dueDate: 'Vencimento', notAvailable: 'N/D', contactPersonal: 'Falar com Personal'
  },
  'en': {
    restricted: 'Restricted', active: 'Active Subscription',
    blockedAccount: 'Blocked Account', premiumPlan: 'Premium Plan',
    dueDate: 'Due Date', notAvailable: 'N/A', contactPersonal: 'Contact Trainer'
  }
};

export default function StatusCard({ aluno }: { aluno: any }) {
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
    setMounted(true);

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

  if (!mounted || !aluno) {
    return <div className="w-full h-48 bg-[var(--surface-sec)] animate-pulse rounded-[2.5rem]" />;
  }

  const isBlocked = aluno.status_pagamento === 'bloqueado';
  
  /**
   * CORREÇÃO:
   * Ajuste aqui para o nome exato da coluna onde o número está salvo.
   * Se o número estiver em aluno.personais.telefone, use 'aluno.personais?.telefone'.
   * Se for um campo direto no objeto aluno, use 'aluno.telefone_personal'.
   */
  const rawPhone = aluno.telefone_personal || aluno.personal_id || ''; 
  const numeroWhatsApp = String(rawPhone).replace(/\D/g, '');
  const linkWhatsApp = numeroWhatsApp ? `https://wa.me/${numeroWhatsApp.startsWith('55') ? '' : '55'}${numeroWhatsApp}` : '#';

  return (
    <div className="bg-[var(--surface)] p-8 sm:p-10 rounded-[2.5rem] border border-[var(--border)] flex flex-col items-center gap-6 shadow-xl hover:border-[var(--primary)]/30 transition-colors duration-500 w-full relative overflow-hidden">
      
      <div className={`absolute top-[-50%] left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-[60px] pointer-events-none transition-colors duration-500 ${isBlocked ? 'bg-[var(--danger)]/20' : 'bg-[var(--success)]/20'}`} />

      <div className="flex flex-col items-center gap-3 relative z-10 w-full">
        <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-inner border mb-2 ${isBlocked ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'}`}>
           {isBlocked ? <FaLock size={20} /> : <FaCheckCircle size={20} />}
        </div>
        
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shadow-sm ${isBlocked ? 'bg-[var(--danger)] shadow-[var(--danger)]' : 'bg-[var(--success)] shadow-[var(--success)]'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              {isBlocked ? t.restricted : t.active}
            </span>
          </div>
          <p className={`text-2xl font-black tracking-tighter ${isBlocked ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
            {isBlocked ? t.blockedAccount : t.premiumPlan}
          </p>
        </div>
      </div>

      <div className="w-full h-px bg-[var(--border)] relative z-10" />
      
      <div className="w-full flex justify-between items-center bg-[var(--surface-sec)] px-5 py-4 rounded-[1.2rem] border border-[var(--border)] relative z-10 shadow-inner">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <FaCalendarAlt size={12} />
          <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest">{t.dueDate}</span>
        </div>
        <span className="text-[var(--text-primary)] font-black text-sm">
          {aluno.data_vencimento ? new Date(aluno.data_vencimento).toLocaleDateString(lang) : t.notAvailable}
        </span>
      </div>

      {numeroWhatsApp && (
        <a 
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-2 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 py-4 sm:py-5 rounded-[1.2rem] font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all active:scale-95 shadow-sm flex items-center justify-center gap-3 relative z-10"
        >
          <FaWhatsapp size={16} />
          {t.contactPersonal}
        </a>
      )}
    </div>
  );
}