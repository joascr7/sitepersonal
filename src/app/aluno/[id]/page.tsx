'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ptBR, pt, enUS } from 'date-fns/locale';
import { NotificationService } from '@/lib/notificationService';
import { NotificationBell } from '@/components/NotificationBell';
import { 
  FaDumbbell, 
  FaClipboardList, 
  FaChartLine, 
  FaFileInvoice, 
  FaFolderOpen, 
  FaUserCircle, 
  FaCommentMedical, 
  FaChevronLeft, 
  FaChevronRight,
  FaMoon,
  FaSun,
  FaGlobe
} from 'react-icons/fa';
import { LineChart, Line, Tooltip, ResponsiveContainer, YAxis, XAxis } from 'recharts';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    status: 'Status',
    active: 'Assinatura Ativa',
    blocked: 'Bloqueado',
    due: 'Vencimento',
    today: 'Treino do dia',
    start: 'Iniciar Agora',
    none: 'Nenhum treino pendente para hoje.',
    week: 'Sua semana de treinos',
    historyBtn: 'Ver Histórico Completo',
    trainings: 'Treinos',
    evaluations: 'Avaliações',
    progress: 'Progresso',
    feedback: 'Feedback',
    invoices: 'Faturas',
    files: 'Arquivos',
    historyTitle: 'Histórico de Treinos',
    analysis: 'Análise Corporal',
    evolution: 'Sua Evolução',
    currentWeight: 'Peso Atual',
    prevWeight: 'Peso Anterior',
    sinceLast: 'desde a última',
    lastMark: 'Última marca',
    details: 'Medidas Detalhadas (cm)',
    obs: 'Observações do Personal',
    dateOfRecord: 'Data do registro'
  },
  'pt-PT': {
    status: 'Estado',
    active: 'Assinatura Ativa',
    blocked: 'Bloqueado',
    due: 'Vencimento',
    today: 'Treino de hoje',
    start: 'Iniciar Agora',
    none: 'Nenhum treino pendente para hoje.',
    week: 'A sua semana de treinos',
    historyBtn: 'Ver Histórico Completo',
    trainings: 'Treinos',
    evaluations: 'Avaliações',
    progress: 'Progresso',
    feedback: 'Feedback',
    invoices: 'Faturas',
    files: 'Ficheiros',
    historyTitle: 'Histórico de Treinos',
    analysis: 'Análise Corporal',
    evolution: 'A Sua Evolução',
    currentWeight: 'Peso Atual',
    prevWeight: 'Peso Anterior',
    sinceLast: 'desde a última',
    lastMark: 'Última marca',
    details: 'Medidas Detalhadas (cm)',
    obs: 'Observações do Personal',
    dateOfRecord: 'Data do registo'
  },
  'en': {
    status: 'Status',
    active: 'Active Subscription',
    blocked: 'Blocked',
    due: 'Due Date',
    today: 'Workout of the day',
    start: 'Start Now',
    none: 'No pending workouts for today.',
    week: 'Your training week',
    historyBtn: 'View Full History',
    trainings: 'Workouts',
    evaluations: 'Assessments',
    progress: 'Progress',
    feedback: 'Feedback',
    invoices: 'Invoices',
    files: 'Files',
    historyTitle: 'Workout History',
    analysis: 'Body Analysis',
    evolution: 'Your Evolution',
    currentWeight: 'Current Wt.',
    prevWeight: 'Previous Wt.',
    sinceLast: 'since last',
    lastMark: 'Last mark',
    details: 'Detailed Measurements (cm)',
    obs: 'Trainer Notes',
    dateOfRecord: 'Record date'
  }
};

export default function AreaDoAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [aluno, setAluno] = useState<any>(null);
  const [personal, setPersonal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [modalAberta, setModalAberta] = useState(false);
  const [diasTreino, setDiasTreino] = useState<Date[]>([]);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [treinoDoDia, setTreinoDoDia] = useState<any>(null);
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
    NotificationService.registrarDispositivo();
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

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--primary-soft': '#60A5FA',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--primary-soft': '#60A5FA',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  // Memoiza processamento de dias para evitar lentidão
  const diasSemana = useMemo(() => 
    eachDayOfInterval({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }), 
  []);

  useEffect(() => {
    if (!id) return;
    
    async function init() {
      // 1. Busca dados do aluno
      const { data: alunoData } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
      if (!alunoData) return;
      setAluno(alunoData);

      // 2. Busca dados do personal
      if (alunoData.personal_id) {
        const { data: pData } = await supabase.from('personais').select('*').eq('id', alunoData.personal_id).maybeSingle();
        setPersonal(pData);
      }

      // 3. Busca todo o histórico para o calendário e para definir o último treino
      const { data: conclusoes } = await supabase
        .from('conclusoes_treino')
        .select('data_conclusao, treino_id')
        .eq('aluno_id', id);
      
      if (conclusoes) {
        const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
        const treinosSemana = conclusoes.filter(c => c.data_conclusao >= inicioSemana);
        setDiasTreino(treinosSemana.map(d => parseISO(d.data_conclusao)));
      }

      // 4. LÓGICA DE AVANÇO SEQUENCIAL ROBUSTA (A -> B -> C -> A)
      const { data: todasFichas } = await supabase
        .from('fichas')
        .select('*')
        .eq('aluno_id', id)
        .order('ordem', { ascending: true }) // Ordena pela ordem configurada pelo personal
        .order('nome_treino', { ascending: true }); // Fallback de segurança

      if (todasFichas && todasFichas.length > 0) {
        if (!conclusoes || conclusoes.length === 0) {
          // Se o aluno nunca treinou, o primeiro treino da lista é o de hoje
          setTreinoDoDia(todasFichas[0]);
        } else {
          // Pega o último treino feito ordenando o histórico por data
          const ultimaConclusao = conclusoes.sort((a, b) => 
            new Date(b.data_conclusao).getTime() - new Date(a.data_conclusao).getTime()
          )[0];

          // Descobre a posição (índice) do último treino na lista de fichas ativas
          const indexUltimo = todasFichas.findIndex(f => f.id === ultimaConclusao.treino_id);

          if (indexUltimo !== -1 && indexUltimo < todasFichas.length - 1) {
            // Se não era o último da lista, passa para o próximo
            setTreinoDoDia(todasFichas[indexUltimo + 1]);
          } else {
            // Se era o último da fila (ou não foi encontrado), reseta para o primeiro
            setTreinoDoDia(todasFichas[0]);
          }
        }
      } else {
        setTreinoDoDia(null);
      }

      setLoading(false);
    }
    
    init();
  }, [id]);

  if (loading) return (
    <main style={themeStyles} className="min-h-screen bg-[var(--bg)] p-6 space-y-8 animate-pulse pt-[max(env(safe-area-inset-top),1.5rem)]">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[var(--surface-sec)] rounded-full" />
          <div className="space-y-2">
            <div className="w-24 h-4 bg-[var(--surface-sec)] rounded-full" />
            <div className="w-16 h-3 bg-[var(--surface-sec)] rounded-full" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="w-48 h-8 bg-[var(--surface-sec)] rounded-full" />
        <div className="w-32 h-3 bg-[var(--surface-sec)] rounded-full" />
        <div className="w-full h-32 bg-[var(--surface-sec)] rounded-3xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[var(--surface-sec)] rounded-3xl" />
        ))}
      </div>
    </main>
  );

  return (
    <main 
      style={themeStyles} 
      className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto flex flex-col pt-[max(env(safe-area-inset-top),1.5rem)] px-5 pb-32 space-y-6">

        {/* ━━━━━━━━━━ HEADER & PREFERENCES ━━━━━━━━━━ */}
        <header className="flex justify-between items-center w-full mt-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[var(--primary)] to-[var(--primary-soft)] shadow-lg shadow-[var(--primary)]/20 shrink-0">
              <div className="w-full h-full rounded-full bg-[var(--surface)] p-[2px]">
                {personal?.avatar_url ? (
                  <img src={personal.avatar_url} alt="Personal Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <FaUserCircle className="w-full h-full text-[var(--text-secondary)]" />
                )}
              </div>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">Personal Trainer</span>
              <h1 className="font-black text-lg leading-none tracking-tight truncate">{personal?.nome || 'Personal'}</h1>
              <p className="text-[var(--primary)] text-[9px] font-black uppercase tracking-[0.2em] mt-1">CREF: {personal?.cref || 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex gap-2 shrink-0">
            {/* Ícone de Idioma */}
            <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 shadow-sm relative">
              <FaGlobe size={16} />
              <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none flex items-center">{lang.split('-')[0].toUpperCase()}</span>
            </button>

            {/* SININHO DE NOTIFICAÇÕES */}
            <div className="flex items-center justify-center">
              <NotificationBell />
            </div>

            {/* Ícone de Tema */}
            <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 shadow-sm">
              {isDark ? <FaSun size={16} /> : <FaMoon size={16} />}
            </button>
          </div>
        </header>

        {/* ━━━━━━━━━━ BANNER DE ATIVAÇÃO PUSH ━━━━━━━━━━ */}
        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
          <div className="bg-gradient-to-r from-blue-600 to-[var(--primary)] p-5 rounded-[1.5rem] border border-white/10 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-black text-sm text-white tracking-tight">Não perca nenhum treino! </h3>
                <p className="text-white/80 text-[11px] font-medium leading-relaxed mt-1">
                  Ative as notificações para receber os novos treinos e avisos do seu Personal diretamente no telemóvel.
                </p>
              </div>
              <button 
                onClick={async () => {
                  await NotificationService.registrarDispositivo();
                  // Força a atualização do ecrã para sumir com o banner após o clique
                  router.refresh();
                }}
                className="w-full py-2.5 bg-white text-[var(--primary)] rounded-xl font-black text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all shadow-md"
              >
                Permitir Notificações
              </button>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━ STATUS ALUNO ━━━━━━━━━━ */}
        {aluno && (
          <div className="bg-[var(--surface)] p-4 rounded-[1.5rem] border border-[var(--border)] flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase text-[var(--text-secondary)] tracking-widest mb-1">{t.status}</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${aluno.status_pagamento === 'bloqueado' ? 'bg-[var(--danger)] shadow-[0_0_8px_var(--danger)]' : 'bg-[var(--success)] shadow-[0_0_8px_var(--success)]'}`} />
                <span className="font-black text-[12px]">{aluno.status_pagamento === 'bloqueado' ? t.blocked : t.active}</span>
              </div>
            </div>
            <div className="text-right flex flex-col">
              <span className="text-[9px] font-bold uppercase text-[var(--text-secondary)] tracking-widest mb-1">{t.due}</span>
              <span className="font-black text-[12px]">{aluno.data_vencimento ? new Date(aluno.data_vencimento).toLocaleDateString(lang) : 'N/A'}</span>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━ SAUDAÇÃO E HORÁRIO ATUAL ━━━━━━━━━━ */}
        <div className="px-2 animate-in fade-in duration-700 delay-300 flex justify-between items-end">
           <div>
             <h3 className="text-[14px] font-bold text-[var(--text-primary)]">
               {getSaudacao()}, {aluno?.nome?.split(' ')[0] || 'Aluno'}! 👋
             </h3>
             <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-widest mt-1">
               {format(horaAtual, "EEEE, d 'de' MMMM", { locale: lang === 'pt-BR' ? ptBR : lang === 'pt-PT' ? pt : enUS })}
             </p>
           </div>
           
           {/* Relógio em tempo real */}
           <div className="bg-[var(--surface-sec)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
              <p className="text-[14px] font-black text-[var(--primary)] tabular-nums tracking-widest">
                {format(horaAtual, 'HH:mm:ss')}
              </p>
           </div>
        </div>

        {/* ━━━━━━━━━━ HERO: TREINO DO DIA ━━━━━━━━━━ */}
        {treinoDoDia ? (
          (() => {
            // Regex Inteligente: Extrai estritamente padrões como "Treino A", "Treino B", "Treino 1"
            let nomeLimpoHero = treinoDoDia.nome_treino || '';
            const matchTreino = nomeLimpoHero.match(/(treino\s+[a-z0-9]+)/i);
            
            if (matchTreino) {
              nomeLimpoHero = matchTreino[0].toUpperCase();
            } else if (nomeLimpoHero.includes('-')) {
              // Caso não tenha "Treino A/B", pega a última parte após um traço
              nomeLimpoHero = nomeLimpoHero.split('-').pop()?.trim() || nomeLimpoHero;
            }

            return (
              <section className="relative overflow-hidden bg-gradient-to-br from-[var(--primary)] to-blue-800 p-8 rounded-[2rem] shadow-[0_10px_30px_-10px_var(--primary)] border border-white/10 group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                {/* Efeito Glow Premium */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[50px] rounded-full transform translate-x-1/2 -translate-y-1/2" />
                
                <div className="relative z-10 flex justify-between items-start mb-8">
                  <div className="flex flex-col flex-1 pr-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">{t.today}</span>
                    <h2 className="text-3xl font-black tracking-tight text-white leading-tight break-words">
                      {nomeLimpoHero}
                    </h2>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md p-3.5 rounded-2xl shadow-inner shrink-0">
                    <FaDumbbell className="text-white text-xl" />
                  </div>
                </div>
                <button 
                  onClick={() => router.push(`/aluno/${id}/treino/${treinoDoDia.id}`)}
                  className="relative z-10 w-full py-4 bg-white text-[var(--primary)] rounded-2xl font-black text-[12px] uppercase tracking-widest transition-transform active:scale-[0.98] shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
                >
                  {t.start}
                </button>
              </section>
            );
          })()
        ) : (
          <div className="p-8 text-center bg-[var(--surface)] rounded-[2rem] border border-dashed border-[var(--border)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <p className="text-[var(--text-secondary)] text-sm font-bold">{t.none}</p>
          </div>
        )}

        {/* ━━━━━━━━━━ WEEK CALENDAR ━━━━━━━━━━ */}
        <section className="bg-[var(--surface)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">{t.week}</h2>
          </div>
          <div className="flex justify-between items-center">
            {diasSemana.map((dia, i) => {
              const treinou = diasTreino.some(d => isSameDay(d, dia));
              const hoje = isSameDay(dia, new Date());
              const localeObj = lang === 'pt-BR' ? ptBR : lang === 'pt-PT' ? pt : enUS;
              
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center font-black text-sm transition-all duration-300 ${
                    treinou 
                      ? 'bg-[var(--primary)] text-white shadow-[0_4px_15px_-3px_var(--primary)]' 
                      : hoje 
                        ? 'bg-[var(--surface-sec)] border-2 border-[var(--primary)] text-[var(--primary)]' 
                        : 'bg-[var(--surface-sec)] text-[var(--text-secondary)]'
                  }`}>
                    {treinou ? '✓' : format(dia, 'd')}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${hoje ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {format(dia, 'EEEEE', { locale: localeObj })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <button 
          onClick={() => setCalendarioAberto(true)}
          className="w-full py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200"
        >
          {t.historyBtn}
        </button>

        {/* ━━━━━━━━━━ GRID MENU ━━━━━━━━━━ */}
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <BotaoMenu icon={<FaDumbbell />} label={t.trainings} onClick={() => router.push(`/aluno/${id}/treinos`)} />
          <BotaoMenu icon={<FaClipboardList />} label={t.evaluations} onClick={async () => { 
            const { data } = await supabase.from('avaliacoes_fisicas').select('*').eq('aluno_id', id); 
            if(data) { setAvaliacoes(data); setModalAberta(true); } 
          }} />
          <BotaoMenu icon={<FaChartLine />} label={t.progress} onClick={() => router.push(`/aluno/${id}/progresso`)} />
          <BotaoMenu icon={<FaCommentMedical />} label={t.feedback} onClick={() => router.push(`/aluno/${id}/feedback`)} />
          <BotaoMenu icon={<FaFileInvoice />} label={t.invoices} onClick={() => router.push(`/aluno/${id}/faturas`)} />
          <BotaoMenu icon={<FaFolderOpen />} label={t.files} onClick={() => router.push(`/aluno/${id}/arquivos`)} />
        </div>

        {/* Modais */}
        {modalAberta && (
          <ModalAvaliacao 
            isOpen={modalAberta} 
            onClose={() => setModalAberta(false)} 
            avaliacao={avaliacoes[avaliacoes.length - 1]} 
            historico={avaliacoes.map(a => ({ data: new Date(a.data_avaliacao).toLocaleDateString(), peso: a.peso }))}
            themeStyles={themeStyles}
            t={t}
            lang={lang}
          />
        )}

        {/* Espaçador inferior para não colar na Navbar */}
        <div className="h-20 w-full shrink-0" aria-hidden="true" />
      </div>

      {/* ━━━━━━━━━━ MODAL: CALENDÁRIO ━━━━━━━━━━ */}
      {calendarioAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 transition-opacity">
          <div style={themeStyles} className="bg-[var(--surface)] w-full max-w-sm p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-2xl transform transition-transform animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">{t.historyTitle}</h2>
              <button onClick={() => setCalendarioAberto(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <CalendarioTreino diasTreinados={diasTreino} lang={lang} />
          </div>
        </div>
      )}
    </main>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTES AUXILIARES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function BotaoMenu({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all shadow-sm hover:shadow-[0_10px_30px_-15px_var(--primary)] hover:border-[var(--primary)]/50 group">
      <div className="text-2xl text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors group-hover:scale-110 duration-300">{icon}</div>
      <span className="font-bold text-[11px] uppercase tracking-widest text-[var(--text-primary)]">{label}</span>
    </button>
  );
}

function CalendarioTreino({ diasTreinados, lang }: { diasTreinados: Date[], lang: string }) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const diasDoMes = useMemo(() => 
    eachDayOfInterval({ start: startOfMonth(dataAtual), end: endOfMonth(dataAtual) }), 
  [dataAtual]);

  const localeObj = lang === 'pt-BR' ? ptBR : lang === 'pt-PT' ? pt : enUS;

  return (
    <div className="bg-[var(--surface-sec)] p-6 rounded-[1.5rem] border border-[var(--border)] shadow-inner">
      <div className="flex justify-between items-center mb-6 bg-[var(--surface)] p-2 rounded-full border border-[var(--border)]">
        <button onClick={() => setDataAtual(subMonths(dataAtual, 1))} className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-all"><FaChevronLeft size={12}/></button>
        <h3 className="font-black text-xs uppercase tracking-widest text-[var(--text-primary)]">{format(dataAtual, 'MMMM yyyy', { locale: localeObj })}</h3>
        <button onClick={() => setDataAtual(addMonths(dataAtual, 1))} className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-all"><FaChevronRight size={12}/></button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center mb-4 border-b border-[var(--border)] pb-4">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] font-black text-[var(--text-secondary)] uppercase">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {diasDoMes.map((dia, i) => {
          const treinou = diasTreinados.some(d => isSameDay(d, dia));
          return (
            <div key={i} className={`w-9 h-9 sm:w-10 sm:h-10 mx-auto rounded-[12px] flex items-center justify-center text-xs font-bold transition-all relative ${
              treinou 
                ? 'bg-[var(--primary)] text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]' 
                : 'text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)]'
            } ${!isSameMonth(dia, dataAtual) ? 'opacity-20' : ''}`}>
              {format(dia, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModalAvaliacao({ isOpen, onClose, avaliacao, historico, themeStyles, t, lang }: any) {
  if (!isOpen || !avaliacao) return null;

  const pesoAnterior = historico.length > 1 ? historico[historico.length - 2].peso : 0;
  const diferenca = avaliacao.peso - pesoAnterior;

  const medidasList = [
    { label: 'Tórax', value: avaliacao.torax },
    { label: 'Ombros', value: avaliacao.ombros },
    { label: 'Abdômen', value: avaliacao.abdomen },
    { label: 'Cintura', value: avaliacao.cintura },
    { label: 'Quadril', value: avaliacao.quadril },
    { label: 'Braço Dir.', value: avaliacao.braco_direito },
  ];

  const primaryColor = typeof window !== 'undefined' && document.documentElement.style.getPropertyValue('--primary') 
                       ? document.documentElement.style.getPropertyValue('--primary') 
                       : '#3B82F6';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity">
      <div style={themeStyles} className="bg-[var(--surface)] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pt-8 sm:p-8 max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)] overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 pb-[env(safe-area-inset-bottom)]">
        
        {/* Notch indicador (Mobile) */}
        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full absolute top-3 left-1/2 -translate-x-1/2 sm:hidden" />

        {/* Header Fixo */}
        <div className="flex justify-between items-center mb-6 shrink-0 mt-2 sm:mt-0">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">{t.analysis}</h2>
            <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{t.evolution}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-90 border border-[var(--border)]">
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="overflow-y-auto flex-1 pr-2 -mr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          <div className="mb-6 bg-[var(--surface-sec)] px-4 py-3 rounded-2xl border border-[var(--border)] inline-block shadow-inner">
             <p className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-widest">
               {t.dateOfRecord}: <span className="text-[var(--text-primary)]">{new Date(avaliacao.data_avaliacao).toLocaleDateString(lang)}</span>
             </p>
          </div>
          
          {/* Gráfico Premium */}
          <div className="h-48 w-full mb-8 bg-[var(--surface-sec)] rounded-[2rem] p-4 sm:p-5 border border-[var(--border)] relative overflow-hidden group shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/5 to-transparent opacity-50" />
            
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                
                <XAxis dataKey="data" hide />
                <YAxis domain={['auto', 'auto']} hide padding={{ top: 20, bottom: 20 }} />
                
                <Tooltip 
                  cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--surface)', 
                    borderRadius: '1rem', 
                    border: '1px solid var(--border)',
                    padding: '8px 12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: 'var(--primary)' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value: any) => [value ? `${value} kg` : '-', 'Peso']}
                />
                
                <Line 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="var(--primary)" 
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ fill: 'var(--primary)', r: 4, strokeWidth: 2, stroke: 'var(--bg)' }} 
                  activeDot={{ r: 6, fill: 'var(--surface)', stroke: 'var(--primary)', strokeWidth: 3 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[var(--primary)] to-blue-700 p-5 sm:p-6 rounded-[2rem] shadow-[0_10px_20px_-10px_var(--primary)] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[30px] rounded-full transform translate-x-1/2 -translate-y-1/2" />
              <p className="text-[9px] font-bold uppercase opacity-80 mb-1 relative z-10">{t.currentWeight}</p>
              <p className="font-black text-3xl leading-none relative z-10">{avaliacao.peso || 0}<span className="text-sm opacity-70 ml-1 font-bold">kg</span></p>
              {pesoAnterior > 0 && (
                <div className="mt-3 inline-flex items-center bg-black/20 px-2 py-1.5 rounded-[0.8rem] backdrop-blur-md border border-white/10 relative z-10">
                  <span className={`text-[10px] font-black tracking-wider ${diferenca > 0 ? 'text-red-300' : 'text-green-300'}`}>
                    {diferenca > 0 ? '+' : ''}{diferenca.toFixed(1)}kg
                  </span>
                </div>
              )}
            </div>
            
            <div className="bg-[var(--surface-sec)] p-5 sm:p-6 rounded-[2rem] border border-[var(--border)] shadow-sm flex flex-col justify-center">
              <p className="text-[9px] font-bold uppercase text-[var(--text-secondary)] mb-1">{t.prevWeight}</p>
              <p className="font-black text-2xl text-[var(--text-primary)] leading-none">{pesoAnterior || 0}<span className="text-xs text-[var(--text-secondary)] ml-1 font-bold">kg</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}