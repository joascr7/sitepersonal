'use client';
import { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Treino Concluído!',
    closeBtn: 'Fechar e Voltar'
  },
  'pt-PT': {
    title: 'Treino Concluído!',
    closeBtn: 'Fechar e Voltar'
  },
  'en': {
    title: 'Workout Completed!',
    closeBtn: 'Close and Go Back'
  }
};

export default function ToastSucesso({ mensagem, onClose }: { mensagem: string, onClose: () => void }) {
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

  const t = translations[lang] || translations['pt-BR'];

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 font-sans">
      
      {/* Container Glassmorphism Premium */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-8 sm:p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6 transform animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative overflow-hidden">
        
        {/* Elemento de profundidade / Luz de Fundo */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-32 h-32 bg-[var(--success)]/10 rounded-full blur-[50px] pointer-events-none" />

        {/* Ícone com brilho sutil */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-[var(--success)]/20 blur-xl rounded-full animate-pulse" />
          <FaCheckCircle className="text-[var(--success)] text-6xl relative z-10 drop-shadow-sm" />
        </div>

        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tighter">
            {t.title}
          </h2>
          <p className="text-[var(--text-secondary)] font-black text-[9px] sm:text-[10px] uppercase tracking-widest leading-relaxed">
            {mensagem}
          </p>
        </div>

        <button 
          onClick={onClose} 
          className="w-full bg-[var(--primary)] text-white py-4 sm:py-5 rounded-[1.2rem] font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[var(--primary)]/20 relative z-10"
        >
          {t.closeBtn}
        </button>
      </div>
    </div>
  );
}