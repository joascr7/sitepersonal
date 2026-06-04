'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaSearch, FaTimes } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Copiar para qual aluno?',
    searchPlaceholder: 'Buscar aluno...',
    cancel: 'Cancelar',
    empty: 'Nenhum aluno encontrado.'
  },
  'pt-PT': {
    title: 'Copiar para qual aluno?',
    searchPlaceholder: 'Pesquisar aluno...',
    cancel: 'Cancelar',
    empty: 'Nenhum aluno encontrado.'
  },
  'en': {
    title: 'Copy to which student?',
    searchPlaceholder: 'Search student...',
    cancel: 'Cancel',
    empty: 'No students found.'
  }
};

export default function ModalSelecaoAlunos({ isOpen, onClose, onSelect }: any) {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');

  // Estados de Tema e i18n
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Inicializa Tema e Idioma ao abrir a modal
      const savedTheme = localStorage.getItem('@premium_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
      
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);
      
      setMounted(true);

      // Lógica Original de Busca Preservada
      const fetchAlunos = async () => {
        const { data } = await supabase.from('alunos').select('id, nome').order('nome');
        setAlunos(data || []);
      };
      fetchAlunos();
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const t = translations[lang];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div 
      style={themeStyles} 
      className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center p-5 z-[999] animate-in fade-in duration-300"
    >
      <div className="bg-[var(--surface)] rounded-[2.5rem] shadow-2xl w-full max-w-sm p-6 sm:p-8 border border-[var(--border)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[85vh]">
        
        {/* HEADER MODAL */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)] tracking-tight leading-tight pr-4">
            {t.title}
          </h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-all active:scale-90 shrink-0"
            aria-label={t.cancel}
          >
            <FaTimes size={14} />
          </button>
        </div>
        
        {/* INPUT DE BUSCA */}
        <div className="relative mb-6 shrink-0 group">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={14} />
          <input 
            autoFocus
            className="w-full pl-11 pr-4 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all placeholder:text-[var(--text-secondary)] placeholder:font-normal font-bold shadow-inner text-base sm:text-sm" // text-base evita zoom automático no iOS
            placeholder={t.searchPlaceholder}
            onChange={(e) => setBusca(e.target.value)}
            value={busca}
          />
        </div>
        
        {/* LISTA DE ALUNOS COM SCROLL FLUIDO */}
        <div className="overflow-y-auto flex-1 pr-2 -mr-2 space-y-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {alunosFiltrados.length > 0 ? (
            alunosFiltrados.map(aluno => (
              <button 
                key={aluno.id}
                onClick={() => onSelect(aluno.id)}
                className="w-full flex items-center justify-between text-left p-4 rounded-[1.2rem] hover:bg-[var(--surface-sec)] border border-transparent hover:border-[var(--border)] text-[var(--text-primary)] font-bold text-sm transition-all active:scale-[0.98] group"
              >
                <span className="truncate pr-4">{aluno.nome}</span>
                <span className="w-6 h-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  +
                </span>
              </button>
            ))
          ) : (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <FaSearch className="text-3xl text-[var(--text-secondary)]/30 mb-3" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                {t.empty}
              </p>
            </div>
          )}
        </div>
        
        {/* BOTÃO CANCELAR INFERIOR */}
        <button 
          onClick={onClose} 
          className="w-full mt-6 py-4 rounded-[1.2rem] bg-[var(--surface-sec)] text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors active:scale-95 shrink-0"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}