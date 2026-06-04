'use client';
import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { salvarFeedbackNoBanco } from '@/lib/actions';
import { FaChevronLeft, FaMoon, FaSun, FaGlobe, FaExclamationCircle } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Feedback do Treino',
    subtitle: 'Como você se sentiu hoje?',
    intensity: 'Intensidade (1 a 10)',
    performance: 'Como foi seu desempenho?',
    selectPlaceholder: 'Selecione...',
    energized: 'Energizado ⚡',
    tired: 'Cansado 😴',
    challenging: 'Desafiador 🔥',
    normal: 'Dentro do planejado ✅',
    notes: 'Anotações para o Personal',
    notesPlaceholder: 'Ex: Tive dificuldade no exercício X...',
    send: 'Enviar Feedback',
    sending: 'Enviando...',
    errorIntensity: 'Por favor, selecione a intensidade do treino.',
    errorGeneral: 'Erro ao registrar feedback: ',
    back: 'Voltar'
  },
  'pt-PT': {
    title: 'Feedback do Treino',
    subtitle: 'Como se sentiu hoje?',
    intensity: 'Intensidade (1 a 10)',
    performance: 'Como foi o seu desempenho?',
    selectPlaceholder: 'Selecione...',
    energized: 'Energizado ⚡',
    tired: 'Cansado 😴',
    challenging: 'Desafiador 🔥',
    normal: 'Dentro do planeado ✅',
    notes: 'Anotações para o Personal',
    notesPlaceholder: 'Ex: Tive dificuldade no exercício X...',
    send: 'Enviar Feedback',
    sending: 'A enviar...',
    errorIntensity: 'Por favor, selecione a intensidade do treino.',
    errorGeneral: 'Erro ao registar feedback: ',
    back: 'Voltar'
  },
  'en': {
    title: 'Workout Feedback',
    subtitle: 'How did you feel today?',
    intensity: 'Intensity (1 to 10)',
    performance: 'How was your performance?',
    selectPlaceholder: 'Select...',
    energized: 'Energized ⚡',
    tired: 'Tired 😴',
    challenging: 'Challenging 🔥',
    normal: 'As planned ✅',
    notes: 'Notes for your Trainer',
    notesPlaceholder: 'Ex: I struggled with exercise X...',
    send: 'Submit Feedback',
    sending: 'Submitting...',
    errorIntensity: 'Please select the workout intensity.',
    errorGeneral: 'Error submitting feedback: ',
    back: 'Back'
  }
};

export default function RegistrarEvolucaoAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    sentimento: '',
    intensidade: 0,
    observacoes: ''
  });

  // Estados de Tema, i18n e Notificações (Substituindo o alert padrão)
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light');
  };

  const toggleLang = () => {
    const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en'];
    const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(nextLang);
    localStorage.setItem('@premium_lang', nextLang);
  };

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000); // Auto-hide após 4s
  };

  const t = translations[lang];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--primary-soft': '#60A5FA',
    '--danger': '#EF4444',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--primary-soft': '#60A5FA',
    '--danger': '#DC2626',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const salvarFeedback = async () => {
    if (form.intensidade === 0) {
      showToast(t.errorIntensity, 'error');
      return;
    }

    setLoading(true);

    try {
      const { data: aluno } = await supabase
        .from('alunos')
        .select('personal_id')
        .eq('id', id)
        .single();

      const { error } = await salvarFeedbackNoBanco(id, { 
        intensidade: form.intensidade,
        sentimento: form.sentimento,
        observacoes: form.observacoes,
        personal_id: aluno?.personal_id
      });
      
      if (error) throw error;
      router.back();
    } catch (err: any) {
      showToast(t.errorGeneral + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main 
      style={themeStyles} 
      className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pt-[max(env(safe-area-inset-top),1.5rem)] pb-[env(safe-area-inset-bottom)] px-4"
    >
      {/* ━━━━━━━━━━ NOTIFICAÇÃO PREMIUM FLOATING ━━━━━━━━━━ */}
      {toast && (
        <div className="fixed top-[max(env(safe-area-inset-top,20px),20px)] left-4 right-4 z-[9999] flex justify-center animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[var(--surface-sec)] border border-[var(--danger)]/30 shadow-2xl rounded-[1.2rem] px-5 py-4 flex items-center gap-3 backdrop-blur-xl">
            <div className="w-8 h-8 rounded-full bg-[var(--danger)]/10 flex items-center justify-center shrink-0">
              <FaExclamationCircle className="text-[var(--danger)]" />
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto pb-32">
        
        {/* ━━━━━━━━━━ HEADER COMPACTO ━━━━━━━━━━ */}
        <header className="flex justify-between items-center mb-8 pt-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface)] px-4 py-2.5 rounded-full border border-[var(--border)] active:scale-95 transition-all shadow-sm"
          >
            <FaChevronLeft size={10} /> {t.back}
          </button>
          
          <div className="flex bg-[var(--surface)] rounded-full border border-[var(--border)] p-1 shadow-sm">
            <button onClick={toggleLang} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
              <FaGlobe size={14} />
            </button>
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
              {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>
          </div>
        </header>

        {/* ━━━━━━━━━━ TÍTULO ━━━━━━━━━━ */}
        <div className="mb-10 px-2">
          <h1 className="text-3xl font-black tracking-tight leading-tight">{t.title}</h1>
          <p className="text-[var(--primary)] font-bold text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-80"></span>
            {t.subtitle}
          </p>
        </div>

        {/* ━━━━━━━━━━ FORMULÁRIO ━━━━━━━━━━ */}
        <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-8">
          
          {/* Intensidade */}
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-4 block">
              {t.intensity}
            </label>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button 
                  key={num}
                  onClick={() => setForm({...form, intensidade: num})}
                  className={`h-12 sm:h-14 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 active:scale-90 flex items-center justify-center ${
                    form.intensidade === num 
                      ? 'bg-[var(--primary)] text-white shadow-[0_4px_15px_-3px_var(--primary)] scale-105' 
                      : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/30 hover:text-[var(--text-primary)]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            
            {/* Legend (Opcional, dá um toque premium) */}
            <div className="flex justify-between items-center mt-3 px-1">
              <span className="text-[9px] font-bold text-[var(--text-secondary)]/60 uppercase tracking-widest">Leve</span>
              <span className="text-[9px] font-bold text-[var(--text-secondary)]/60 uppercase tracking-widest">Extremo</span>
            </div>
          </div>

          {/* Desempenho */}
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-3 block">
              {t.performance}
            </label>
            <div className="relative">
              {/* text-base previne o zoom automático no iOS Safari ao focar no select */}
              <select 
                className="w-full p-4 pl-5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-2xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-base text-[var(--text-primary)] font-bold shadow-inner appearance-none cursor-pointer"
                onChange={(e) => setForm({...form, sentimento: e.target.value})}
                value={form.sentimento}
              >
                <option value="" disabled className="text-[var(--text-secondary)]">{t.selectPlaceholder}</option>
                <option value="Energizado">{t.energized}</option>
                <option value="Cansado">{t.tired}</option>
                <option value="Desafiador">{t.challenging}</option>
                <option value="Normal">{t.normal}</option>
              </select>
              {/* Custom Caret */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                ▼
              </div>
            </div>
          </div>

          {/* Anotações */}
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-3 block">
              {t.notes}
            </label>
            <textarea 
              className="w-full p-5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-2xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-base text-[var(--text-primary)] min-h-[140px] shadow-inner placeholder:text-[var(--text-secondary)] placeholder:font-normal font-medium resize-none"
              placeholder={t.notesPlaceholder}
              onChange={(e) => setForm({...form, observacoes: e.target.value})}
              value={form.observacoes}
            />
          </div>
        </div>
        
        {/* ━━━━━━━━━━ BOTÃO DE ENVIAR ━━━━━━━━━━ */}
        <button 
          onClick={salvarFeedback} 
          disabled={loading}
          className={`w-full mt-8 py-5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] transition-all duration-300 transform active:scale-[0.98] ${
            loading
              ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] cursor-not-allowed border border-[var(--border)]'
              : 'bg-[var(--primary)] text-white shadow-[0_10px_30px_-10px_var(--primary)] hover:bg-blue-600'
          }`}
        >
          {loading ? t.sending : t.send}
        </button>

        {/* ESPAÇADOR DE SEGURANÇA (Garante folga para a navbar inferior) */}
        <div className="h-40 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}
