'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ToastSucesso from '@/components/ui/ToastSucesso';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from 'date-fns';
import ParqForm from '@/components/ParqForm';
import { 
  FaFilePdf, FaCheck, FaInfoCircle, FaChevronLeft, 
  FaMoon, FaSun, FaGlobe, FaStopwatch, FaTimes, FaBell,
  FaPlay, FaClock, FaCalendarAlt
} from "react-icons/fa";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIPAGENS 
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface Serie {
  ordem?: number;
  reps?: string;
  carga?: number;
  unidadeCarga?: string;
  intervalo?: string;
}

interface Exercicio {
  nome: string;
  video?: string;
  observacao?: string;
  series: Serie[];
}

interface Ficha {
  id: string;
  nome_treino: string;
  aluno_nome?: string;
  descricao: any;
  data_inicio?: string;
  data_vencimento?: string;
}

interface RegistroSerie {
  id: string;
  treino_id: string;
  exercicio_nome: string;
  serie_index: number;
  carga: number;
  unidade_carga: string;
  repeticoes: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar', download: 'Baixar Treino', totalSessions: 'Sessões Totais',
    set: 'Série', reps: 'Reps', load: 'Carga', rest: 'Descanso',
    finish: 'Finalizar Sessão', incomplete: 'Complete todos os exercícios',
    workoutLogged: 'Treino registrado com sucesso!',
    timerReady: 'Pronto! Vamos lá.', timerRest: 'Descanso',
    errorLoading: 'Erro ao carregar o treino.', errorSaving: 'Erro ao salvar o treino.',
    startWorkout: 'Iniciar Treino', ready: 'Pronto para treinar?'
  },
  'pt-PT': {
    back: 'Voltar', download: 'Descarregar Treino', totalSessions: 'Sessões Totais',
    set: 'Série', reps: 'Reps', load: 'Carga', rest: 'Desc.',
    finish: 'Finalizar Sessão', incomplete: 'Complete todos os exercícios',
    workoutLogged: 'Treino registado com sucesso!',
    timerReady: 'Pronto! Vamos lá.', timerRest: 'Descanso',
    errorLoading: 'Erro ao carregar o treino.', errorSaving: 'Erro ao guardar o treino.',
    startWorkout: 'Iniciar Treino', ready: 'Pronto para treinar?'
  },
  'en': {
    back: 'Back', download: 'Download', totalSessions: 'Total Sessions',
    set: 'Set', reps: 'Reps', load: 'Load', rest: 'Rest',
    finish: 'Finish Session', incomplete: 'Complete all exercises',
    workoutLogged: 'Workout logged successfully!',
    timerReady: 'Ready! Lets go.', timerRest: 'Resting',
    errorLoading: 'Error loading workout.', errorSaving: 'Error saving workout.',
    startWorkout: 'Start Workout', ready: 'Ready to train?'
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNÇÃO ADICIONADA: EXTRAI O ID DO YOUTUBE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const getYouTubeId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const CabecalhoRelogio = ({ nomeAluno }: { nomeAluno?: string }) => {
  const [horaAtual, setHoraAtual] = useState(new Date());

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

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
        {getSaudacao()}, {nomeAluno?.split(' ')[0] || 'Aluno'}!
      </p>
      <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest">
        {format(horaAtual, 'HH:mm:ss')}
      </p>
    </div>
  );
};

export default function DetalheTreino({ params }: { params: Promise<{ id: string; treinoId: string }> }) {
  const resolvedParams = use(params);
  const { id, treinoId } = resolvedParams;
  const router = useRouter();

  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [registros, setRegistros] = useState<RegistroSerie[]>([]);
  const [concluidos, setConcluidos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessoesContador, setSessoesContador] = useState(0);
  const [precisaParq, setPrecisaParq] = useState(false);
  
  const [treinoIniciado, setTreinoIniciado] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [segundosTreino, setSegundosTreino] = useState(0);
  
  const [cronometroModalAberto, setCronometroModalAberto] = useState(false);
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);
  const [timerAtivo, setTimerAtivo] = useState(false);

  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [inputUnits, setInputUnits] = useState<Record<string, string>>({});
  
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [videoAberto, setVideoAberto] = useState<string | null>(null);
  
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: aluno, error: alunoError } = await supabase.from('alunos').select('status_pagamento, data_vencimento, parq_valido').eq('id', id).single();
        if (alunoError) throw alunoError;

        if (aluno) {
          const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
          const vencimento = aluno.data_vencimento ? new Date(aluno.data_vencimento) : new Date(0);
          const dataLimite = new Date(vencimento); dataLimite.setDate(dataLimite.getDate() + 2);
          
          if (aluno.status_pagamento === 'bloqueado' || hoje > dataLimite) {
            router.push('/aluno/pagamento-pendente'); return;
          }
          if (aluno.parq_valido === false || aluno.parq_valido === null) {
            setPrecisaParq(true); setLoading(false); return; 
          }
        }
      } catch (err) {
        console.error("Erro na inicialização do aluno:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (treinoIniciado) interval = setInterval(() => setSegundosTreino(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [treinoIniciado]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerAtivo && tempoRestante !== null && tempoRestante > 0) interval = setInterval(() => setTempoRestante(prev => prev! - 1), 1000);
    else if (tempoRestante === 0) { setTimerAtivo(false); setTimeout(() => setTempoRestante(null), 4000); }
    return () => clearInterval(interval);
  }, [timerAtivo, tempoRestante]);

  const parseIntervalo = (intervaloStr: string) => {
    if (!intervaloStr) return 0;
    const str = String(intervaloStr).toLowerCase();
    let multiplier = 1;
    if (str.includes('min') || str.includes('m')) multiplier = 60;
    const match = str.match(/\d+/);
    if (match) return parseInt(match[0], 10) * multiplier;
    return 0;
  };

  const iniciarCronometroDescanso = (intervaloStr: string) => {
    const segundos = parseIntervalo(intervaloStr);
    if (segundos > 0) { setTempoRestante(segundos); setTimerAtivo(true); setCronometroModalAberto(true); }
  };

  const formatarTempoGeral = (segundos: number) => {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const formatarTempoDescanso = (segundos: number) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleTheme = () => { const newTheme = !isDark; setIsDark(newTheme); localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light'); };
  const toggleLang = () => { const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en']; const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length]; setLang(nextLang); localStorage.setItem('@premium_lang', nextLang); };

  const t = translations[lang];

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--primary-soft': '#60A5FA', '--success': '#22C55E', '--danger': '#EF4444', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--primary-soft': '#60A5FA', '--success': '#16A34A', '--danger': '#DC2626', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const getExercicios = (descricaoStr: any): Exercicio[] => {
    if (!descricaoStr) return [];
    try {
      const parsed = typeof descricaoStr === 'string' ? JSON.parse(descricaoStr) : descricaoStr;
      if (parsed.subdivisoes) return parsed.subdivisoes.flatMap((s: any) => s.exercicios || []);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].exercicios) return parsed.flatMap((s: any) => s.exercicios || []);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

  const exercicios = getExercicios(ficha?.descricao);
  const progresso = exercicios.length > 0 ? Math.round((concluidos.length / exercicios.length) * 100) : 0;
  const todosFinalizados = exercicios.length > 0 && concluidos.length === exercicios.length;

  const renderizarVideo = (url: string) => {
    if (!url) return null;
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isImageOrGif = url.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif)$/i);

    if (isYoutube) {
      const embedUrl = url.includes("shorts/") ? url.replace("shorts/", "embed/") : url.replace("watch?v=", "embed/");
      return <div className="relative w-full aspect-video bg-black overflow-hidden"><iframe className="absolute top-0 left-0 w-full h-full" src={embedUrl.split('&')[0]} frameBorder="0" allowFullScreen /></div>;
    }
    if (isImageOrGif) {
      return <div className="relative w-full aspect-video bg-[var(--surface-sec)] overflow-hidden flex items-center justify-center"><img src={url} alt="Demonstração" className="w-full h-full object-cover" /></div>;
    }
    return <div className="relative w-full aspect-video bg-black overflow-hidden"><video controls playsInline webkit-playsinline="true" preload="metadata" className="absolute top-0 left-0 w-full h-full object-cover" src={url} /></div>;
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(ficha?.nome_treino || "Treino", 14, 20);
    const tabelaDados: any[] = [];
    exercicios.forEach((ex) => {
      (Array.isArray(ex.series) ? ex.series : []).forEach((s, idx) => {
        const key = `${ex.nome}-${idx}`;
        tabelaDados.push([ ex.nome, s.ordem || idx + 1, s.reps || '-', inputValues[key] ? `${inputValues[key]}${inputUnits[key] || 'kg'}` : (s.carga ? `${s.carga}${s.unidadeCarga || 'kg'}` : '-'), s.intervalo ? `${s.intervalo}` : '-' ]);
      });
    });
    autoTable(doc, { startY: 35, head: [['Exercício', 'Série', 'Reps', 'Carga Registrada', 'Desc.']], body: tabelaDados });
    doc.save(`${ficha?.nome_treino || 'Treino'}.pdf`);
  };

  const fetchData = async () => {
    if (!treinoId) return;
    setLoading(true);
    try {
      const [fichaRes, regRes, concRes] = await Promise.all([
        supabase.from('fichas').select('*, data_inicio, data_vencimento').eq('id', treinoId).maybeSingle(),
        supabase.from('registro_series').select('id, treino_id, exercicio_nome, serie_index, carga, repeticoes, unidade_carga').eq('treino_id', treinoId),
        supabase.from('conclusoes_treino').select('id', { count: 'exact' }).eq('treino_id', treinoId)
      ]);
      
      if (fichaRes.error) throw fichaRes.error;
      setFicha(fichaRes.data as Ficha);
      
      if (regRes.data) {
        const vals: Record<string, string> = {};
        const units: Record<string, string> = {};
        (regRes.data as RegistroSerie[]).forEach((r) => {
          const k = `${r.exercicio_nome}-${r.serie_index}`;
          vals[k] = r.carga.toString();
          if (r.unidade_carga) units[k] = r.unidade_carga;
        });
        setInputValues(vals);
        setInputUnits(units);
        setRegistros(regRes.data as RegistroSerie[]);
      }
      setSessoesContador(concRes.count || 0);
    } catch (error) {
      console.error("Erro ao carregar os dados:", error);
      alert(t.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [treinoId]);

  const registrarCarga = async (nomeExercicio: string, carga: number, unidade: string, reps: string, serieIndex: number) => {
    const registroExistente = registros.find(r => r.exercicio_nome === nomeExercicio && r.serie_index === serieIndex);
    
    // CORREÇÃO: Removido o bloqueio de "carga 0" para que os exercícios de peso corporal apareçam no Dashboard!
    const payload = { 
      aluno_id: id, 
      treino_id: treinoId, 
      exercicio_nome: nomeExercicio, 
      carga: Number(carga) || 0, 
      repeticoes: Number(reps) || 0, 
      serie_index: serieIndex,
      unidade_carga: unidade || 'kg'
    };

    const dadosParaUpsert = registroExistente ? { ...payload, id: registroExistente.id } : payload;

    try {
      const { data, error } = await supabase.from('registro_series').upsert(dadosParaUpsert as any).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setRegistros(prev => [...prev.filter(r => r.id !== data[0].id), ...(data as any)]);
      }
    } catch (error: any) {
      console.error("Erro ao salvar carga:", error.message);
    }
  };

 const finalizarSessao = async () => {
  setSaving(true);
  try {
    const dataFim = new Date();
    const dataInicioIso = dataInicio ? dataInicio.toISOString() : dataFim.toISOString();
    const dataFimIso = dataFim.toISOString();
    const duracaoMinutos = Math.max(1, Math.ceil(segundosTreino / 60));

    await supabase.from('conclusoes_treino').insert({ 
      aluno_id: id, treino_id: treinoId || null, data_inicio: dataInicioIso, data_fim: dataFimIso, duracao_minutos: duracaoMinutos, data_conclusao: dataFimIso 
    });

    await supabase.from('historico_treinos').insert({ 
      aluno_id: id, treino_id: treinoId || null, data_treino: dataFimIso 
    });

    setTreinoIniciado(false);
    setToastMsg(t.workoutLogged);
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
      router.push(`/aluno/${id}/treinos`);
    }, 2000);

  } catch (error: any) {
    alert(`Erro ao salvar treino: ${error.message}`);
  } finally {
    setSaving(false);
  }
};

  if (precisaParq) {
    return (
      <div style={themeStyles} className="min-h-screen bg-[var(--bg)] pt-10 px-4 pb-20">
        <ParqForm alunoId={id} onComplete={() => window.location.reload()} />
      </div>
    );
  }

  if (loading) return (
    <main style={themeStyles} className="min-h-screen bg-[var(--bg)] p-6 space-y-6 animate-pulse pt-[max(env(safe-area-inset-top),2rem)]">
      <div className="flex justify-between items-center mb-10"><div className="w-20 h-10 bg-[var(--surface-sec)] rounded-full" /><div className="w-32 h-10 bg-[var(--surface-sec)] rounded-full" /></div>
      <div className="space-y-4"><div className="w-3/4 h-10 bg-[var(--surface-sec)] rounded-full" /><div className="w-1/3 h-4 bg-[var(--surface-sec)] rounded-full" /><div className="w-full h-2 bg-[var(--surface-sec)] rounded-full mt-6" /></div>
    </main>
  );
  
  return (
    <main style={themeStyles} className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pt-[max(env(safe-area-inset-top),1.5rem)] pb-[env(safe-area-inset-bottom)] px-4 relative">
      
      {tempoRestante !== null && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 z-[100] border shadow-2xl px-5 py-3 rounded-full flex items-center gap-4 transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
          tempoRestante === 0 ? 'bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)] backdrop-blur-md' : 'bg-[var(--surface)]/90 border-[var(--primary)]/30 text-[var(--text-primary)] backdrop-blur-xl'
        }`}>
          {tempoRestante === 0 ? <FaBell className="animate-bounce" size={16} /> : <div className="w-3 h-3 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_10px_var(--primary)]" />}
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-widest opacity-80 leading-none">{tempoRestante === 0 ? t.timerReady : t.timerRest}</span>
            <span className="font-black text-xl font-mono leading-none tracking-tight">{formatarTempoDescanso(tempoRestante)}</span>
          </div>
          <button onClick={() => setTempoRestante(null)} className="ml-2 w-8 h-8 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors"><FaTimes size={12} /></button>
        </div>
      )}

      {/* PLAYER DE VÍDEO NATIVO IN-APP */}
      {videoAberto && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button onClick={() => setVideoAberto(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"><FaTimes size={20}/></button>
          <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {getYouTubeId(videoAberto) ? (
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYouTubeId(videoAberto)}?autoplay=1`} allow="autoplay; fullscreen" />
            ) : videoAberto.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
              <img src={videoAberto} className="w-full h-full object-contain" />
            ) : (
              <video src={videoAberto} controls autoPlay playsInline className="w-full h-full object-contain" />
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto pb-32">
        <header className="flex justify-between items-center mb-8 pt-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] active:scale-95 transition-all shadow-sm">
              <FaChevronLeft size={12} />
            </button>
            <CabecalhoRelogio nomeAluno={ficha?.aluno_nome} />
          </div>
          <div className="flex gap-2">
            <button onClick={gerarPDF} className="flex items-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[var(--primary)]/20 active:scale-95 transition-all shadow-sm">
              <FaFilePdf /> <span className="hidden sm:inline">{t.download}</span>
            </button>
            <div className="flex bg-[var(--surface)] rounded-full border border-[var(--border)] p-1 shadow-sm">
              <button onClick={toggleLang} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"><FaGlobe size={14} /></button>
              <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">{isDark ? <FaSun size={14} /> : <FaMoon size={14} />}</button>
            </div>
          </div>
        </header>

        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-tight">{ficha?.nome_treino}</h1>
              <p className="text-[var(--primary)] font-bold text-[11px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
                {t.totalSessions}: <span className="text-[var(--text-primary)]">{sessoesContador}</span>
              </p>
            </div>
            {treinoIniciado && (
              <div className="flex flex-col items-end bg-[var(--primary)]/10 px-4 py-2 rounded-2xl border border-[var(--primary)]/20">
                <span className="text-[8px] font-black uppercase text-[var(--primary)] tracking-widest mb-1 flex items-center gap-1"><FaClock size={8}/> Tempo Decorrido</span>
                <span className="font-mono text-xl font-black text-[var(--primary)] leading-none">{formatarTempoGeral(segundosTreino)}</span>
              </div>
            )}
          </div>

          {/* DATAS DE INÍCIO E VENCIMENTO */}
          {(ficha?.data_inicio || ficha?.data_vencimento) && (
            <div className="flex gap-3 mb-6">
              {ficha.data_inicio && (
                <div className="flex-1 bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] flex items-center gap-3 shadow-sm">
                  <div className="text-[var(--primary)] bg-[var(--primary)]/10 p-2.5 rounded-lg"><FaCalendarAlt size={14} /></div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-widest">Início</p>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{new Date(ficha.data_inicio).toLocaleDateString(lang)}</p>
                  </div>
                </div>
              )}
              {ficha.data_vencimento && (
                <div className="flex-1 bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] flex items-center gap-3 shadow-sm">
                  <div className="text-[var(--danger)] bg-[var(--danger)]/10 p-2.5 rounded-lg"><FaCalendarAlt size={14} /></div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-widest">Vencimento</p>
                    <p className="text-xs font-bold text-[var(--danger)]">{new Date(ficha.data_vencimento).toLocaleDateString(lang)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="w-full h-2 bg-[var(--surface-sec)] rounded-full overflow-hidden border border-[var(--border)] shadow-inner">
            <div className="h-full bg-gradient-to-r from-[var(--primary-soft)] to-[var(--primary)] transition-all duration-700 ease-out relative" style={{ width: `${progresso}%` }}>
              <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/20 blur-sm" />
            </div>
          </div>
        </div>

        {!treinoIniciado && (
           <div className="bg-[var(--surface)] p-8 rounded-[2rem] text-center border border-[var(--border)] mb-8 shadow-xl animate-in zoom-in-95">
             <h2 className="text-2xl font-black mb-2">{t.ready}</h2>
             <p className="text-[var(--text-secondary)] text-xs mb-6 font-medium">Inicie o cronômetro para começar a sua sessão e registrar seu tempo.</p>
             <button onClick={() => { setTreinoIniciado(true); setDataInicio(new Date()); }} className="w-full py-5 bg-[var(--primary)] text-white rounded-[1.2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-[var(--primary)]/20 active:scale-95 transition-all">
               <FaPlay size={14} /> {t.startWorkout}
             </button>
           </div>
        )}
        
        <div className={`space-y-6 transition-all duration-500 ${treinoIniciado ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {exercicios.map((ex, exIndex) => {
            const isConcluido = concluidos.includes(exIndex);
            
            return (
              <div key={exIndex} className={`bg-[var(--surface)] rounded-[2rem] border overflow-hidden transition-all duration-500 shadow-sm ${isConcluido ? 'border-[var(--primary)] shadow-[0_0_20px_rgba(37,99,235,0.15)] ring-1 ring-[var(--primary)]/50' : 'border-[var(--border)] hover:border-[var(--primary)]/30'}`}>
                <div className="flex flex-col sm:flex-row">
                  {ex.video && (
                    <div className="w-full sm:w-2/5 shrink-0 bg-black border-b sm:border-b-0 sm:border-r border-[var(--border)] cursor-pointer" onClick={() => setVideoAberto(ex.video || null)}>
                      {renderizarVideo(ex.video)}
                    </div>
                  )}
                  
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-black text-[var(--text-primary)] text-lg leading-tight tracking-tight pr-4">{ex.nome}</h3>
                      
                      <button 
                        onClick={() => {
                          if (!treinoIniciado) {
                            setTreinoIniciado(true);
                            setDataInicio(new Date());
                          }
                          if (isConcluido) {
                            setConcluidos(concluidos.filter(c => c !== exIndex));
                          } else {
                            setConcluidos([...concluidos, exIndex]);
                            // Ao checar o exercício, já salva tudo automaticamente no banco para contar no Dashboard
                            if (ex.series && Array.isArray(ex.series)) {
                              ex.series.forEach((s: any, sIndex: number) => {
                                const key = `${ex.nome}-${sIndex}`;
                                const cargaAtual = Number(inputValues[key]) || Number(s.carga) || 0;
                                const unidadeAtual = inputUnits[key] || s.unidadeCarga || 'kg';
                                registrarCarga(ex.nome, cargaAtual, unidadeAtual, s.reps || '0', sIndex);
                              });
                            }
                          }
                        }} 
                        className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-90 ${isConcluido ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/40 scale-105' : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30'}`}
                      >
                        <FaCheck className={isConcluido ? 'text-lg' : 'text-sm'} />
                      </button>
                    </div>
                    
                    {ex.observacao && (
                      <div className="mb-5 p-4 bg-[var(--primary)]/5 border-l-4 border-[var(--primary)] rounded-r-2xl">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)] mb-1">Nota do Personal:</p>
                        <p className="text-xs font-medium text-[var(--text-primary)] italic">"{ex.observacao}"</p>
                      </div>
                    )}

                    <div className="bg-[var(--surface-sec)] rounded-[1.2rem] p-3 border border-[var(--border)]">
                      <div className="grid grid-cols-[2.5rem_1fr_1.5fr_1.5fr] sm:grid-cols-[3.5rem_1fr_1.5fr_1fr] gap-2 mb-2 px-1">
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">{t.set}</span>
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">{t.reps}</span>
                        <span className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest text-center">{t.load}</span>
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">{t.rest}</span>
                      </div>

                      <div className="space-y-2">
                        {Array.isArray(ex.series) && ex.series.map((s, sIndex) => {
                          const key = `${ex.nome}-${sIndex}`;
                          return (
                            <div key={sIndex} className="grid grid-cols-[2.5rem_1fr_1.5fr_1.5fr] sm:grid-cols-[3.5rem_1fr_1.5fr_1fr] items-center gap-1 sm:gap-2 bg-[var(--bg)] p-2 rounded-xl border border-[var(--border)] shadow-inner">
                              <span className="text-[11px] font-black text-[var(--text-secondary)] text-center">{s.ordem || sIndex + 1}ª</span>
                              <span className="text-[11px] sm:text-[12px] font-bold text-[var(--text-primary)] text-center truncate">{s.reps || '-'}</span>
                              
                              <div className="relative flex items-center justify-center w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden focus-within:border-[var(--primary)] transition-all">
                                <input 
                                  type="number" 
                                  placeholder={s.carga ? `${s.carga}` : '0'} 
                                  value={inputValues[key] || ''} 
                                  onChange={(e) => setInputValues(prev => ({ ...prev, [key]: e.target.value }))}
                                  onBlur={(e) => registrarCarga(ex.nome, Number(e.target.value), inputUnits[key] || s.unidadeCarga || 'kg', s.reps || '0', sIndex)}
                                  className="w-full bg-transparent text-[var(--text-primary)] py-2 sm:py-2.5 pl-2 text-center text-sm font-black outline-none placeholder:text-[var(--text-secondary)] placeholder:font-normal"
                                  style={{ WebkitAppearance: 'none', margin: 0 }}
                                />
                                <select 
                                  value={inputUnits[key] || s.unidadeCarga || 'kg'}
                                  onChange={(e) => {
                                    setInputUnits(prev => ({ ...prev, [key]: e.target.value }));
                                    if (inputValues[key]) registrarCarga(ex.nome, Number(inputValues[key]), e.target.value, s.reps || '0', sIndex);
                                  }}
                                  className="bg-transparent text-[9px] font-black text-[var(--text-secondary)] uppercase outline-none pr-1 cursor-pointer appearance-none"
                                >
                                  <option value="kg" className="bg-[var(--surface)] text-[var(--text-primary)]">KG</option>
                                  <option value="lbs" className="bg-[var(--surface)] text-[var(--text-primary)]">LBS</option>
                                </select>
                              </div>
                              
                              <div className="flex justify-center">
                                <button 
                                  onClick={() => s.intervalo ? iniciarCronometroDescanso(s.intervalo) : null} 
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors active:scale-95"
                                >
                                  <FaStopwatch size={12} />
                                </button>
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

        {treinoIniciado && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
            <button 
              onClick={finalizarSessao} 
              disabled={!todosFinalizados || saving}
              className={`w-full py-5 rounded-[1.2rem] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
                todosFinalizados 
                  ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-soft)] hover:shadow-[var(--primary)]/30 active:scale-95' 
                  : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] cursor-not-allowed opacity-70'
              }`}
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FaCheck size={16} /> {t.finish}</>}
            </button>
            {!todosFinalizados && <p className="text-center text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-4">{t.incomplete}</p>}
          </div>
        )}

      </div>
      {showToast && <ToastSucesso mensagem={toastMsg} onClose={() => setShowToast(false)} />}
    </main>
  );
}