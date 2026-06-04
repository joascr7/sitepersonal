'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';
import { FaChevronLeft, FaGlobe, FaMoon, FaSun, FaExclamationCircle, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar',
    title: 'Agendar Aula',
    subtitle: 'Defina a data e horário do treino',
    confirm: 'Confirmar Agendamento',
    processing: 'Processando...',
    errDate: 'Selecione uma data e horário.',
    errProcess: 'Erro ao agendar: '
  },
  'pt-PT': {
    back: 'Voltar',
    title: 'Agendar Aula',
    subtitle: 'Defina a data e horário do treino',
    confirm: 'Confirmar Agendamento',
    processing: 'A processar...',
    errDate: 'Selecione uma data e horário.',
    errProcess: 'Erro ao agendar: '
  },
  'en': {
    back: 'Back',
    title: 'Schedule Class',
    subtitle: 'Set the training date and time',
    confirm: 'Confirm Schedule',
    processing: 'Processing...',
    errDate: 'Please select a date and time.',
    errProcess: 'Error scheduling: '
  }
};

export default function AgendarAula() {
  const { id } = useParams();
  const router = useRouter();
  const [dataHora, setDataHora] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estados UI Premium
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
  };

  const toggleLang = () => {
    const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en'];
    const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(nextLang);
    localStorage.setItem('@premium_lang', nextLang);
  };

  const t = translations[lang] || translations['pt-BR'];

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Configuração Dinâmica do Tema Premium
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  // Lógica original rigorosamente preservada, trocando apenas o alert() pelo toast nativo
  const salvarAgendamento = async () => {
    if (!dataHora) return showToast('error', t.errDate);
    
    setLoading(true);
    const { error } = await supabase.from('agendamentos').insert([
      { aluno_id: id, data_hora: dataHora }
    ]);
    
    if (error) {
      showToast('error', t.errProcess + error.message);
      setLoading(false);
    } else {
      router.push(`/dashboard/aluno/${id}`);
    }
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] flex flex-col items-center px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] box-border text-[var(--text-primary)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      {/* Elementos de Profundidade (Orbs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[100vw] sm:w-[350px] h-[100vw] sm:h-[350px] bg-[var(--primary)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Toast Flutuante Premium */}
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {/* Toggles Superiores */}
      <div className="w-full max-w-sm flex justify-end gap-2 mb-6 relative z-10">
        <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 relative">
          <FaGlobe size={14} />
          <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{lang.split('-')[0].toUpperCase()}</span>
        </button>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95">
          {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
        </button>
      </div>

      <div className="w-full max-w-sm bg-[var(--surface)]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-2xl box-border relative z-10 animate-in slide-in-from-bottom-8 duration-700">
        
        <header className="mb-10 flex flex-col gap-4">
          <button 
            onClick={() => router.back()} 
            className="self-start flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors uppercase tracking-[0.2em] active:scale-95"
          >
            <FaChevronLeft size={10} /> {t.back}
          </button>
          <div>
            <div className="w-12 h-12 bg-[var(--primary)]/10 text-[var(--primary)] rounded-[1.2rem] flex items-center justify-center mb-4">
              <FaCalendarAlt size={20} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-[var(--text-primary)]">{t.title}</h1>
            <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-1">{t.subtitle}</p>
          </div>
        </header>

        <div className="space-y-6">
          <div className="flex flex-col gap-2 w-full group">
            <input 
              type="datetime-local" 
              className={`w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm font-bold text-[var(--text-primary)] shadow-inner ${isDark ? '[color-scheme:dark]' : '[color-scheme:light]'}`}
              onChange={(e) => setDataHora(e.target.value)} 
              value={dataHora}
            />
          </div>

          <button 
            onClick={salvarAgendamento} 
            disabled={loading}
            className="w-full mt-4 bg-[var(--primary)] text-white py-5 rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20"
          >
            {loading ? t.processing : t.confirm}
          </button>
        </div>

      </div>
    </main>
  );
}