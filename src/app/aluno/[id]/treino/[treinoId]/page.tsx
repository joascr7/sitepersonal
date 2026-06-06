'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ToastSucesso from '@/components/ui/ToastSucesso';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns';
import { 
  FaFilePdf, 
  FaCheck, 
  FaInfoCircle, 
  FaChevronLeft,
  FaMoon,
  FaSun,
  FaGlobe
} from "react-icons/fa";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar',
    download: 'Baixar Treino',
    totalSessions: 'Sessões Totais',
    set: 'Série',
    reps: 'Reps',
    suggestedWeight: 'Carga Sug.',
    logWeight: 'Sua Carga',
    finish: 'Finalizar Sessão',
    incomplete: 'Complete todos os exercícios',
    workoutLogged: 'Treino registrado.'
  },
  'pt-PT': {
    back: 'Voltar',
    download: 'Descarregar Treino',
    totalSessions: 'Sessões Totais',
    set: 'Série',
    reps: 'Reps',
    suggestedWeight: 'Carga Sug.',
    logWeight: 'A Sua Carga',
    finish: 'Finalizar Sessão',
    incomplete: 'Complete todos os exercícios',
    workoutLogged: 'Treino registado.'
  },
  'en': {
    back: 'Back',
    download: 'Download',
    totalSessions: 'Total Sessions',
    set: 'Set',
    reps: 'Reps',
    suggestedWeight: 'Sug. Weight',
    logWeight: 'Log Weight',
    finish: 'Finish Session',
    incomplete: 'Complete all exercises',
    workoutLogged: 'Workout logged.'
  }
};

export default function DetalheTreino({ params }: { params: Promise<{ id: string; treinoId: string }> }) {
  const resolvedParams = use(params);
  const { id, treinoId } = resolvedParams;
  const router = useRouter();

  const [ficha, setFicha] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [concluidos, setConcluidos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessoesContador, setSessoesContador] = useState(0);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [horaAtual, setHoraAtual] = useState(new Date());
  
  // Estados de Tema e i18n
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');


  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getSaudacao = () => {
    const hora = horaAtual.getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Inicialização de Tema e Idioma (Persistência)
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

  const t = translations[lang];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--primary-soft': '#60A5FA',
    '--success': '#22C55E',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--primary-soft': '#60A5FA',
    '--success': '#16A34A',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const exercicios = ficha?.descricao ? (typeof ficha.descricao === 'string' ? JSON.parse(ficha.descricao) : ficha.descricao) : [];
  const progresso = exercicios.length > 0 ? Math.round((concluidos.length / exercicios.length) * 100) : 0;
  const todosFinalizados = exercicios.length > 0 && concluidos.length === exercicios.length;

  // Renderização Inteligente de Mídia (Corrigida para GIFs e playsInline)
  const renderizarVideo = (url: string) => {
    if (!url) return null;
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isImageOrGif = url.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif)$/i);

    // Se for Youtube
    if (isYoutube) {
      const embedUrl = url.includes("shorts/") ? url.replace("shorts/", "embed/") : url.replace("watch?v=", "embed/");
      return (
        <div className="relative w-full aspect-video bg-black overflow-hidden">
          <iframe className="absolute top-0 left-0 w-full h-full" src={embedUrl.split('&')[0]} frameBorder="0" allowFullScreen />
        </div>
      );
    }

    // Se for Imagem ou GIF (O GIF dá play automaticamente na tag img)
    if (isImageOrGif) {
      return (
        <div className="relative w-full aspect-video bg-[var(--surface-sec)] overflow-hidden flex items-center justify-center">
          <img src={url} alt="Demonstração do Exercício" className="w-full h-full object-cover" />
        </div>
      );
    }

    // Se for Vídeo (MP4, etc.) - Usa playsInline para não ficar gigante no iOS
    return (
      <div className="relative w-full aspect-video bg-black overflow-hidden">
        <video 
          controls 
          playsInline 
          webkit-playsinline="true"
          preload="metadata"
          className="absolute top-0 left-0 w-full h-full object-cover" 
          src={url} 
        />
      </div>
    );
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(ficha?.nome_treino || "Treino", 14, 20);
    const tabelaDados: any[] = [];
    exercicios.forEach((ex: any) => {
      (Array.isArray(ex.series) ? ex.series : []).forEach((s: any, idx: number) => {
        const key = `${ex.nome}-${idx}`;
        tabelaDados.push([
          ex.nome, 
          s.ordem || idx + 1, 
          s.reps || '-', 
          s.carga ? `${s.carga}kg` : '-', 
          s.intervalo ? `${s.intervalo}s` : '-', 
          inputValues[key] ? `${inputValues[key]}kg` : '-'
        ]);
      });
    });
    autoTable(doc, { startY: 35, head: [['Exercício', 'Série', 'Reps', 'Carga', 'Desc.', 'Sua Carga']], body: tabelaDados });
    doc.save(`${ficha?.nome_treino || 'Treino'}.pdf`);
  };

  const fetchData = async () => {
    if (!treinoId) return;
    setLoading(true);
    const [fichaRes, regRes, concRes] = await Promise.all([
      supabase.from('fichas').select('*').eq('id', treinoId).maybeSingle(),
      supabase.from('registro_series').select('*').eq('treino_id', treinoId),
      supabase.from('conclusoes_treino').select('id', { count: 'exact' }).eq('treino_id', treinoId)
    ]);
    setFicha(fichaRes.data);
    if (regRes.data) {
      const vals: Record<string, string> = {};
      regRes.data.forEach((r: any) => vals[`${r.exercicio_nome}-${r.serie_index}`] = r.carga.toString());
      setInputValues(vals);
      setRegistros(regRes.data);
    }
    setSessoesContador(concRes.count || 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [treinoId]);

  const registrarCarga = async (nomeExercicio: string, carga: number, reps: number, serieIndex: number) => {
    if (!carga || carga <= 0) return;
    const registroExistente = registros.find(r => r.exercicio_nome === nomeExercicio && r.serie_index === serieIndex);
    const payload = { aluno_id: id, treino_id: treinoId, exercicio_nome: nomeExercicio, carga, repeticoes: reps, serie_index: serieIndex };
    const { data } = await supabase.from('registro_series').upsert((registroExistente ? { ...payload, id: registroExistente.id } : payload) as any).select();
    if (data) setRegistros(prev => [...prev.filter(r => r.id !== data[0].id), ...data]);
  };

  const finalizarSessao = async () => {
    setLoading(true);
    await Promise.all([
      supabase.from('conclusoes_treino').insert({ aluno_id: id, treino_id: treinoId, data_conclusao: new Date().toISOString() }),
      supabase.from('historico_treinos').insert({ aluno_id: id, data_treino: new Date().toISOString() })
    ]);
    setShowToast(true);
    setLoading(false);
  };

  if (loading) return (
    <main style={themeStyles} className="min-h-screen bg-[var(--bg)] p-6 space-y-6 animate-pulse pt-[max(env(safe-area-inset-top),2rem)]">
      <div className="flex justify-between items-center mb-10">
        <div className="w-20 h-10 bg-[var(--surface-sec)] rounded-full" />
        <div className="w-32 h-10 bg-[var(--surface-sec)] rounded-full" />
      </div>
      <div className="space-y-4">
        <div className="w-3/4 h-10 bg-[var(--surface-sec)] rounded-full" />
        <div className="w-1/3 h-4 bg-[var(--surface-sec)] rounded-full" />
        <div className="w-full h-2 bg-[var(--surface-sec)] rounded-full mt-6" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] overflow-hidden space-y-4">
          <div className="w-full aspect-video bg-[var(--surface-sec)]" />
          <div className="p-6 space-y-4">
            <div className="w-1/2 h-6 bg-[var(--surface-sec)] rounded-full" />
            <div className="w-full h-12 bg-[var(--surface-sec)] rounded-xl" />
          </div>
        </div>
      ))}
    </main>
  );
  
  return (
    <main 
      style={themeStyles} 
      className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pt-[max(env(safe-area-inset-top),1.5rem)] pb-[env(safe-area-inset-bottom)] px-4"
    >
      <div className="max-w-2xl mx-auto pb-32">
        
        {/* ━━━━━━━━━━ HEADER COMPACTO ━━━━━━━━━━ */}
        <header className="flex justify-between items-center mb-8 pt-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] active:scale-95 transition-all shadow-sm"
            >
              <FaChevronLeft size={12} />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                {getSaudacao()}, {ficha?.aluno_nome?.split(' ')[0] || 'Aluno'}!
              </p>
              <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest">
                {format(horaAtual, 'HH:mm:ss')}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={gerarPDF} 
              className="flex items-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[var(--primary)]/20 active:scale-95 transition-all shadow-sm"
            >
              <FaFilePdf /> <span className="hidden sm:inline">{t.download}</span>
            </button>
            <div className="flex bg-[var(--surface)] rounded-full border border-[var(--border)] p-1 shadow-sm">
              <button onClick={toggleLang} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                <FaGlobe size={14} />
              </button>
              <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>
            </div>
          </div>
        </header>

        {/* ━━━━━━━━━━ TÍTULO E PROGRESSO ━━━━━━━━━━ */}
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight leading-tight">{ficha?.nome_treino}</h1>
          <p className="text-[var(--primary)] font-bold text-[11px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
            {t.totalSessions}: <span className="text-[var(--text-primary)]">{sessoesContador}</span>
          </p>
          
          <div className="w-full h-2 bg-[var(--surface-sec)] mt-6 rounded-full overflow-hidden border border-[var(--border)] shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-[var(--primary-soft)] to-[var(--primary)] transition-all duration-700 ease-out relative" 
              style={{ width: `${progresso}%` }} 
            >
              <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/20 blur-sm" />
            </div>
          </div>
        </div>
        
        {/* ━━━━━━━━━━ LISTA DE EXERCÍCIOS ━━━━━━━━━━ */}
        <div className="space-y-6">
          {exercicios.map((ex: any, exIndex: number) => {
            const isConcluido = concluidos.includes(exIndex);
            
            return (
              <div 
                key={exIndex} 
                className={`bg-[var(--surface)] rounded-[2rem] border overflow-hidden transition-all duration-500 shadow-sm ${
                  isConcluido 
                    ? 'border-[var(--primary)] shadow-[0_0_20px_rgba(37,99,235,0.15)] ring-1 ring-[var(--primary)]/50' 
                    : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Vídeo (Topo no mobile, Esquerda no desktop) */}
                  {ex.video && (
                    <div className="w-full sm:w-2/5 shrink-0 bg-black border-b sm:border-b-0 sm:border-r border-[var(--border)]">
                      {renderizarVideo(ex.video)}
                    </div>
                  )}
                  
                  {/* Informações do Exercício */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-5">
                      <h3 className="font-black text-[var(--text-primary)] text-lg leading-tight tracking-tight pr-4">{ex.nome}</h3>
                      <button 
                        onClick={() => !isConcluido && setConcluidos([...concluidos, exIndex])} 
                        className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-90 ${
                          isConcluido 
                            ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/40 scale-105' 
                            : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30'
                        }`}
                      >
                        <FaCheck className={isConcluido ? 'text-lg' : 'text-sm'} />
                      </button>
                    </div>
                    
                    {ex.observacao && (
                      <div className="mb-6 p-3 bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-bold rounded-xl border border-[var(--primary)]/20 flex items-start gap-2 leading-relaxed">
                        <FaInfoCircle className="mt-0.5 shrink-0 text-sm"/> 
                        <span>{ex.observacao}</span>
                      </div>
                    )}

                    {/* Tabela de Séries */}
                    <div className="bg-[var(--surface-sec)] rounded-[1.2rem] p-3 border border-[var(--border)]">
                      {/* Cabeçalho da Grade */}
                      <div className="grid grid-cols-4 gap-2 mb-2 px-2">
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">{t.set}</span>
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">{t.reps}</span>
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">{t.suggestedWeight}</span>
                        <span className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest text-center">{t.logWeight}</span>
                      </div>

                      <div className="space-y-2">
                        {Array.isArray(ex.series) && ex.series.map((s: any, sIndex: number) => {
                          const key = `${ex.nome}-${sIndex}`;
                          return (
                            <div key={sIndex} className="grid grid-cols-4 items-center gap-2 bg-[var(--bg)] p-2 rounded-xl border border-[var(--border)] shadow-inner">
                              <span className="text-[11px] font-black text-[var(--text-secondary)] text-center">{s.ordem || sIndex + 1}ª</span>
                              <span className="text-[12px] font-bold text-[var(--text-primary)] text-center">{s.reps}x</span>
                              <span className="text-[12px] font-bold text-[var(--text-primary)] text-center">{s.carga || 0}kg</span>
                              
                              {/* Input otimizado: text-base (16px) previne zoom no iOS Safari */}
                              <div className="relative flex items-center justify-center">
                                <input 
                                  type="number" 
                                  placeholder="0" 
                                  value={inputValues[key] || ''} 
                                  onChange={(e) => setInputValues(prev => ({ ...prev, [key]: e.target.value }))}
                                  onBlur={(e) => registrarCarga(ex.nome, Number(e.target.value), s.reps, sIndex)}
                                  className="w-full bg-[var(--surface)] text-[var(--primary)] rounded-lg py-2 px-1 text-base sm:text-sm font-black text-center border border-[var(--border)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all placeholder:text-[var(--text-secondary)] placeholder:font-normal shadow-sm"
                                  style={{ WebkitAppearance: 'none', margin: 0 }}
                                />
                                {inputValues[key] && <span className="absolute right-1 text-[9px] font-bold text-[var(--primary)]/50 pointer-events-none">kg</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ━━━━━━━━━━ BOTÃO DE FINALIZAR ━━━━━━━━━━ */}
        <div className="mt-10 mb-8 sticky bottom-[env(safe-area-inset-bottom,20px)] z-50">
          <button 
            onClick={finalizarSessao} 
            disabled={!todosFinalizados} 
            className={`w-full py-5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] transition-all duration-300 transform ${
              todosFinalizados 
                ? 'bg-[var(--primary)] text-white shadow-[0_10px_30px_-10px_var(--primary)] hover:bg-blue-600 active:scale-[0.98]' 
                : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] opacity-80 cursor-not-allowed'
            }`}
          >
            {todosFinalizados ? t.finish : t.incomplete}
          </button>
        </div>

        {showToast && <ToastSucesso mensagem={t.workoutLogged} onClose={() => router.push(`/aluno/${id}`)} />}
        
        {/* ESPAÇADOR DE SEGURANÇA (Garante que o scroll passe da navbar inferior e do botão sticky) */}
        <div className="h-40 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}