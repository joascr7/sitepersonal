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
  FaFilePdf, FaCheck, FaChevronLeft, FaMoon, FaSun, 
  FaGlobe, FaStopwatch, FaTimes, FaBell, FaPlay, 
  FaClock, FaCalendarAlt, FaChevronDown, FaUndo, FaDumbbell, FaSyncAlt, FaPencilAlt
} from "react-icons/fa";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIPAGENS 
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface Serie {
  ordem?: number | string;
  reps?: string;
  carga?: number | string;
  unidadeCarga?: string;
  intervalo?: string;
}

interface Exercicio {
  nome: string;
  video?: string;
  observacao?: string;
  series: Serie[] | number | string; 
  serie?: number | string; 
  reps?: string;
  repeticoes?: string;
  carga?: number | string;
  intervalo?: string;
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
    startWorkout: 'Iniciar Treino', ready: 'Pronto para treinar?', concludeEx: 'Concluir Exercício', undoEx: 'Desmarcar'
  },
  'pt-PT': {
    back: 'Voltar', download: 'Descarregar Treino', totalSessions: 'Sessões Totais',
    set: 'Série', reps: 'Reps', load: 'Carga', rest: 'Desc.',
    finish: 'Finalizar Sessão', incomplete: 'Complete todos os exercícios',
    workoutLogged: 'Treino registado com sucesso!',
    timerReady: 'Pronto! Vamos lá.', timerRest: 'Descanso',
    errorLoading: 'Erro ao carregar o treino.', errorSaving: 'Erro ao guardar o treino.',
    startWorkout: 'Iniciar Treino', ready: 'Pronto para treinar?', concludeEx: 'Concluir Exercício', undoEx: 'Desmarcar'
  },
  'en': {
    back: 'Back', download: 'Download', totalSessions: 'Total Sessions',
    set: 'Set', reps: 'Reps', load: 'Load', rest: 'Rest',
    finish: 'Finish Session', incomplete: 'Complete all exercises',
    workoutLogged: 'Workout logged successfully!',
    timerReady: 'Ready! Lets go.', timerRest: 'Resting',
    errorLoading: 'Error loading workout.', errorSaving: 'Error saving workout.',
    startWorkout: 'Start Workout', ready: 'Ready to train?', concludeEx: 'Finish Exercise', undoEx: 'Undo'
  }
};

const getYouTubeId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const playBeepSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.35); 
  } catch (e) {
    console.error("Falha ao reproduzir áudio nativo:", e);
  }
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
  const [todasFichas, setTodasFichas] = useState<any[]>([]); 
  const [registros, setRegistros] = useState<RegistroSerie[]>([]);
  const [concluidos, setConcluidos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessoesContador, setSessoesContador] = useState(0);
  const [precisaParq, setPrecisaParq] = useState(false);
  
  const [treinoIniciado, setTreinoIniciado] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [segundosTreino, setSegundosTreino] = useState(0);
  
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);
  const [timerAtivo, setTimerAtivo] = useState(false);

  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [inputUnits, setInputUnits] = useState<Record<string, string>>({});
  
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  const [activeMediaEx, setActiveMediaEx] = useState<{ video: string; nome: string } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
    if (timerAtivo && tempoRestante !== null && tempoRestante > 0) {
      interval = setInterval(() => {
        setTempoRestante(prev => {
          if (prev !== null && prev === 1) {
            playBeepSound(); 
          }
          return prev! - 1;
        });
      }, 1000);
    } else if (tempoRestante === 0) {
      setTimerAtivo(false);
      setTimeout(() => setTempoRestante(null), 4000);
    }
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
    if (segundos > 0) { setTempoRestante(segundos); setTimerAtivo(true); }
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
    '--bg': '#0F1115', '--surface': '#1A1D24', '--surface-sec': '#222731', '--primary': '#3B82F6', '--primary-soft': '#60A5FA', '--success': '#22C55E', '--danger': '#EF4444', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F9FAFB', '--surface': '#FFFFFF', '--surface-sec': '#F3F4F6', '--primary': '#2563EB', '--primary-soft': '#60A5FA', '--success': '#16A34A', '--danger': '#DC2626', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
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

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(ficha?.nome_treino || "Treino", 14, 20);
    const tabelaDados: any[] = [];
    
    exercicios.forEach((ex) => {
      // PDF AGORA MOSTRA APENAS O NÚMERO TOTAL CONFIGURADO SEM DUPLICAR LINHAS
      let numSeries = 1;
      if (Array.isArray(ex.series) && ex.series.length > 0) {
        const numExtraido = parseInt(String(ex.series[0]?.ordem).replace(/\D/g, ''));
        numSeries = numExtraido > 0 ? numExtraido : ex.series.length;
      } else {
        numSeries = Number(ex.series) || Number(ex.serie) || 1;
      }
      
      const key = `${ex.nome}-0`;
      const sData = Array.isArray(ex.series) ? ex.series[0] : null;
      
      tabelaDados.push([ 
        ex.nome, 
        `${numSeries} Séries`, 
        sData?.reps || ex.reps || ex.repeticoes || '-', 
        inputValues[key] ? `${inputValues[key]}${inputUnits[key] || 'kg'}` : (sData?.carga || ex.carga ? `${sData?.carga || ex.carga}${sData?.unidadeCarga || 'kg'}` : '-'), 
        sData?.intervalo || ex.intervalo || '-' 
      ]);
    });
    
    autoTable(doc, { startY: 35, head: [['Exercício', 'Série', 'Reps', 'Carga Registrada', 'Desc.']], body: tabelaDados });
    doc.save(`${ficha?.nome_treino || 'Treino'}.pdf`);
  };

  const fetchData = async () => {
    if (!treinoId) return;
    setLoading(true);
    try {
      const [fichaRes, regRes, concRes, todasFichasRes] = await Promise.all([
        supabase.from('fichas').select('*, data_inicio, data_vencimento').eq('id', treinoId).maybeSingle(),
        supabase.from('registro_series').select('id, treino_id, exercicio_nome, serie_index, carga, repeticoes, unidade_carga').eq('treino_id', treinoId),
        supabase.from('conclusoes_treino').select('id', { count: 'exact' }).eq('treino_id', treinoId),
        supabase.from('fichas').select('id, nome_treino').eq('aluno_id', id).eq('ativo', true)
      ]);
      
      if (fichaRes && fichaRes.data) setFicha(fichaRes.data as Ficha);
      if (todasFichasRes.data) setTodasFichas(todasFichasRes.data);
      
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

  return (
    <main style={themeStyles} className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pt-[max(env(safe-area-inset-top),1.5rem)] pb-[env(safe-area-inset-bottom)] px-4 relative">
      
      {tempoRestante !== null && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 z-[100] border shadow-2xl px-5 py-3 rounded-full flex items-center gap-4 transition-all duration-300 ${
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

      {/* MODAL NATIVO DE EXECUÇÃO DE EXERCÍCIO - REPLICANDO A IMAGE_8.PNG */}
      {activeMediaEx && (
        <div className="fixed inset-0 bg-[var(--bg)] z-[9999] flex flex-col animate-in fade-in duration-200 pt-[max(env(safe-area-inset-top),1rem)] px-4">
          <header className="flex items-center justify-between py-4 border-b border-[var(--border)] mb-6">
            <button onClick={() => setActiveMediaEx(null)} className="text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors p-2 active:scale-90">
              <FaChevronLeft size={18} />
            </button>
            <h2 className="text-lg font-black tracking-widest text-[var(--text-primary)] uppercase text-center flex-grow -ml-8">
              TREINO
            </h2>
            <div className="w-4" /> 
          </header>

          <div className="w-full rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-md">
            {getYouTubeId(activeMediaEx.video) ? (
              <div className="w-full aspect-video">
                <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYouTubeId(activeMediaEx.video)}?autoplay=1`} allow="autoplay; fullscreen" frameBorder="0" />
              </div>
            ) : activeMediaEx.video.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
              <div className="w-full aspect-video">
                <img src={activeMediaEx.video} className="w-full h-full object-cover" alt="Demonstração" />
              </div>
            ) : (
              <div className="w-full aspect-video">
                <video src={activeMediaEx.video} controls autoPlay playsInline className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-normal tracking-tight text-[var(--text-primary)] mt-5 pl-1">
            {activeMediaEx.nome}
          </h3>
        </div>
      )}

      <div className="max-w-2xl mx-auto pb-32">
        <header className="flex justify-between items-center mb-6 pt-4">
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

        <div className="relative w-full mb-6">
          <select
            value={treinoId}
            onChange={(e) => router.push(`/aluno/${id}/treino/${e.target.value}`)}
            className="w-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-black py-4 px-5 rounded-2xl appearance-none border border-[var(--primary)]/20 outline-none text-center tracking-wide uppercase cursor-pointer shadow-sm transition-all focus:border-[var(--primary)]"
          >
            {todasFichas.map((f) => (
              <option key={f.id} value={f.id} className="bg-[var(--surface)] text-[var(--text-primary)] font-bold">
                {f.nome_treino}
              </option>
            ))}
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--primary)] text-xs font-black">
            ▼
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[var(--primary)] font-bold text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
              {t.totalSessions}: <span className="text-[var(--text-primary)]">{sessoesContador}</span>
            </p>
            {treinoIniciado && (
              <div className="flex items-center gap-2 bg-[var(--primary)]/10 px-4 py-2 rounded-xl border border-[var(--primary)]/20">
                <span className="text-[9px] font-black uppercase text-[var(--primary)] tracking-widest"><FaClock className="inline mr-1" size={10}/> Tempo:</span>
                <span className="font-mono text-base font-black text-[var(--primary)] leading-none">{formatarTempoGeral(segundosTreino)}</span>
              </div>
            )}
          </div>
          
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
             <button onClick={() => { setTreinoIniciado(true); setDataInicio(new Date()); setExpandedId(0); }} className="w-full py-5 bg-[var(--primary)] text-white rounded-[1.2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-[var(--primary)]/20 active:scale-95 transition-all">
               <FaPlay size={14} /> {t.startWorkout}
             </button>
           </div>
        )}
        
        {/* LISTA DE EXERCÍCIOS ACCORDION COMPACTO */}
        <div className={`space-y-3 transition-all duration-500 ${treinoIniciado ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {exercicios.map((ex, exIndex) => {
            const isConcluido = concluidos.includes(exIndex);
            const isExpanded = expandedId === exIndex;
            
            // INTELIGÊNCIA EXCLUSIVA: Lê apenas o número e renderiza apenas 1 aba visual
            let numeroSeriesConfigurado = 1;
            if (Array.isArray(ex.series) && ex.series.length > 0) {
              const numNaOrdem = parseInt(String(ex.series[0]?.ordem).replace(/\D/g, ''));
              numeroSeriesConfigurado = numNaOrdem > 0 ? numNaOrdem : ex.series.length;
            } else {
              numeroSeriesConfigurado = Number(ex.series) || Number(ex.serie) || 1;
            }
            
            const comboSerieData = Array.isArray(ex.series) ? ex.series[0] : null;
            const currentKey = `${ex.nome}-0`;

            const isImageOrGif = ex.video?.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif)$/i);
            const ytId = getYouTubeId(ex.video);
            const thumbnailUrl = isImageOrGif ? ex.video : (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

            const repsExibicao = comboSerieData?.reps || ex.reps || ex.repeticoes || '-';
            const cargaPlaceholder = comboSerieData?.carga || ex.carga || '0';
            const intervaloExibicao = comboSerieData?.intervalo || ex.intervalo || '45"';

            return (
              <div key={exIndex} className={`bg-[var(--surface)] rounded-2xl overflow-hidden transition-all duration-300 shadow-sm border ${isConcluido ? 'border-[var(--success)]/50' : 'border-[var(--border)]'}`}>
                
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : exIndex)}
                  className={`w-full p-4 flex items-center justify-between transition-colors ${isConcluido ? 'bg-[var(--success)]/5 hover:bg-[var(--success)]/10' : 'hover:bg-[var(--surface-sec)]/50'}`}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div 
                      className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--surface-sec)] shrink-0 border border-[var(--border)] flex items-center justify-center relative cursor-pointer hover:opacity-80 transition-opacity group" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (ex.video) setActiveMediaEx({ video: ex.video, nome: ex.nome }); 
                      }}
                    >
                      {thumbnailUrl ? (
                         <>
                           <img src={thumbnailUrl} className="w-full h-full object-cover" alt="Thumb" />
                           <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><FaPlay className="text-white text-xs"/></div>
                         </>
                      ) : (
                         <FaPlay className="text-[var(--primary)]/50" />
                      )}
                    </div>
                    
                    <div className="text-left truncate">
                      <span className={`font-bold text-base leading-tight block truncate max-w-[200px] ${isConcluido ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}>
                        {ex.nome || `Exercício ${exIndex + 1}`}
                      </span>
                      {/* O NÚMERO DE SÉRIES CONFIGURADO APARECE AQUI */}
                      <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{numeroSeriesConfigurado} SÉRIES</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    {isConcluido && <FaCheck className="text-[var(--success)]" size={14} />}
                    <FaChevronDown className={`text-[var(--text-secondary)] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[var(--primary)]' : ''}`} size={14} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-sec)]/10">
                    
                    {ex.observacao && (
                      <div className="p-3 bg-[var(--primary)]/5 border-l-4 border-[var(--primary)] rounded-r-xl text-xs mb-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)] mb-0.5">Nota:</p>
                        <p className="font-medium text-[var(--text-primary)] italic">"{ex.observacao}"</p>
                      </div>
                    )}

                    {/* A ÚNICA ABA (BOTÃO AZUL) MOSTRANDO O NÚMERO TOTAL */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar mb-3">
                      <button className="px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20">
                        {numeroSeriesConfigurado} {numeroSeriesConfigurado === 1 ? 'SÉRIE' : 'SÉRIES'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      
                      <div className="bg-[var(--surface)] border border-[var(--border)] p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                        <FaUndo className="text-[var(--primary)] text-xs mb-1.5" />
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Repetições</span>
                        <span className="text-base font-black text-[var(--text-primary)] mt-1">
                          {repsExibicao}
                        </span>
                      </div>

                      <div className="bg-[var(--surface)] border border-[var(--border)] p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]/30 transition-all relative group">
                        <FaDumbbell className="text-[var(--primary)] text-xs mb-1.5" />
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Carga</span>
                        
                        <div className="flex items-center justify-center mt-1 w-full relative pl-3">
                          <input 
                            type="number" 
                            placeholder={String(cargaPlaceholder)} 
                            value={inputValues[currentKey] || ''} 
                            onChange={(e) => setInputValues(prev => ({ ...prev, [currentKey]: e.target.value }))}
                            onBlur={(e) => registrarCarga(ex.nome, Number(e.target.value), inputUnits[currentKey] || comboSerieData?.unidadeCarga || 'kg', String(repsExibicao), 0)}
                            className="w-10 bg-transparent text-center text-base font-black text-[var(--text-primary)] outline-none pr-1"
                            style={{ WebkitAppearance: 'none', margin: 0 }}
                          />
                          
                          <FaPencilAlt size={9} className="text-[var(--text-secondary)] opacity-40 group-hover:opacity-100 transition-opacity mr-1.5 shrink-0" />

                          <select 
                            value={inputUnits[currentKey] || comboSerieData?.unidadeCarga || 'kg'}
                            onChange={(e) => {
                              setInputUnits(prev => ({ ...prev, [currentKey]: e.target.value }));
                              if (inputValues[currentKey]) registrarCarga(ex.nome, Number(inputValues[currentKey]), e.target.value, String(repsExibicao), 0);
                            }}
                            className="bg-transparent text-[9px] font-black text-[var(--text-secondary)] uppercase outline-none cursor-pointer appearance-none shrink-0"
                          >
                            <option value="kg" className="bg-[var(--surface)] text-[var(--text-primary)]">KG</option>
                            <option value="lbs" className="bg-[var(--surface)] text-[var(--text-primary)]">LBS</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={() => iniciarCronometroDescanso(String(intervaloExibicao))}
                        className="bg-[var(--surface)] border border-[var(--border)] p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm active:scale-95 transition-transform hover:border-[var(--primary)]/30"
                      >
                        <FaStopwatch className="text-[var(--primary)] text-xs mb-1.5 animate-pulse" />
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Intervalo</span>
                        <span className="text-base font-black text-[var(--text-primary)] mt-1">
                          {intervaloExibicao}
                        </span>
                      </button>

                    </div>

                    <button 
                      onClick={() => {
                        if (!treinoIniciado) { setTreinoIniciado(true); setDataInicio(new Date()); }
                        if (isConcluido) {
                          setConcluidos(concluidos.filter(c => c !== exIndex));
                        } else {
                          setConcluidos([...concluidos, exIndex]);
                          
                          const k = `${ex.nome}-0`;
                          const cargaAtual = Number(inputValues[k]) || Number(comboSerieData?.carga) || Number(ex.carga) || 0;
                          const unidadeAtual = inputUnits[k] || comboSerieData?.unidadeCarga || 'kg';
                          const rAtual = comboSerieData?.reps || ex.reps || ex.repeticoes || '0';
                          
                          registrarCarga(ex.nome, cargaAtual, unidadeAtual, String(rAtual), 0);
                          
                          if (exIndex + 1 < exercicios.length) setExpandedId(exIndex + 1);
                          else setExpandedId(null);
                        }
                      }} 
                      className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] ${
                        isConcluido 
                          ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] shadow-inner' 
                          : 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 hover:bg-blue-600'
                      }`}
                    >
                      {isConcluido ? t.undoEx : t.concludeEx}
                    </button>

                  </div>
                )}
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
