'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ModalSelecaoAlunos from '@/components/ModalSelecaoAlunos';
import { 
  FaChevronLeft, FaGlobe, FaMoon, FaSun, FaCopy, 
  FaTrash, FaEdit, FaPlay, FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN (UX PREMIUM)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DetalheTreinoSkeleton = () => (
  <div className="max-w-3xl mx-auto space-y-8 animate-pulse pt-8 px-5">
    <div className="flex justify-between items-center mb-10">
      <div className="w-16 h-4 bg-[var(--surface-sec)] rounded-full" />
      <div className="flex gap-2"><div className="w-24 h-10 bg-[var(--surface-sec)] rounded-2xl" /><div className="w-24 h-10 bg-[var(--surface-sec)] rounded-2xl" /></div>
    </div>
    <div className="space-y-3 mb-12">
      <div className="w-64 h-10 bg-[var(--surface-sec)] rounded-2xl" />
      <div className="w-40 h-4 bg-[var(--surface-sec)] rounded-full" />
    </div>
    {[1, 2].map((i) => (
      <div key={i} className="p-8 bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)] space-y-6">
        <div className="flex justify-between items-center"><div className="w-48 h-6 bg-[var(--surface-sec)] rounded-xl" /><div className="w-16 h-8 bg-[var(--surface-sec)] rounded-xl" /></div>
        <div className="w-full h-8 bg-[var(--surface-sec)] rounded-xl" />
        <div className="w-full h-12 bg-[var(--surface-sec)] rounded-xl" />
        <div className="w-full h-12 bg-[var(--surface-sec)] rounded-xl" />
      </div>
    ))}
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar', duplicate: 'Duplicar', delete: 'Excluir', edit: 'Editar',
    titleFallback: 'Treino', subtitle: 'Detalhes e execução da série.',
    empty: 'Nenhum exercício registrado.', errorParse: 'Erro ao processar dados da ficha.',
    video: 'Vídeo', series: 'Série', reps: 'Reps', load: 'Carga', planned: 'Planej.', rest: 'Desc.',
    confirmDelete: 'Tem certeza que deseja excluir esta ficha?',
    errDupe: 'Erro ao duplicar: ', successDupe: 'Treino duplicado com sucesso!',
    errLoad: 'Erro ao carregar treino.'
  },
  'pt-PT': {
    back: 'Voltar', duplicate: 'Duplicar', delete: 'Eliminar', edit: 'Editar',
    titleFallback: 'Treino', subtitle: 'Detalhes e execução da série.',
    empty: 'Nenhum exercício registado.', errorParse: 'Erro ao processar dados da ficha.',
    video: 'Vídeo', series: 'Série', reps: 'Reps', load: 'Carga', planned: 'Planej.', rest: 'Desc.',
    confirmDelete: 'Tem certeza que deseja eliminar esta ficha?',
    errDupe: 'Erro ao duplicar: ', successDupe: 'Treino duplicado com sucesso!',
    errLoad: 'Erro ao carregar treino.'
  },
  'en': {
    back: 'Back', duplicate: 'Duplicate', delete: 'Delete', edit: 'Edit',
    titleFallback: 'Workout', subtitle: 'Details and set execution.',
    empty: 'No exercises registered.', errorParse: 'Error processing workout data.',
    video: 'Video', series: 'Set', reps: 'Reps', load: 'Load', planned: 'Target', rest: 'Rest',
    confirmDelete: 'Are you sure you want to delete this workout?',
    errDupe: 'Error duplicating: ', successDupe: 'Workout duplicated successfully!',
    errLoad: 'Error loading workout.'
  }
};

export default function DetalheTreino({ params }: { params: Promise<{ id: string; treinoId: string }> }) {
  const resolvedParams = use(params);
  const { id, treinoId } = resolvedParams;
  const router = useRouter();

  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPersonal, setIsPersonal] = useState(false);
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

  const toggleTheme = () => { const newTheme = !isDark; setIsDark(newTheme); localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light'); window.dispatchEvent(new Event('storage')); };
  const toggleLang = () => { const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en']; const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length]; setLang(nextLang); localStorage.setItem('@premium_lang', nextLang); };
  
  const t = translations[lang] || translations['pt-BR'];
  const showToast = (type: 'success' | 'error', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

  // Configuração Dinâmica do Tema Premium
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  useEffect(() => {
    if (!treinoId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: fichaData, error: fichaError } = await supabase
          .from('fichas')
          .select('*')
          .eq('id', treinoId)
          .maybeSingle();

        if (fichaError) throw new Error(fichaError.message);
        setFicha(fichaData);

        const { data: { user } } = await supabase.auth.getUser();
        const ehDono = !!(user && fichaData && String(fichaData.personal_id) === String(user.id));
        setIsPersonal(ehDono);
      } catch (err: any) {
        setErrorMsg(err.message);
        showToast('error', t.errLoad);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [treinoId, t.errLoad]);

  const duplicarTreino = async (alunoSelecionadoId: string) => {
    try {
      const { error } = await supabase.from('fichas').insert({
        nome_treino: `${ficha.nome_treino} (Cópia)`,
        descricao: ficha.descricao,
        aluno_id: alunoSelecionadoId,
        personal_id: ficha.personal_id
      });

      if (error) throw error;
      setIsModalOpen(false);
      showToast('success', t.successDupe);
      router.refresh();
    } catch (err: any) {
      console.error(t.errDupe, err.message);
      showToast('error', t.errDupe + err.message);
    }
  };

  const excluirFicha = async () => {
    if (!window.confirm(t.confirmDelete)) return;
    setLoading(true);
    const { error } = await supabase.from('fichas').update({ ativo: false }).eq('id', treinoId);
    if (!error) router.push(`/dashboard/aluno/${id}`);
    else {
      showToast('error', error.message);
      setLoading(false);
    }
  };

  const renderizarExercicios = () => {
    if (!ficha?.descricao) return <p className="text-[var(--text-secondary)] p-8 text-center uppercase tracking-widest text-[10px] font-black">{t.empty}</p>;

    try {
      const exercicios = typeof ficha.descricao === 'string' ? JSON.parse(ficha.descricao) : ficha.descricao;

      return exercicios.map((ex: any, index: number) => (
        <div key={index} className="mb-6 bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] shadow-xl overflow-hidden hover:border-[var(--primary)]/30 transition-colors">
          <div className="p-6 sm:p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]/50">
            <h3 className="font-black text-[var(--text-primary)] text-lg sm:text-xl tracking-tight">{ex.nome}</h3>
            {ex.video && (
              <a href={ex.video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-[var(--primary)] text-white px-4 py-2 sm:py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[var(--primary)]/20 shrink-0">
                <FaPlay size={10} /> <span className="hidden sm:inline">{t.video}</span>
              </a>
            )}
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[400px]">
              <div className="grid grid-cols-5 gap-2 px-6 sm:px-8 py-4 bg-[var(--surface-sec)] text-[8px] sm:text-[9px] uppercase font-black text-[var(--text-secondary)] tracking-widest border-b border-[var(--border)] text-center">
                <span>{t.series}</span><span>{t.reps}</span><span>{t.load}</span><span>{t.planned}</span><span>{t.rest}</span>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {ex.series?.map((s: any, sIndex: number) => (
                  <div key={sIndex} className="grid grid-cols-5 gap-2 px-6 sm:px-8 py-5 sm:py-6 text-xs sm:text-sm items-center text-[var(--text-primary)] font-bold text-center hover:bg-[var(--surface-sec)]/50 transition-colors">
                    <span className="text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded-lg w-fit mx-auto">{s.ordem && s.ordem.trim() !== "" ? s.ordem : sIndex + 1}</span>
                    <span>{s.reps || '-'}</span>
                    <span>{s.carga || '0'}<span className="text-[10px] text-[var(--text-secondary)] ml-0.5">kg</span></span>
                    <span className="text-[var(--text-secondary)]">{s.CargaPlanejada || '0'}<span className="text-[10px] ml-0.5">kg</span></span>
                    <span className="text-[var(--primary-soft)]">{s.intervalo || '0'}<span className="text-[10px] ml-0.5">s</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ));
    } catch (e) {
      return <p className="text-[var(--danger)] bg-[var(--danger)]/10 p-6 rounded-[2rem] text-center font-black text-sm">{t.errorParse}</p>;
    }
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Toast Flutuante */}
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {loading ? <DetalheTreinoSkeleton /> : (
        <div className="max-w-3xl mx-auto relative z-10 animate-in fade-in duration-700">
          <ModalSelecaoAlunos isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={duplicarTreino} />

          {/* Top Toggles (i18n / Theme) */}
          <div className="flex justify-end gap-2 mb-6">
            <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 relative">
              <FaGlobe size={14} />
              <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{lang.split('-')[0].toUpperCase()}</span>
            </button>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95">
              {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <button onClick={() => router.back()} className="self-start flex items-center gap-2 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest hover:text-[var(--primary)] transition-all active:scale-95">
              <FaChevronLeft size={10} /> {t.back}
            </button>
            
            {isPersonal && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-[var(--surface-sec)] text-[var(--text-primary)] border border-[var(--border)] rounded-[1.2rem] font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all active:scale-95 shadow-sm">
                  <FaCopy size={12} /> <span className="hidden sm:inline">{t.duplicate}</span>
                </button>
                <a href={`/dashboard/aluno/${id}/editar-ficha/${treinoId}`} className="flex items-center gap-2 px-5 py-3 bg-[var(--primary)] text-white rounded-[1.2rem] font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-md shadow-[var(--primary)]/20">
                  <FaEdit size={12} /> <span className="hidden sm:inline">{t.edit}</span>
                </a>
                <button onClick={excluirFicha} className="flex items-center gap-2 px-5 py-3 text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-[1.2rem] font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-[var(--danger)]/20 transition-all active:scale-95">
                  <FaTrash size={12} /> <span className="hidden sm:inline">{t.delete}</span>
                </button>
              </div>
            )}
          </div>

          <header className="mb-10 sm:mb-12 bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl">
             <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2 text-[var(--text-primary)]">{ficha?.nome_treino || t.titleFallback}</h1>
             <p className="text-[var(--text-secondary)] font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em]">{t.subtitle}</p>
          </header>

          <div className="space-y-6">
            {renderizarExercicios()}
          </div>
          
        </div>
      )}
    </main>
  );
}