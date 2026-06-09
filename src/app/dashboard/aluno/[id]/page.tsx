'use client';
import { useEffect, useState, use, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ControleFinanceiro from '@/components/ControleFinanceiro';
import { 
  FaChevronLeft, FaGlobe, FaMoon, FaSun, FaExclamationCircle, FaCheckCircle, 
  FaTrash, FaFilePdf, FaUpload, FaPlus, FaChartLine, FaDumbbell, FaCommentAlt, FaFolderOpen,
  FaArchive, FaUndo, FaUsers, FaEdit, FaCalendarCheck
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN PREMIUM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DetalheAlunoSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-8 animate-pulse pt-8 px-5">
    <div className="flex justify-between items-center mb-8">
      <div className="w-16 h-4 bg-[var(--surface-sec)] rounded-full" />
      <div className="w-24 h-10 bg-[var(--surface-sec)] rounded-[1.2rem]" />
    </div>
    <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] flex flex-col items-center gap-4 border border-[var(--border)]">
      <div className="w-24 h-24 rounded-[2rem] bg-[var(--surface-sec)]" />
      <div className="w-48 h-8 bg-[var(--surface-sec)] rounded-xl" />
      <div className="w-32 h-6 bg-[var(--surface-sec)] rounded-full" />
      <div className="w-full h-16 bg-[var(--surface-sec)] rounded-2xl mt-4" />
    </div>
    <div className="flex gap-4 overflow-hidden border-b border-[var(--border)] pb-2">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-20 h-6 bg-[var(--surface-sec)] rounded-full shrink-0" />)}
    </div>
    <div className="space-y-4">
      {[1, 2].map(i => <div key={i} className="w-full h-32 bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)]" />)}
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar', modality: 'Modalidade: ', notDefined: 'Não definido',
    tabs: { workouts: 'Treinos', frequency: 'Frequência', evolution: 'Evolução', feedback: 'Feedbacks', files: 'Documentos' },
    workouts: { 
      active: 'Ativos', archived: 'Arquivados', program: 'Programa', viewDetails: 'Ver Treino', edit: 'Editar',
      empty: 'Nenhuma ficha encontrada.', new: '+ Criar Nova Ficha', 
      assign: 'Atribuir a outros', archive: 'Arquivar', restore: 'Restaurar', selectStudents: 'Selecione os Alunos'
    },
    frequency: { title: 'Frequência', subtitle: 'Assiduidade e consistência.', totalWorkouts: 'Treinos Totais', avgWeek: 'Média / Semana', workoutsMonth: 'Treinos por Mês' },
    evolution: { title: 'Evolução', subtitle: 'Acompanhamento e métricas.', newEval: '+ Nova Avaliação', weight: 'Evolução de Peso (kg)', fat: '% de Gordura Corporal', measures: 'Circunferências Principais (cm)', delete: 'Excluir' },
    feedback: { title: 'Feedbacks', subtitle: 'Histórico do aluno.', intensity: 'Intensidade', level: 'Nível', delete: 'Excluir', empty: 'Nenhum feedback.' },
    files: { title: 'Documentos', subtitle: 'Gestão de exames e arquivos.', upload: 'Selecionar novo PDF', open: 'Abrir', empty: 'Nenhum arquivo enviado.' },
    modalEval: { title: 'Nova Avaliação', subtitle: 'Preencha as métricas do aluno.', obs: 'Observações...', cancel: 'Cancelar', save: 'Salvar' },
    alerts: { 
      confirmFeedback: 'Tem certeza que deseja excluir este feedback?', 
      confirmMasterFicha: 'Tem certeza que deseja excluir DE VEZ este programa e todos os treinos vinculados? Esta ação não tem volta.', 
      confirmArchive: 'Arquivar este programa irá escondê-lo do aplicativo do aluno. Deseja continuar?',
      confirmRestore: 'Este programa voltará a aparecer para o aluno. Deseja continuar?',
      confirmAvaliacao: 'Tem certeza que deseja excluir este registro?', 
      confirmArquivo: 'Tem certeza que deseja excluir este arquivo?', 
      errDelete: 'Erro ao excluir: ', errSave: 'Erro ao salvar: ', errUpload: 'Erro ao subir arquivo.', successUpload: 'Arquivo enviado com sucesso!' 
    }
  },
  'pt-PT': {
    back: 'Voltar', modality: 'Modalidade: ', notDefined: 'Não definido',
    tabs: { workouts: 'Treinos', frequency: 'Frequência', evolution: 'Evolução', feedback: 'Feedbacks', files: 'Documentos' },
    workouts: { 
      active: 'Ativos', archived: 'Arquivados', program: 'Programa', viewDetails: 'Ver Treino', edit: 'Editar',
      empty: 'Nenhuma ficha encontrada.', new: '+ Criar Nova Ficha', 
      assign: 'Atribuir a outros', archive: 'Arquivar', restore: 'Restaurar', selectStudents: 'Selecione os Alunos'
    },
    frequency: { title: 'Frequência', subtitle: 'Assiduidade e consistência.', totalWorkouts: 'Treinos Totais', avgWeek: 'Média / Semana', workoutsMonth: 'Treinos por Mês' },
    evolution: { title: 'Evolução', subtitle: 'Acompanhamento e métricas.', newEval: '+ Nova Avaliação', weight: 'Evolução de Peso (kg)', fat: '% de Gordura Corporal', measures: 'Circunferências Principais (cm)', delete: 'Eliminar' },
    feedback: { title: 'Feedbacks', subtitle: 'Histórico do aluno.', intensity: 'Intensidade', level: 'Nível', delete: 'Eliminar', empty: 'Nenhum feedback.' },
    files: { title: 'Documentos', subtitle: 'Gestão de exames e ficheiros.', upload: 'Selecionar novo PDF', open: 'Abrir', empty: 'Nenhum ficheiro enviado.' },
    modalEval: { title: 'Nova Avaliação', subtitle: 'Preencha as métricas do aluno.', obs: 'Observações...', cancel: 'Cancelar', save: 'Guardar' },
    alerts: { 
      confirmFeedback: 'Tem certeza que deseja eliminar este feedback?', 
      confirmMasterFicha: 'Tem certeza que deseja eliminar DE VEZ este programa e todos os treinos vinculados? Esta ação não tem volta.', 
      confirmArchive: 'Arquivar este programa irá escondê-lo da aplicação do aluno. Deseja continuar?',
      confirmRestore: 'Este programa voltará a aparecer para o aluno. Deseja continuar?',
      confirmAvaliacao: 'Tem certeza que deseja eliminar este registo?', 
      confirmArquivo: 'Tem certeza que deseja eliminar este ficheiro?', 
      errDelete: 'Erro ao eliminar: ', errSave: 'Erro ao guardar: ', errUpload: 'Erro ao subir ficheiro.', successUpload: 'Ficheiro enviado com sucesso!' 
    }
  },
  'en': {
    back: 'Back', modality: 'Modality: ', notDefined: 'Not defined',
    tabs: { workouts: 'Workouts', frequency: 'Frequency', evolution: 'Evolution', feedback: 'Feedbacks', files: 'Documents' },
    workouts: { 
      active: 'Active', archived: 'Archived', program: 'Program', viewDetails: 'View Workout', edit: 'Edit',
      empty: 'No workouts found.', new: '+ Create New Workout', 
      assign: 'Assign to others', archive: 'Archive', restore: 'Restore', selectStudents: 'Select Students'
    },
    frequency: { title: 'Frequency', subtitle: 'Attendance and consistency.', totalWorkouts: 'Total Workouts', avgWeek: 'Avg / Week', workoutsMonth: 'Workouts per Month' },
    evolution: { title: 'Evolution', subtitle: 'Tracking and metrics.', newEval: '+ New Assessment', weight: 'Weight Evolution (kg)', fat: 'Body Fat (%)', measures: 'Main Circumferences (cm)', delete: 'Delete' },
    feedback: { title: 'Feedbacks', subtitle: 'Student history.', intensity: 'Intensity', level: 'Level', delete: 'Delete', empty: 'No feedbacks.' },
    files: { title: 'Documents', subtitle: 'Exams and files management.', upload: 'Select new PDF', open: 'Open', empty: 'No files uploaded.' },
    modalEval: { title: 'New Assessment', subtitle: 'Fill in the student metrics.', obs: 'Observations...', cancel: 'Cancel', save: 'Save' },
    alerts: { 
      confirmFeedback: 'Are you sure you want to delete this feedback?', 
      confirmMasterFicha: 'Are you sure you want to PERMANENTLY delete this program and all its splits? This action cannot be undone.', 
      confirmArchive: 'Archiving this program will hide it from the student app. Continue?',
      confirmRestore: 'This program will reappear for the student. Continue?',
      confirmAvaliacao: 'Are you sure you want to delete this record?', 
      confirmArquivo: 'Are you sure you want to delete this file?', 
      errDelete: 'Error deleting: ', errSave: 'Error saving: ', errUpload: 'Error uploading file.', successUpload: 'File uploaded successfully!' 
    }
  }
};

function DetalheAlunoContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [aluno, setAluno] = useState<any>(null);
  const [fichas, setFichas] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState(searchParams.get('aba') || 'treinos');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [isModalAvaliacaoOpen, setIsModalAvaliacaoOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [indexAberto, setIndexAberto] = useState<number | null>(null);
  
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [isModalAtribuirOpen, setIsModalAtribuirOpen] = useState(false);
  const [alunosList, setAlunosList] = useState<any[]>([]);
  const [alunosSelecionados, setAlunosSelecionados] = useState<string[]>([]);
  const [programaParaAtribuir, setProgramaParaAtribuir] = useState<any[]>([]);

  // Estados Frequência
  const [frequenciaMensal, setFrequenciaMensal] = useState<any[]>([]);
  const [metricasFrequencia, setMetricasFrequencia] = useState({ total: 0, mediaSemana: 0 });

  const [medidas, setMedidas] = useState({
    peso: '', gordura: '', torax: '', ombros: '', abdomen: '', 
    cintura: '', quadril: '', braco_direito: '', braco_esquerdo: '', observacoes: ''
  });

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

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  useEffect(() => {
    if (!id) return;
    const carregarDados = async () => {
      setLoading(true);
      await Promise.all([fetchDadosAluno(), fetchHistorico(), fetchFichas(), fetchFeedbacks(), fetchArquivos(), fetchAlunos(), fetchFrequencia()]);
      setLoading(false);
    };
    carregarDados();
  }, [id]);

  const fetchAlunos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('alunos').select('id, nome').eq('personal_id', user.id);
    if (data) setAlunosList(data.filter(a => a.id !== id));
  };

  const fetchArquivos = async () => {
    const { data, error } = await supabase.from('documentos').select('*').eq('aluno_id', id);
    if (!error && data) setArquivos(data);
  };

  const fetchFeedbacks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('feedbacks_treino').select('*').eq('aluno_id', id).order('data_criacao', { ascending: false });
    if (!error) setFeedbacks(data || []);
  };

  const fetchDadosAluno = async () => {
    const { data } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
    if (data) setAluno(data);
  };

  const fetchHistorico = async () => {
    const { data, error } = await supabase.from('avaliacoes_fisicas').select('*').eq('aluno_id', id).order('data_avaliacao', { ascending: false });
    if (!error) setHistorico(data || []);
  };

  const fetchFrequencia = async () => {
    const { data, error } = await supabase.from('conclusoes_treino').select('data_conclusao').eq('aluno_id', id).order('data_conclusao', { ascending: true });
    
    if (!error && data) {
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const agrupado: Record<string, number> = {};
      const hoje = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const label = `${meses[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
        agrupado[label] = 0;
      }

      data.forEach(c => {
        if (!c.data_conclusao) return;
        const d = new Date(c.data_conclusao);
        const label = `${meses[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
        if (agrupado[label] !== undefined) {
          agrupado[label] += 1;
        }
      });

      const dadosGrafico = Object.keys(agrupado).map(key => ({
        mes: key,
        treinos: agrupado[key]
      }));

      setFrequenciaMensal(dadosGrafico);
      const total = data.length;
      const totalUltimosSeisMeses = dadosGrafico.reduce((acc, curr) => acc + curr.treinos, 0);
      const mediaSemana = totalUltimosSeisMeses > 0 ? Math.round((totalUltimosSeisMeses / 24) * 10) / 10 : 0;
      setMetricasFrequencia({ total, mediaSemana });
    }
  };

  const fetchFichas = async () => {
    const { data } = await supabase.from('fichas').select('*').eq('aluno_id', id).order('ordem', { ascending: true });
    if (data) {
      const processadas = data.map(f => {
        let parsedEx = [];
        try { parsedEx = typeof f.descricao === 'string' ? JSON.parse(f.descricao || '[]') : (f.descricao || []); } catch(e) {}
        return { 
          ...f, 
          exercicios: Array.isArray(parsedEx) ? parsedEx : [],
          tipo_treino: f.tipo_treino || 'Musculação', 
          objetivo: f.objetivo || 'Hipertrofia',
          dificuldade: f.dificuldade || 'Intermediário'
        };
      });
      setFichas(processadas);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AGRUPAMENTO E FILTRAGEM (ATIVOS / ARQUIVADOS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fichasAgrupadas = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    fichas.forEach(f => {
      // Considera ativo se for true ou se não existir (fichas antigas)
      const isAtivo = f.ativo !== false; 
      
      if (mostrarArquivados && isAtivo) return;
      if (!mostrarArquivados && !isAtivo) return;

      const nomeCompleto = f.nome_treino || '';
      const partes = nomeCompleto.split(' - ');
      const nomeMaster = partes.length > 1 ? partes[0].trim() : nomeCompleto.trim() || 'Programa Padrão';
      const nomeSub = partes.length > 1 ? partes.slice(1).join(' - ').trim() : 'Ficha Única';

      if (!grupos[nomeMaster]) grupos[nomeMaster] = [];
      grupos[nomeMaster].push({ ...f, nome_sub: nomeSub });
    });

    return Object.entries(grupos).map(([nomeMaster, treinos]) => ({ nomeMaster, treinos }));
  }, [fichas, mostrarArquivados]);

  // Preparar dados da evolução (crescente no gráfico)
  const evolutionData = useMemo(() => {
    return [...historico].reverse();
  }, [historico]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GESTÃO DE TREINOS (ARQUIVAR, EXCLUIR, ATRIBUIR)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const excluirProgramaCompleto = async (treinos: any[]) => {
    if (!window.confirm(t.alerts.confirmMasterFicha)) return;
    const idsParaExcluir = treinos.map(t => t.id);
    const { error } = await supabase.from('fichas').delete().in('id', idsParaExcluir);
    if (!error) fetchFichas(); else showToast('error', t.alerts.errDelete + error.message);
  };

  const toggleArquivarPrograma = async (treinos: any[], arquivar: boolean) => {
    const confirmMsg = arquivar ? t.alerts.confirmArchive : t.alerts.confirmRestore;
    if (!window.confirm(confirmMsg)) return;
    
    setLoading(true);
    const ids = treinos.map(t => t.id);
    const { error } = await supabase.from('fichas').update({ ativo: !arquivar }).in('id', ids);
    
    if (!error) await fetchFichas(); 
    else showToast('error', t.alerts.errSave + error.message);
    setLoading(false);
  };

  const atribuirProgramaEmLote = async () => {
    if (alunosSelecionados.length === 0) return showToast('error', 'Selecione ao menos um aluno.');
    setLoading(true);
    
    try {
      for (const alunoId of alunosSelecionados) {
        const { data: maxOrdemData } = await supabase.from('fichas')
          .select('ordem').eq('aluno_id', alunoId).order('ordem', { ascending: false }).limit(1).maybeSingle();
        const startOrdem = (maxOrdemData?.ordem || 0) + 1;

        const inserts = programaParaAtribuir.map((treino, idx) => ({
          aluno_id: alunoId,
          nome_treino: treino.nome_treino,
          descricao: JSON.stringify(treino.exercicios),
          ordem: startOrdem + idx,
          personal_id: treino.personal_id,
          ativo: true
        }));

        await supabase.from('fichas').insert(inserts);

        await supabase.from('user_notifications').insert([{
          user_id: alunoId, titulo: 'Novo Treino Disponível! 💪',
          corpo: `O personal adicionou o programa "${programaParaAtribuir[0]?.nome_treino.split('-')[0].trim()}" para você.`, lida: false
        }]);
      }
      
      showToast('success', 'Treinos copiados com sucesso!');
      setIsModalAtribuirOpen(false);
      setAlunosSelecionados([]);
    } catch(e) {
      showToast('error', 'Erro ao copiar treinos.');
    } finally {
      setLoading(false);
    }
  };

  const excluirFeedback = async (idFeedback: string) => {
    if (!window.confirm(t.alerts.confirmFeedback)) return;
    const { error } = await supabase.from('feedbacks_treino').delete().eq('id', idFeedback);
    if (!error) fetchFeedbacks(); else showToast('error', t.alerts.errDelete + error.message);
  };

  const excluirAvaliacao = async (avaliacaoId: string) => {
    if (!window.confirm(t.alerts.confirmAvaliacao)) return;
    const { error } = await supabase.from('avaliacoes_fisicas').delete().eq('id', avaliacaoId);
    if (!error) fetchHistorico(); else showToast('error', t.alerts.errDelete + error.message);
  };

  const salvarAvaliacaoCompleta = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('avaliacoes_fisicas').insert({
      aluno_id: id, personal_id: user?.id, data_avaliacao: new Date().toISOString(), ...medidas
    });
    if (!error) {
      setIsModalAvaliacaoOpen(false);
      setMedidas({ peso: '', gordura: '', torax: '', ombros: '', abdomen: '', cintura: '', quadril: '', braco_direito: '', braco_esquerdo: '', observacoes: '' });
      fetchHistorico();
      showToast('success', 'Avaliação salva!');
    } else showToast('error', t.alerts.errSave + error.message);
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />

      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[99999] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {/* Modal: Atribuir Treinos */}
      {isModalAtribuirOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-5 animate-in fade-in duration-300">
          <div className="bg-[var(--surface)] w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-[var(--border)] overflow-y-auto max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 custom-scrollbar">
            <div className="mb-6 border-b border-[var(--border)] pb-4">
              <h3 className="text-xl font-black tracking-tighter text-[var(--text-primary)]">{t.workouts.assign}</h3>
              <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-widest font-black mt-1">
                {programaParaAtribuir[0]?.nome_treino.split('-')[0].trim() || 'Programa'}
              </p>
            </div>
            
            <div className="space-y-2 mb-6">
              {alunosList.length > 0 ? alunosList.map(a => (
                <label key={a.id} className="flex items-center gap-3 p-4 bg-[var(--surface-sec)] hover:bg-[var(--primary)]/5 border border-[var(--border)] hover:border-[var(--primary)]/30 rounded-2xl cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-[var(--primary)]"
                    checked={alunosSelecionados.includes(a.id)}
                    onChange={(e) => {
                      if(e.target.checked) setAlunosSelecionados([...alunosSelecionados, a.id]);
                      else setAlunosSelecionados(alunosSelecionados.filter(id => id !== a.id));
                    }}
                  />
                  <span className="font-bold text-[var(--text-primary)] text-sm">{a.nome}</span>
                </label>
              )) : (
                <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase text-center py-4">Nenhum outro aluno encontrado.</p>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setIsModalAtribuirOpen(false); setAlunosSelecionados([]); }} className="flex-1 py-4 bg-[var(--surface-sec)] text-[var(--text-primary)] hover:bg-[var(--border)] rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-colors active:scale-95">
                {t.modalEval.cancel}
              </button>
              <button onClick={atribuirProgramaEmLote} disabled={alunosSelecionados.length === 0} className="flex-1 py-4 bg-[var(--primary)] text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest disabled:opacity-50 hover:brightness-110 shadow-lg shadow-[var(--primary)]/20 transition-all active:scale-95">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !isModalAtribuirOpen ? <DetalheAlunoSkeleton /> : (
        <div className="max-w-4xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">
          
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest hover:text-[var(--primary)] transition-all active:scale-95">
              <FaChevronLeft size={10} /> {t.back}
            </button>
            <div className="flex gap-2">
              <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 relative">
                <FaGlobe size={14} />
                <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{lang.split('-')[0].toUpperCase()}</span>
              </button>
              <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95">
                {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>
            </div>
          </div>

          <section className="bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl mb-8 flex flex-col items-center text-center gap-5">
            <div className="w-24 h-24 rounded-[2rem] overflow-hidden border border-[var(--border)] shadow-inner bg-[var(--surface-sec)]">
              <img src={aluno?.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt={aluno?.nome} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter mb-2">{aluno?.nome}</h1>
              <p className="text-[var(--primary)] font-black bg-[var(--primary)]/10 px-4 py-1.5 rounded-full inline-block text-[10px] uppercase tracking-widest border border-[var(--primary)]/20">
                {t.modality} {aluno?.modalidade || t.notDefined}
              </p>
            </div>
            <div className="w-full mt-2">
               <ControleFinanceiro alunoId={id} initialStatus={aluno?.status_pagamento || 'pendente'} />
            </div>
          </section>

          {/* MENUS E ABAS COMPACTAS FLUIDAS */}
          <div className="flex gap-6 mb-8 border-b border-[var(--border)] overflow-x-auto custom-scrollbar pb-1">
            {[
              { id: 'treinos', label: t.tabs.workouts, icon: FaDumbbell },
              { id: 'frequencia', label: t.tabs.frequency, icon: FaCalendarCheck },
              { id: 'evolucao', label: t.tabs.evolution, icon: FaChartLine },
              { id: 'feedback', label: t.tabs.feedback, icon: FaCommentAlt },
              { id: 'arquivos', label: t.tabs.files, icon: FaFolderOpen }
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => { setAbaAtiva(tab.id); router.replace(`?aba=${tab.id}`) }} 
                className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  abaAtiva === tab.id ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>

          {/* ABA 1: TREINOS */}
          {abaAtiva === 'treinos' && (
            <section className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
              
              <div className="flex gap-2">
                <button onClick={() => { setMostrarArquivados(false); setIndexAberto(null); }} className={`flex-1 py-3 rounded-[1rem] font-black text-[10px] uppercase tracking-widest transition-all ${!mostrarArquivados ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'}`}>
                  {t.workouts.active}
                </button>
                <button onClick={() => { setMostrarArquivados(true); setIndexAberto(null); }} className={`flex-1 py-3 rounded-[1rem] font-black text-[10px] uppercase tracking-widest transition-all ${mostrarArquivados ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'}`}>
                  {t.workouts.archived}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {fichasAgrupadas.length > 0 ? (
                  fichasAgrupadas.map((grupo, gIndex) => {
                    const estaAberto = indexAberto === gIndex;
                    
                    return (
                      <div 
                        key={gIndex} 
                        className={`p-6 sm:p-8 rounded-[2.5rem] shadow-xl relative transition-all duration-300 ${
                          mostrarArquivados 
                            ? 'bg-[var(--surface-sec)]/50 opacity-75 grayscale-[30%] border-2 border-dashed border-[var(--border)]' 
                            : 'bg-[var(--surface)] border border-[var(--border)]'
                        }`}
                      >
                        <div 
                          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-[var(--border)] pb-4 cursor-pointer"
                          onClick={() => setIndexAberto(estaAberto ? null : gIndex)}
                        >
                          <div>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${mostrarArquivados ? 'bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] border-[var(--border)]' : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'}`}>
                              {mostrarArquivados ? t.workouts.archived : t.workouts.program}
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black mt-3 text-[var(--text-primary)] tracking-tight">
                              {grupo.nomeMaster}
                            </h2>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {grupo.treinos[0].tipo_treino && (
                                <span className="text-[9px] font-bold bg-[var(--surface-sec)] text-[var(--text-secondary)] px-2 py-1 rounded-lg border border-[var(--border)]">
                                  {grupo.treinos[0].tipo_treino}
                                </span>
                              )}
                              {grupo.treinos[0].objetivo && (
                                <span className="text-[9px] font-bold bg-[var(--surface-sec)] text-[var(--text-secondary)] px-2 py-1 rounded-lg border border-[var(--border)]">
                                  {grupo.treinos[0].objetivo}
                                </span>
                              )}
                              {grupo.treinos[0].dificuldade && (
                                <span className="text-[9px] font-bold bg-[var(--surface-sec)] text-[var(--text-secondary)] px-2 py-1 rounded-lg border border-[var(--border)]">
                                  {grupo.treinos[0].dificuldade}
                                </span>
                              )}
                            </div>
                          </div>
                                  
                          <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { setProgramaParaAtribuir(grupo.treinos); setIsModalAtribuirOpen(true); }} className="bg-[var(--primary)]/10 text-[var(--primary)] p-3 rounded-xl hover:bg-[var(--primary)] hover:text-white transition-colors" title={t.workouts.assign}>
                              <FaUsers size={14} />
                            </button>
                            
                            {mostrarArquivados ? (
                              <button onClick={() => toggleArquivarPrograma(grupo.treinos, false)} className="bg-[var(--success)]/10 text-[var(--success)] p-3 rounded-xl hover:bg-[var(--success)] hover:text-white transition-colors" title={t.workouts.restore}>
                                <FaUndo size={14} />
                              </button>
                            ) : (
                              <button onClick={() => toggleArquivarPrograma(grupo.treinos, true)} className="bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] p-3 rounded-xl hover:bg-[var(--text-secondary)] hover:text-[var(--bg)] transition-colors" title={t.workouts.archive}>
                                <FaArchive size={14} />
                              </button>
                            )}

                            <button onClick={() => excluirProgramaCompleto(grupo.treinos)} className="text-[var(--danger)] bg-[var(--danger)]/10 p-3 rounded-xl hover:bg-[var(--danger)]/20 transition-colors" title="Excluir Definitivamente">
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>

                        {estaAberto && (
                          <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {grupo.treinos.map((treino: any) => (
                              <div key={treino.id} className="bg-[var(--surface-sec)] p-6 rounded-[1.5rem] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all">
                                <div className="mb-4">
                                  <h3 className="text-lg font-black text-[var(--text-primary)]">{treino.nome_sub}</h3>
                                </div>
                                <div className="space-y-3 mb-6">
                                  {treino.exercicios?.map((ex: any, eIdx: number) => (
                                    <div key={eIdx} className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
                                      <p className="font-black text-xs text-[var(--text-primary)] mb-2">{eIdx + 1}. {ex.nome}</p>
                                      {ex.observacao && <p className="text-[9px] text-[var(--text-secondary)] italic mb-3">"{ex.observacao}"</p>}
                                      
                                      <div className="grid grid-cols-4 gap-1 text-[9px] font-black uppercase text-[var(--text-secondary)] mb-1 text-center">
                                        <span>Série</span><span>Reps</span><span>Carga</span><span>Desc.</span>
                                      </div>
                                      {ex.series?.map((s: any, sIdx: number) => (
                                        <div key={sIdx} className="grid grid-cols-4 gap-1 text-[11px] font-bold text-[var(--text-primary)] bg-[var(--bg)] py-1.5 rounded-lg text-center mb-1">
                                          <span>{s.ordem || sIdx + 1 + 'ª'}</span>
                                          <span>{s.reps}</span>
                                          <span>{s.carga}{s.unidadeCarga}</span>
                                          <span>{s.intervalo}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>

                                <div className="flex gap-2">
                                  <button onClick={() => router.push(`/dashboard/aluno/${id}/treino/${treino.id}`)} className="flex-[2] text-[10px] font-black uppercase tracking-widest text-[var(--primary)] py-3 bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-[1.2rem]">
                                    {t.workouts.viewDetails}
                                  </button>
                                  <button onClick={() => router.push(`/dashboard/aluno/${id}/editar-ficha/${treino.id}`)} className="flex-1 text-[10px] font-black uppercase tracking-widest text-white py-3 bg-[var(--primary)] rounded-[1.2rem] flex items-center justify-center gap-2">
                                    <FaEdit size={12} /> <span className="hidden sm:inline">{t.workouts.edit}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-[var(--border)] rounded-[2rem] bg-[var(--surface)]/50">
                    <p className="text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest">{t.workouts.empty}</p>
                  </div>
                )}
              </div>

              {!mostrarArquivados && (
                <a href={`/dashboard/aluno/${id}/nova-ficha`} className="flex items-center justify-center gap-2 w-full bg-[var(--primary)] text-white p-5 rounded-[1.5rem] font-black text-[10px] sm:text-[11px] uppercase tracking-widest active:scale-[0.98] transition-transform shadow-lg shadow-[var(--primary)]/20 mt-6">
                  <FaPlus size={12} /> {t.workouts.new}
                </a>
              )}
            </section>
          )}

          {/* ABA 2: FREQUÊNCIA (GRÁFICO DE BARRAS PREMIUM) */}
          {abaAtiva === 'frequencia' && (
            <section className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-[var(--text-primary)]">{t.frequency.title}</h2>
                <p className="text-[var(--text-secondary)] font-black uppercase text-[9px] sm:text-[10px] tracking-widest mt-1">{t.frequency.subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest text-center">{t.frequency.totalWorkouts}</span>
                  <span className="text-3xl font-black text-[var(--primary)]">{metricasFrequencia.total}</span>
                </div>
                <div className="bg-[var(--surface)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest text-center">{t.frequency.avgWeek}</span>
                  <span className="text-3xl font-black text-[var(--primary)]">{metricasFrequencia.mediaSemana}</span>
                </div>
              </div>

              <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] h-64 sm:h-80 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-[var(--primary)]/5 to-transparent pointer-events-none" />
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="font-black text-[var(--text-secondary)] text-[10px] uppercase tracking-widest flex items-center gap-2"><FaCalendarCheck /> {t.frequency.workoutsMonth}</h3>
                </div>
                
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={frequenciaMensal} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBarGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={1}/>
                        <stop offset="100%" stopColor="var(--primary-soft)" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#e5e7eb'} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'var(--primary)', opacity: 0.05 }} contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontWeight: '900', textTransform: 'uppercase', fontSize: '11px' }} itemStyle={{ color: 'var(--primary)', fontSize: '14px' }}/>
                    <Bar dataKey="treinos" fill="url(#colorBarGlow)" radius={[8, 8, 8, 8]} barSize={28} animationDuration={1200} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* ABA 3: EVOLUÇÃO (UPGRADE PREMIUM DE GRÁFICOS TRIPLOS COM EFEITO NEON/GLOW) */}
          {abaAtiva === 'evolucao' && (
            <section className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-500">
              <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-end">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-[var(--text-primary)]">{t.evolution.title}</h2>
                  <p className="text-[var(--text-secondary)] font-black uppercase text-[9px] sm:text-[10px] tracking-widest mt-1">{t.evolution.subtitle}</p>
                </div>
                <button onClick={() => setIsModalAvaliacaoOpen(true)} className="w-full sm:w-auto bg-[var(--primary)] text-white px-6 py-4 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform shadow-md shadow-[var(--primary)]/20 flex items-center justify-center gap-2"><FaPlus size={10} /> {t.evolution.newEval}</button>
              </div>

              {/* GRÁFICOS DETALHADOS DE EVOLUÇÃO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                
                {/* 1. Evolução de Peso */}
                <div className="bg-[var(--surface)] p-6 rounded-[2.5rem] border border-[var(--border)] h-72 shadow-sm flex flex-col">
                  <h3 className="font-black text-[var(--text-secondary)] text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><FaChartLine /> {t.evolution.weight}</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData.filter(a => a.peso)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.4" floodColor="var(--primary)" />
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#e5e7eb'} />
                      <XAxis dataKey="data_avaliacao" tickFormatter={(v) => new Date(v).toLocaleDateString(lang, { day: '2-digit', month: '2-digit' })} tick={{fontSize: 9, fill: 'var(--text-secondary)', fontWeight: 700}} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 700}} axisLine={false} tickLine={false} />
                      <Tooltip labelFormatter={(l) => new Date(l).toLocaleDateString(lang)} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--primary)' }} />
                      <Line filter="url(#glowLine)" type="monotone" name="Peso (kg)" dataKey="peso" stroke="var(--primary)" strokeWidth={4} dot={false} activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: 3 }} animationDuration={1500} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 2. Evolução de Gordura Corporal */}
                <div className="bg-[var(--surface)] p-6 rounded-[2.5rem] border border-[var(--border)] h-72 shadow-sm flex flex-col relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--danger)]/5 to-transparent pointer-events-none" />
                  <h3 className="font-black text-[var(--text-secondary)] text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10"><FaChartLine /> {t.evolution.fat}</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData.filter(a => a.gordura)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGordura" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#e5e7eb'} />
                      <XAxis dataKey="data_avaliacao" tickFormatter={(v) => new Date(v).toLocaleDateString(lang, { day: '2-digit', month: '2-digit' })} tick={{fontSize: 9, fill: 'var(--text-secondary)', fontWeight: 700}} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 700}} axisLine={false} tickLine={false} />
                      <Tooltip labelFormatter={(l) => new Date(l).toLocaleDateString(lang)} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--danger)' }} />
                      <Area type="monotone" name="Gordura (%)" dataKey="gordura" stroke="var(--danger)" strokeWidth={4} fillOpacity={1} fill="url(#colorGordura)" animationDuration={1500} dot={false} activeDot={{ r: 6, fill: "var(--danger)", stroke: "var(--surface)", strokeWidth: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* 3. Evolução de Circunferências (Largura Total) */}
                <div className="bg-[var(--surface)] p-6 rounded-[2.5rem] border border-[var(--border)] h-72 shadow-sm flex flex-col md:col-span-2">
                  <h3 className="font-black text-[var(--text-secondary)] text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><FaChartLine /> {t.evolution.measures}</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData.filter(a => a.abdomen || a.cintura || a.quadril)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#e5e7eb'} />
                      <XAxis dataKey="data_avaliacao" tickFormatter={(v) => new Date(v).toLocaleDateString(lang, { day: '2-digit', month: '2-digit' })} tick={{fontSize: 9, fill: 'var(--text-secondary)', fontWeight: 700}} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 700}} axisLine={false} tickLine={false} />
                      <Tooltip labelFormatter={(l) => new Date(l).toLocaleDateString(lang)} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                      <Line type="monotone" name="Abdômen" dataKey="abdomen" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }} animationDuration={1500} />
                      <Line type="monotone" name="Cintura" dataKey="cintura" stroke="#F59E0B" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }} animationDuration={1500} />
                      <Line type="monotone" name="Quadril" dataKey="quadril" stroke="#22C55E" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }} animationDuration={1500} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

              </div>

              <div className="space-y-4">
                {historico.filter(a => !a.tipo).map((av) => (
                  <div key={av.id} className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-md hover:border-[var(--primary)]/30 transition-colors">
                    <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
                      <p className="font-black text-lg text-[var(--text-primary)] bg-[var(--surface-sec)] px-4 py-1.5 rounded-xl">
                        {new Date(av.data_avaliacao).toLocaleDateString(lang)}
                      </p>
                      <button onClick={() => excluirAvaliacao(av.id)} className="text-[var(--text-secondary)] hover:text-[var(--danger)] bg-[var(--surface-sec)] hover:bg-[var(--danger)]/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                        <FaTrash size={10} /> <span className="hidden sm:inline">{t.evolution.delete}</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(av).map(([key, val]: any) => {
                        const camposProibidos = ['id', 'aluno_id', 'data_avaliacao', 'observacoes', 'tipo', 'personal_id', 'created_at', 'updated_at'];
                        if (camposProibidos.includes(key) || !val) return null;
                        return (
                          <div key={key} className="bg-[var(--surface-sec)] p-4 rounded-[1.2rem] border border-[var(--border)] shadow-inner">
                            <p className="text-[8px] sm:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest truncate mb-1">{key.replace('_', ' ')}</p>
                            <p className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                              {val}<span className="text-[9px] text-[var(--text-secondary)] ml-1">{['peso', 'gordura'].includes(key) ? (key === 'peso' ? 'kg' : '%') : 'cm'}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ABA 4: FEEDBACKS */}
          {abaAtiva === 'feedback' && (
            <section className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-[var(--text-primary)]">{t.feedback.title}</h2>
                  <p className="text-[var(--text-secondary)] font-black uppercase text-[9px] sm:text-[10px] tracking-widest mt-1">{t.feedback.subtitle}</p>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] bg-[var(--primary)]/10 px-4 py-2 rounded-full border border-[var(--primary)]/20 shadow-sm">{feedbacks.length}</div>
              </div>
              <div className="grid gap-4">
                {feedbacks.length > 0 ? feedbacks.map((f) => (
                    <div key={f.id} className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-md">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-black text-lg shadow-inner ${f.intensidade > 7 ? 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20' : 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20'}`}>{f.intensidade}</div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{t.feedback.intensity}</p>
                            <p className="font-black text-[var(--text-primary)] text-sm">{t.feedback.level} {f.intensidade} / 10</p>
                          </div>
                        </div>
                        <button onClick={() => excluirFeedback(f.id)} className="text-[var(--text-secondary)] hover:text-[var(--danger)] bg-[var(--surface-sec)] hover:bg-[var(--danger)]/10 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"><FaTrash size={12} /></button>
                      </div>
                      <div className="text-sm italic font-medium leading-relaxed text-[var(--text-primary)] bg-[var(--surface-sec)] p-6 rounded-[1.5rem] border-l-4 border-[var(--primary)] shadow-inner">"{f.observacoes}"</div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] mt-5 text-right">{new Date(f.data_criacao).toLocaleDateString(lang)}</p>
                    </div>
                  )) : <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-[2.5rem] bg-[var(--surface)]/50"><p className="text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest">{t.feedback.empty}</p></div>}
              </div>
            </section>
          )}

          {/* ABA 5: DOCUMENTOS / ARQUIVOS */}
          {abaAtiva === 'arquivos' && (
            <section className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-500">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-[var(--text-primary)]">{t.files.title}</h2>
                <p className="text-[var(--text-secondary)] font-black uppercase text-[9px] sm:text-[10px] tracking-widest mt-1">{t.files.subtitle}</p>
              </div>

              <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] border-2 border-dashed border-[var(--border)] text-center hover:border-[var(--primary)] hover:bg-[var(--surface-sec)] transition-all">
                <label className="cursor-pointer flex flex-col items-center gap-4">
                  <div className="p-4 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl shadow-inner"><FaUpload size={24} /></div>
                  <span className="font-black text-[11px] text-[var(--text-primary)] uppercase tracking-widest">{t.files.upload}</span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const filePath = `${id}/${Date.now()}-${file.name}`;
                      const { error: uploadError } = await supabase.storage.from('documentos-alunos').upload(filePath, file);
                      if (uploadError) return showToast('error', t.alerts.errUpload);
                      await supabase.from('documentos').insert({ aluno_id: id, url: filePath, nome_arquivo: file.name });
                      showToast('success', t.alerts.successUpload); await fetchArquivos(); 
                  }}/>
                </label>
              </div>

              <div className="space-y-4">
                {arquivos && arquivos.length > 0 ? arquivos.map((arq: any) => (
                    <div key={arq.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] shadow-sm gap-4 hover:border-[var(--primary)]/30 transition-colors">
                      <div className="flex items-center gap-4 overflow-hidden w-full sm:w-auto">
                        <div className="p-3 bg-[var(--danger)]/10 text-[var(--danger)] rounded-xl shrink-0"><FaFilePdf size={16} /></div>
                        <span className="font-black text-xs text-[var(--text-primary)] truncate">{arq.nome_arquivo}</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button onClick={() => { const { data } = supabase.storage.from('documentos-alunos').getPublicUrl(arq.url); window.open(data.publicUrl, '_blank'); }} className="flex-1 sm:flex-none text-[9px] font-black uppercase tracking-widest bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-3 rounded-xl hover:bg-[var(--primary)]/20 transition-colors text-center">{t.files.open}</button>
                        <button onClick={async () => {
                            if (!window.confirm(t.alerts.confirmArquivo)) return;
                            await supabase.storage.from('documentos-alunos').remove([arq.url]);
                            await supabase.from('documentos').delete().eq('id', arq.id); await fetchArquivos();
                        }} className="p-3 bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-xl transition-colors shrink-0" title="Remover"><FaTrash size={14} /></button>
                      </div>
                    </div>
                  )) : <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-[2.5rem] bg-[var(--surface)]/50"><p className="text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest">{t.files.empty}</p></div>}
              </div>
            </section>
          )}

          {/* NOVA MODAL DE AVALIAÇÃO FÍSICA (FULLSCREEN NO MOBILE / BLINDADA CONTRA TECLADO) */}
          {isModalAvaliacaoOpen && (
            <div className="fixed inset-0 z-[99999] flex sm:items-center justify-center sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
              
              {/* O Container principal: Tela cheia no celular (h-full w-full), e modal normal no PC */}
              <div className="bg-[var(--surface)] w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-[2.5rem] flex flex-col shadow-2xl border border-[var(--border)] animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300">
                
                {/* CABEÇALHO FIXO */}
                <div className="p-5 sm:p-8 border-b border-[var(--border)] flex justify-between items-center shrink-0 pt-[max(env(safe-area-inset-top,1.25rem),1.25rem)]">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tighter text-[var(--text-primary)]">{t.modalEval.title}</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-black mt-1">{t.modalEval.subtitle}</p>
                  </div>
                  <button onClick={() => setIsModalAvaliacaoOpen(false)} className="w-10 h-10 bg-[var(--surface-sec)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <span className="font-bold text-lg leading-none">&times;</span>
                  </button>
                </div>

                {/* CONTEÚDO ROLÁVEL (Aqui o teclado não quebra a tela) */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {Object.keys(medidas).filter(k => k !== 'observacoes').map((key) => (
                      <div key={key} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest pl-1">{key.replace('_', ' ')}</label>
                        <input 
                          type="number" 
                          className="w-full p-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] font-bold text-[var(--text-primary)] text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-inner placeholder:text-[var(--text-secondary)]" 
                          placeholder="0.0" 
                          onChange={(e) => setMedidas({...medidas, [key]: e.target.value})} 
                        />
                      </div>
                    ))}
                  </div>
                  <textarea 
                    className="w-full p-5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] mt-6 outline-none font-medium text-sm h-32 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] shadow-inner custom-scrollbar" 
                    placeholder={t.modalEval.obs} 
                    onChange={(e) => setMedidas({...medidas, observacoes: e.target.value})} 
                  />
                </div>

                {/* RODAPÉ FIXO (Ajustado com +6.5rem no mobile para flutuar perfeitamente acima da navbar inferior) */}
                <div className="p-5 sm:p-8 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 flex gap-4 pb-[calc(max(env(safe-area-inset-bottom),1.25rem)+6.5rem)] sm:pb-8">
                  <button onClick={() => setIsModalAvaliacaoOpen(false)} className="flex-1 py-4 sm:py-5 bg-[var(--surface-sec)] text-[var(--text-primary)] hover:bg-[var(--border)] rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-colors active:scale-95 border border-[var(--border)]">{t.modalEval.cancel}</button>
                  <button onClick={salvarAvaliacaoCompleta} className="flex-1 py-4 sm:py-5 bg-[var(--primary)] text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-lg shadow-[var(--primary)]/20 transition-all active:scale-95">{t.modalEval.save}</button>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function DetalheAluno({ params }: { params: Promise<{ id: string }> }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const bgTheme = mounted && localStorage.getItem('@premium_theme') === 'light' ? '#F3F6FB' : '#0F1115';

  return (
    <Suspense fallback={
      <main style={{ backgroundColor: bgTheme }} className="min-h-screen transition-colors duration-500">
        <DetalheAlunoSkeleton />
      </main>
    }>
      <DetalheAlunoContent params={params} />
    </Suspense>
  );
}
