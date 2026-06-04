'use client';
import { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Métodos de Treinamento',
    addMethod: 'Adicionar Método',
    newMethodDefault: 'Novo Método'
  },
  'pt-PT': {
    title: 'Métodos de Treinamento',
    addMethod: 'Adicionar Método',
    newMethodDefault: 'Novo Método'
  },
  'en': {
    title: 'Training Methods',
    addMethod: 'Add Method',
    newMethodDefault: 'New Method'
  }
};

const METODOS_PADRAO = [
  { id: '1', nome: 'Drop-set' },
  { id: '2', nome: 'Rest-Pause' },
  { id: '3', nome: 'Bi-set' },
  { id: '4', nome: 'Tri-set' },
  { id: '5', nome: 'Pirâmide' }
];

export default function MetodosTreino() {
  const [metodos, setMetodos] = useState(METODOS_PADRAO);
  
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

  const handleEdit = (id: string, novoNome: string) => {
    setMetodos(metodos.map(m => m.id === id ? { ...m, nome: novoNome } : m));
  };

  const adicionarNovo = () => {
    const novo = { id: Date.now().toString(), nome: t.newMethodDefault || 'Novo Método' };
    setMetodos([...metodos, novo]);
  };

  if (!mounted) return (
    <div className="w-full h-80 bg-[#151A22] rounded-[2.5rem] animate-pulse" />
  );

  return (
    <div 
      style={themeStyles} 
      className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group"
    >
      {/* Efeito Glow Decorativo Premium */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-[var(--primary)]/10" />

      {/* Header do Componente */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-2 h-6 bg-[var(--primary)] rounded-full" />
        <h3 className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">
          {t.title}
        </h3>
      </div>
      
      {/* Lista de Métodos */}
      <div className="space-y-3 relative z-10">
        {metodos.map((metodo) => (
          <div key={metodo.id} className="relative">
            <input
              type="text"
              value={metodo.nome}
              onChange={(e) => handleEdit(metodo.id, e.target.value)}
              className="w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] text-base sm:text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-inner placeholder:text-[var(--text-secondary)]/50"
              placeholder="Nome do método..."
            />
          </div>
        ))}
      </div>

      {/* Ação: Adicionar Novo */}
      <button 
        onClick={adicionarNovo}
        className="mt-6 w-full py-4 bg-[var(--surface-sec)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 relative z-10 group/btn"
      >
        <div className="w-6 h-6 rounded-full bg-[var(--bg)] flex items-center justify-center group-hover/btn:text-[var(--primary)] transition-colors shadow-sm">
          <FaPlus size={10} />
        </div>
        {t.addMethod}
      </button>
    </div>
  );
}