'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaVideo, FaTimes, FaSpinner, FaSave } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Vídeo: ',
    placeholder: 'URL do vídeo',
    cancel: 'Cancelar',
    save: 'Salvar',
    saving: 'Salvando...'
  },
  'pt-PT': {
    title: 'Vídeo: ',
    placeholder: 'URL do vídeo',
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'A guardar...'
  },
  'en': {
    title: 'Video: ',
    placeholder: 'Video URL',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...'
  }
};

export default function ModalVideo({ exercicio, treinoId, exerciciosAtuais, onClose, onSave }: any) {
  const [videoUrl, setVideoUrl] = useState(exercicio.video || '');
  const [loading, setLoading] = useState(false);

  // Estados UI Premium
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sincroniza o idioma e tema salvos globalmente
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
    setMounted(true);

    // Escuta mudanças feitas no pai (Dashboard/Páginas)
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

  // Configuração Dinâmica do Tema Premium (Garante consistência caso o modal seja renderizado via Portal)
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const salvar = async () => {
    setLoading(true);
    const novosExercicios = exerciciosAtuais.map((ex: any) => 
      ex.nome === exercicio.nome ? { ...ex, video: videoUrl } : ex
    );

    await supabase
      .from('treinos_padroes')
      .update({ exercicios_json: novosExercicios })
      .eq('id', treinoId);

    onSave(novosExercicios);
    setLoading(false);
    onClose();
  };

  if (!mounted) return null;

  return (
    <div style={themeStyles} className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[600] p-5 animate-in fade-in duration-300 font-sans">
      
      {/* Container Glassmorphism Premium */}
      <div className="bg-[var(--surface)] p-8 sm:p-10 rounded-[2.5rem] w-full max-w-sm border border-[var(--border)] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative overflow-hidden">
        
        {/* Luz de Fundo / Efeito de Profundidade */}
        <div className="absolute top-[-20%] left-[-10%] w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-[50px] pointer-events-none" />

        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <div className="w-12 h-12 bg-[var(--primary)]/10 text-[var(--primary)] rounded-[1.2rem] flex items-center justify-center mb-4 shadow-inner border border-[var(--primary)]/20">
              <FaVideo size={18} />
            </div>
            <h3 className="font-black text-[var(--text-primary)] text-xl sm:text-2xl tracking-tighter leading-tight">
              {t.title} <span className="text-[var(--primary)] block text-lg">{exercicio.nome}</span>
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors active:scale-95"
          >
            <FaTimes size={12} />
          </button>
        </div>
        
        <div className="relative group mb-8 z-10">
          <input 
            className="w-full p-4 sm:p-5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all placeholder:text-[var(--text-secondary)] shadow-inner"
            placeholder={t.placeholder}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 relative z-10">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="flex-[0.7] p-4 sm:p-5 rounded-[1.2rem] bg-[var(--surface-sec)] text-[var(--text-primary)] font-black text-[10px] uppercase tracking-widest hover:border-[var(--border)] hover:bg-[var(--border)] transition-all active:scale-95 disabled:opacity-50 border border-transparent shadow-sm"
          >
            {t.cancel}
          </button>
          <button 
            onClick={salvar} 
            disabled={loading}
            className="flex-1 p-4 sm:p-5 rounded-[1.2rem] bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <FaSpinner className="animate-spin" size={14} />
            ) : (
              <FaSave size={14} />
            )}
            {loading ? t.saving : t.save}
          </button>
        </div>

      </div>
    </div>
  );
}