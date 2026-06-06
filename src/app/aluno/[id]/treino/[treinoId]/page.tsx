'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ToastSucesso from '@/components/ui/ToastSucesso';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from 'date-fns';
import { 
  FaFilePdf, FaCheck, FaInfoCircle, FaChevronLeft, 
  FaMoon, FaSun, FaGlobe, FaCommentAlt, FaStopwatch, FaTimes, FaBell
} from "react-icons/fa";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIPAGENS (Substituindo os 'any')
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
  descricao: Exercicio[] | string;
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
    workoutLogged: 'Treino e feedback registrados com sucesso!',
    feedbackTitle: 'Como foi o treino hoje?', fbIntensity: 'Nível de Esforço',
    fbObs: 'Escreva aqui se sentiu alguma dor, facilidade, ou observação geral...',
    fbSelectEx: 'Sobre qual exercício?', fbGeneral: 'Treino em Geral',
    timerReady: 'Pronto! Vamos lá.', timerRest: 'Descanso',
    errorLoading: 'Erro ao carregar o treino.', errorSaving: 'Erro ao salvar o treino.'
  },
  'pt-PT': {
    back: 'Voltar', download: 'Descarregar Treino', totalSessions: 'Sessões Totais',
    set: 'Série', reps: 'Reps', load: 'Carga', rest: 'Desc.',
    finish: 'Finalizar Sessão', incomplete: 'Complete todos os exercícios',
    workoutLogged: 'Treino e feedback registados com sucesso!',
    feedbackTitle: 'Como foi o treino hoje?', fbIntensity: 'Nível de Esforço',
    fbObs: 'Escreva aqui se sentiu alguma dor, facilidade, ou observação geral...',
    fbSelectEx: 'Sobre qual exercício?', fbGeneral: 'Treino em Geral',
    timerReady: 'Pronto! Vamos lá.', timerRest: 'Descanso',
    errorLoading: 'Erro ao carregar o treino.', errorSaving: 'Erro ao guardar o treino.'
  },
  'en': {
    back: 'Back', download: 'Download', totalSessions: 'Total Sessions',
    set: 'Set', reps: 'Reps', load: 'Load', rest: 'Rest',
    finish: 'Finish Session', incomplete: 'Complete all exercises',
    workoutLogged: 'Workout and feedback logged successfully!',
    feedbackTitle: 'How was the workout today?', fbIntensity: 'Effort Level',
    fbObs: 'Write here if you felt any pain, ease, or general observation...',
    fbSelectEx: 'About which exercise?', fbGeneral: 'General Workout',
    timerReady: 'Ready! Lets go.', timerRest: 'Resting',
    errorLoading: 'Error loading workout.', errorSaving: 'Error saving workout.'
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE ISOLADO DO RELÓGIO (Previne re-renderização da tela inteira)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  const [sessoesContador, setSessoesContador] = useState(0);
  const [precisaParq, setPrecisaParq] = useState(false);
  
  // Controle de Carga e Unidade
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [inputUnits, setInputUnits] = useState<Record<string, string>>({});
  
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  // Estados do Cronômetro Inteligente
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);
  const [timerAtivo, setTimerAtivo] = useState(false);

  // Estados de Tema e i18n
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');

  // Estados do Feedback
  const [fbExercicio, setFbExercicio] = useState('');
  const [fbIntensidade, setFbIntensidade] = useState(5);
  const [fbTexto, setFbTexto] = useState('');



  useEffect(() => {
  const init = async () => {
    setLoading(true);
    
    try {
      // 1. Busca dados do aluno
      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .select('status_pagamento, data_vencimento, parq_valido')
        .eq('id', id)
        .single();
      
      if (alunoError) throw alunoError;

      if (aluno) {
        const hoje = new Date(); 
        hoje.setHours(0, 0, 0, 0);
        
        // Validação de data segura
        const vencimento = aluno.data_vencimento ? new Date(aluno.data_vencimento) : new Date(0);
        const dataLimite = new Date(vencimento); 
        dataLimite.setDate(dataLimite.getDate() + 2);
        
        // 2. Checa Pagamento
        if (aluno.status_pagamento === 'bloqueado' || hoje > dataLimite) {
          router.push('/aluno/pagamento-pendente'); 
          return;
        }

        // 3. VERIFICAÇÃO DO PAR-Q
        if (aluno.parq_valido === false || aluno.parq_valido === null) {
          setPrecisaParq(true);
          setLoading(false); // Para o loading pois a tela do PAR-Q será exibida
          return; 
        }
      }

      // 4. Se passou pelas verificações, carrega as fichas
      const [fichasRes, histRes] = await Promise.all([
        supabase.from('fichas').select('*').eq('aluno_id', id),
        supabase.from('conclusoes_treino').select('treino_id, data_conclusao').eq('aluno_id', id)
      ]);

      if (fichasRes.data) {
        const historicoData = histRes.data || [];
        const processadas = fichasRes.data.map(f => {
          let exercicios = [];
          try { 
            exercicios = typeof f.descricao === 'string' ? JSON.parse(f.descricao || '[]') : (f.descricao || []); 
          } catch { 
            exercicios = []; 
          }
          const historicoDoTreino = historicoData.filter(h => h.treino_id === f.id);
          return { 
            ...f, 
            exercicios, 
            count: exercicios.length, 
            sessõesCount: historicoDoTreino.length, 
            ultimaSessao: historicoDoTreino.length > 0 ? historicoDoTreino[0].data_conclusao : null, 
            ativo: f.ativo !== false 
          };
        });
        
      }
    } catch (err) {
      console.error("Erro na inicialização:", err);
    } finally {
      // setLoading(false) é chamado no finally para garantir que o loading suma 
      // em caso de sucesso ou erro (exceto quando entra no if do PAR-Q)
      setLoading(false);
    }
  };
  
  init();
}, [id, router]);

  // Lógica do Cronômetro
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerAtivo && tempoRestante !== null && tempoRestante > 0) {
      interval = setInterval(() => {
        setTempoRestante(prev => prev! - 1);
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

  const iniciarCronometro = (intervaloStr: string) => {
    const segundos = parseIntervalo(intervaloStr);
    if (segundos > 0) {
      setTempoRestante(segundos);
      setTimerAtivo(true);
    }
  };

  const formatarTempo = (segundos: number) => {
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

  const exercicios: Exercicio[] = ficha?.descricao 
    ? (typeof ficha.descricao === 'string' ? JSON.parse(ficha.descricao) : ficha.descricao) 
    : [];
    
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
        supabase.from('fichas').select('*').eq('id', treinoId).maybeSingle(),
        supabase.from('registro_series').select('*').eq('treino_id', treinoId),
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
  if (!carga || carga <= 0) return;
  
  const registroExistente = registros.find(r => r.exercicio_nome === nomeExercicio && r.serie_index === serieIndex);
  
  const payload = { 
    aluno_id: id, 
    treino_id: treinoId, 
    exercicio_nome: nomeExercicio, 
    carga: Number(carga), 
    repeticoes: Number(reps) || 0, 
    serie_index: serieIndex 
  };

  // Correção: Estrutura o objeto fora do método para satisfazer o TypeScript
  const dadosParaUpsert = registroExistente 
    ? { ...payload, id: registroExistente.id } 
    : payload;

  try {
    const { data, error } = await supabase
      .from('registro_series')
      .upsert(dadosParaUpsert as any) // 'as any' corrige o erro de tipagem no build
      .select();
      
    if (error) throw error;

    if (data && data.length > 0) {
      setRegistros(prev => [
        ...prev.filter(r => r.id !== data[0].id), 
        ...(data as any)
      ]);
    }
  } catch (error: any) {
    console.error("--- DEBUG DO ERRO SUPABASE ---");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Details:", error.details);
  }
};

const finalizarSessao = async () => {
  console.log("DEBUG: Iniciando finalização para Treino ID:", treinoId);
  setLoading(true);

  try {
    // 0. Recuperar o personal_id vinculado ao aluno
    const { data: alunoData, error: alunoErr } = await supabase
      .from('alunos')
      .select('personal_id') 
      .eq('id', id)
      .single();

    if (alunoErr || !alunoData) {
      throw new Error("Não foi possível identificar o personal responsável pelo aluno.");
    }

    const pId = alunoData.personal_id;

    // 1. Conclusão do Treino
    console.log("DEBUG: Registrando conclusão...");
    const { error: err1 } = await supabase
      .from('conclusoes_treino')
      .insert({ 
        aluno_id: id, 
        treino_id: treinoId || null, 
        data_conclusao: new Date().toISOString() 
      });
    if (err1) throw new Error(`Erro em conclusoes_treino: ${err1.message}`);

    // 2. Histórico do Treino
    console.log("DEBUG: Registrando histórico...");
    const { error: err2 } = await supabase
      .from('historico_treinos')
      .insert({ 
        aluno_id: id, 
        treino_id: treinoId || null, 
        data_treino: new Date().toISOString() 
      });
    if (err2) throw new Error(`Erro em historico_treinos: ${err2.message}`);

    // 3. Feedback (Opcional)
    if (fbTexto.trim() || fbIntensidade !== 5 || fbExercicio) {
      console.log("DEBUG: Registrando feedback...");
      const observacaoFinal = fbExercicio ? `[${fbExercicio}] ${fbTexto}` : fbTexto;
      
      const { error: err3 } = await supabase
        .from('feedbacks_treino')
        .insert({
          aluno_id: id,
          treino_id: treinoId || null,
          personal_id: pId,
          intensidade: fbIntensidade,
          observacoes: observacaoFinal.trim() || 'Treino concluído sem observações textuais.',
          data_criacao: new Date().toISOString()
        });
      if (err3) throw new Error(`Erro em feedbacks_treino: ${err3.message}`);
    }

    console.log("DEBUG: Tudo finalizado com sucesso!");
    setToastMsg(t.workoutLogged);
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
      router.push(`/aluno/${id}/treinos`);
    }, 2000);

  } catch (error: any) {
    console.error("--- FALHA FATAL NO FINALIZAR ---");
    console.error("Erro capturado:", error.message);
    alert(`Erro ao salvar treino: ${error.message}`);
    setLoading(false);
  }
};



  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDERIZAÇÃO CONDICIONAL DO PAR-Q (BLOQUEIO)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (precisaParq) {
    return (
      <div style={themeStyles} className="min-h-screen bg-[var(--bg)] pt-10 px-4 pb-20">
        <ParqForm 
          alunoId={id} 
          onComplete={() => {
            // Quando ele preencher e assinar, a tela recarrega para liberar o acesso
            window.location.reload();
          }} 
        />
      </div>
    );
  }

  if (loading) return (
    <main style={themeStyles} className="min-h-screen bg-[var(--bg)] p-6 space-y-6 animate-pulse pt-[max(env(safe-area-inset-top),2rem)]">
      <div className="flex justify-between items-center mb-10"><div className="w-20 h-10 bg-[var(--surface-sec)] rounded-full" /><div className="w-32 h-10 bg-[var(--surface-sec)] rounded-full" /></div>
      <div className="space-y-4"><div className="w-3/4 h-10 bg-[var(--surface-sec)] rounded-full" /><div className="w-1/3 h-4 bg-[var(--surface-sec)] rounded-full" /><div className="w-full h-2 bg-[var(--surface-sec)] rounded-full mt-6" /></div>
      {[1, 2, 3].map((i) => <div key={i} className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] overflow-hidden space-y-4"><div className="w-full aspect-video bg-[var(--surface-sec)]" /><div className="p-6 space-y-4"><div className="w-1/2 h-6 bg-[var(--surface-sec)] rounded-full" /><div className="w-full h-12 bg-[var(--surface-sec)] rounded-xl" /></div></div>)}
    </main>
  );
  
  return (
    <main style={themeStyles} className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pt-[max(env(safe-area-inset-top),1.5rem)] pb-[env(safe-area-inset-bottom)] px-4 relative">
      
      {/* ━━━━━━━━━━ CRONÔMETRO FLUTUANTE ━━━━━━━━━━ */}
      {tempoRestante !== null && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 z-[100] border shadow-2xl px-5 py-3 rounded-full flex items-center gap-4 transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
          tempoRestante === 0 
            ? 'bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)] backdrop-blur-md' 
            : 'bg-[var(--surface)]/90 border-[var(--primary)]/30 text-[var(--text-primary)] backdrop-blur-xl'
        }`}>
          {tempoRestante === 0 ? (
            <FaBell className="animate-bounce" size={16} />
          ) : (
            <div className="w-3 h-3 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_10px_var(--primary)]" />
          )}
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-widest opacity-80 leading-none">
              {tempoRestante === 0 ? t.timerReady : t.timerRest}
            </span>
            <span className="font-black text-xl font-mono leading-none tracking-tight">
              {formatarTempo(tempoRestante)}
            </span>
          </div>
          <button onClick={() => setTempoRestante(null)} className="ml-2 w-8 h-8 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto pb-32">
        
        {/* HEADER */}
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

        {/* TÍTULO E PROGRESSO */}
        <div className="mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-tight">{ficha?.nome_treino}</h1>
            <p className="text-[var(--primary)] font-bold text-[11px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
              {t.totalSessions}: <span className="text-[var(--text-primary)]">{sessoesContador}</span>
            </p>
          </div>
          
          <div className="w-full h-2 bg-[var(--surface-sec)] mt-6 rounded-full overflow-hidden border border-[var(--border)] shadow-inner">
            <div className="h-full bg-gradient-to-r from-[var(--primary-soft)] to-[var(--primary)] transition-all duration-700 ease-out relative" style={{ width: `${progresso}%` }}>
              <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/20 blur-sm" />
            </div>
          </div>
        </div>
        
        {/* LISTA DE EXERCÍCIOS (4 COLUNAS) */}
        <div className="space-y-6">
          {exercicios.map((ex, exIndex) => {
            const isConcluido = concluidos.includes(exIndex);
            
            return (
              <div key={exIndex} className={`bg-[var(--surface)] rounded-[2rem] border overflow-hidden transition-all duration-500 shadow-sm ${isConcluido ? 'border-[var(--primary)] shadow-[0_0_20px_rgba(37,99,235,0.15)] ring-1 ring-[var(--primary)]/50' : 'border-[var(--border)] hover:border-[var(--primary)]/30'}`}>
                <div className="flex flex-col sm:flex-row">
                  {ex.video && (
                    <div className="w-full sm:w-2/5 shrink-0 bg-black border-b sm:border-b-0 sm:border-r border-[var(--border)]">
                      {renderizarVideo(ex.video)}
                    </div>
                  )}
                  
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-5">
                      <h3 className="font-black text-[var(--text-primary)] text-lg leading-tight tracking-tight pr-4">{ex.nome}</h3>
                      
                      {/* Botão de Check/Concluir */}
                      <button 
                        onClick={() => {
                          if (isConcluido) setConcluidos(concluidos.filter(c => c !== exIndex));
                          else setConcluidos([...concluidos, exIndex]);
                        }} 
                        className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-90 ${isConcluido ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/40 scale-105' : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30'}`}
                      >
                        <FaCheck className={isConcluido ? 'text-lg' : 'text-sm'} />
                      </button>
                    </div>
                    
                    {ex.observacao && (
                      <div className="mb-6 p-3 bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-bold rounded-xl border border-[var(--primary)]/20 flex items-start gap-2 leading-relaxed">
                        <FaInfoCircle className="mt-0.5 shrink-0 text-sm"/> <span>{ex.observacao}</span>
                      </div>
                    )}

                    {/* Tabela de Séries (Estritamente 4 Colunas com Play de Descanso) */}
                    <div className="bg-[var(--surface-sec)] rounded-[1.2rem] p-3 border border-[var(--border)]">
                      
                      {/* Cabeçalho da Grade */}
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
                              
                              {/* Input de Carga com Select Embutido (KG/LBS) */}
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

                              {/* Coluna de Descanso com Botão de Play */}
                              <div className="flex items-center justify-center gap-1 sm:gap-2">
                                <span className="text-[11px] sm:text-[12px] font-bold text-[var(--text-primary)] truncate">{s.intervalo || '-'}</span>
                                {s.intervalo && (
                                  <button 
                                    onClick={() => iniciarCronometro(s.intervalo!)} 
                                    title="Iniciar Cronômetro"
                                    className="w-6 h-6 sm:w-8 sm:h-8 flex shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors active:scale-95"
                                  >
                                    <FaStopwatch size={12} />
                                  </button>
                                )}
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

        {/* ━━━━━━━━━━ FEEDBACK FIXO NO FINAL DO TREINO ━━━━━━━━━━ */}
        {todosFinalizados && (
          <div className="mt-10 p-6 sm:p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-500">
            <h3 className="text-xl sm:text-2xl font-black tracking-tighter text-[var(--text-primary)] flex items-center gap-3 mb-6">
              <FaCommentAlt className="text-[var(--primary)]" /> {t.feedbackTitle}
            </h3>
            
            <div className="space-y-6">
              
              {/* Seleção do Exercício (Opcional) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest pl-1">{t.fbSelectEx}</label>
                <select 
                  value={fbExercicio}
                  onChange={(e) => setFbExercicio(e.target.value)}
                  className="w-full p-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] font-bold text-[var(--text-primary)] text-sm outline-none focus:border-[var(--primary)] transition-all shadow-inner appearance-none custom-select"
                >
                  <option value="" className="bg-[var(--surface)] font-bold text-[var(--primary)]">{t.fbGeneral}</option>
                  {exercicios.map((ex, idx) => (
                    <option key={idx} value={ex.nome} className="bg-[var(--surface)]">{ex.nome}</option>
                  ))}
                </select>
              </div>

              {/* Intensidade (1 a 10) */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest pl-1">{t.fbIntensity} ({fbIntensidade}/10)</label>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <button
                      key={num}
                      onClick={() => setFbIntensidade(num)}
                      className={`w-12 h-12 shrink-0 rounded-2xl font-black text-lg flex items-center justify-center transition-all snap-center border ${
                        fbIntensidade === num 
                          ? num > 7 ? 'bg-[var(--danger)] text-white border-[var(--danger)] shadow-lg shadow-[var(--danger)]/30' : 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/30'
                          : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <textarea 
                className="w-full p-5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.5rem] outline-none font-medium text-sm h-32 focus:border-[var(--primary)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] shadow-inner resize-none custom-scrollbar" 
                placeholder={t.fbObs} 
                value={fbTexto}
                onChange={(e) => setFbTexto(e.target.value)} 
              />
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━ BOTÃO DE FINALIZAR ━━━━━━━━━━ */}
        <div className="mt-8 mb-8 sticky bottom-[env(safe-area-inset-bottom,20px)] z-40">
          <button 
            onClick={finalizarSessao} 
            disabled={!todosFinalizados} 
            className={`w-full py-5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] transition-all duration-300 transform flex items-center justify-center gap-3 ${
              todosFinalizados ? 'bg-[var(--primary)] text-white shadow-[0_10px_30px_-10px_var(--primary)] hover:brightness-110 active:scale-[0.98]' : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] opacity-80 cursor-not-allowed'
            }`}
          >
            {todosFinalizados ? <><FaCheck size={16} /> {t.finish}</> : t.incomplete}
          </button>
        </div>

        {showToast && <ToastSucesso mensagem={toastMsg} onClose={() => setShowToast(false)} />}
        
        <div className="h-40 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}