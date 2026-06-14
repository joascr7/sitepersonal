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
  FaGlobe,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaLock,
  FaWhatsapp
} from 'react-icons/fa';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    status: 'Status', active: 'Assinatura Ativa', blocked: 'Bloqueado', due: 'Vencimento',
    today: 'Treino do dia', start: 'Iniciar Agora', none: 'Nenhum treino pendente para hoje.',
    week: 'Sua semana de treinos', historyBtn: 'Ver Histórico Completo',
    trainings: 'Treinos', evaluations: 'Avaliações', progress: 'Progresso',
    feedback: 'Feedback', invoices: 'Faturas', files: 'Arquivos',
    historyTitle: 'Histórico de Treinos', analysis: 'Análise Corporal', evolution: 'Sua Evolução',
    evolutionWeight: 'Evolução de Peso (kg)', evolutionFat: '% de Gordura Corporal', evolutionMeasures: 'Circunferências Principais (cm)',
    currentWeight: 'Peso Atual', prevWeight: 'Peso Anterior', sinceLast: 'desde a última',
    lastMark: 'Última marca', details: 'Medidas Detalhadas (cm)', obs: 'Observações do Personal', dateOfRecord: 'Data do registro',
    selectLanguage: 'Selecione o Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro',
    lockedTitle: 'Acesso Suspenso', lockedDesc: 'Sua assinatura está pendente ou vencida. Fale com seu Personal para liberar o acesso aos treinos.', regularize: 'Regularizar via WhatsApp'
  },
  'pt-PT': {
    status: 'Estado', active: 'Assinatura Ativa', blocked: 'Bloqueado', due: 'Vencimento',
    today: 'Treino de hoje', start: 'Iniciar Agora', none: 'Nenhum treino pendente para hoje.',
    week: 'A sua semana de treinos', historyBtn: 'Ver Histórico Completo',
    trainings: 'Treinos', evaluations: 'Avaliações', progress: 'Progresso',
    feedback: 'Feedback', invoices: 'Faturas', files: 'Ficheiros',
    historyTitle: 'Histórico de Treinos', analysis: 'Análise Corporal', evolution: 'A Sua Evolução',
    evolutionWeight: 'Evolução de Peso (kg)', evolutionFat: '% de Gordura Corporal', evolutionMeasures: 'Circunferências Principais (cm)',
    currentWeight: 'Peso Atual', prevWeight: 'Peso Anterior', sinceLast: 'desde a última',
    lastMark: 'Última marca', details: 'Medidas Detalhadas (cm)', obs: 'Observações do Personal', dateOfRecord: 'Data do registo',
    selectLanguage: 'Selecione o Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro',
    lockedTitle: 'Acesso Suspenso', lockedDesc: 'A sua assinatura encontra-se pendente ou vencida. Fale com o seu Personal para libertar os treinos.', regularize: 'Regularizar via WhatsApp'
  },
  'en': {
    status: 'Status', active: 'Active Subscription', blocked: 'Blocked', due: 'Due Date',
    today: 'Workout of the day', start: 'Start Now', none: 'No pending workouts for today.',
    week: 'Your training week', historyBtn: 'View Full History',
    trainings: 'Workouts', evaluations: 'Assessments', progress: 'Progress',
    feedback: 'Feedback', invoices: 'Invoices', files: 'Files',
    historyTitle: 'Workout History', analysis: 'Body Analysis', evolution: 'Your Evolution',
    evolutionWeight: 'Weight Evolution (kg)', evolutionFat: 'Body Fat (%)', evolutionMeasures: 'Main Circumferences (cm)',
    currentWeight: 'Current Wt.', prevWeight: 'Previous Wt.', sinceLast: 'since last',
    lastMark: 'Last mark', details: 'Detailed Measurements (cm)', obs: 'Trainer Notes', dateOfRecord: 'Record date',
    selectLanguage: 'Select Language', selectTheme: 'Appearance', themeLight: 'Light Mode', themeDark: 'Dark Mode',
    lockedTitle: 'Access Suspended', lockedDesc: 'Your subscription is pending or expired. Please contact your Trainer to unlock workouts.', regularize: 'Settle via WhatsApp'
  }
};

const languages = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DetalheAlunoSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-8 animate-pulse pt-8 px-5">
    <div className="flex justify-between items-center mb-8">
      <div className="w-12 h-12 bg-[var(--surface-sec)] rounded-full" />
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
// COMPONENTE DE CONTEÚDO (Recebe o ID diretamente como String)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AreaDoAlunoContent({ id }: { id: string }) {
  const router = useRouter();
  const [aluno, setAluno] = useState<any>(null);
  const [personal, setPersonal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diasTreino, setDiasTreino] = useState<Date[]>([]);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [treinoDoDia, setTreinoDoDia] = useState<any>(null);
  const [horaAtual, setHoraAtual] = useState(new Date());
  
  // Estados de Tema, i18n e Modais Premium
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

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

  useEffect(() => {
    const updateSettings = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
      
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);
    };

    updateSettings();
    window.addEventListener('storage', updateSettings);
    window.addEventListener('config-updated', updateSettings);
    NotificationService.registrarDispositivo();

    return () => {
      window.removeEventListener('storage', updateSettings);
      window.removeEventListener('config-updated', updateSettings);
    };
  }, []);

  // Handlers dos Modais Premium
  const handleSelectLanguage = (newLang: string) => {
    setLang(newLang as any);
    localStorage.setItem('@premium_lang', newLang);
    window.dispatchEvent(new Event('config-updated'));
    setIsLangModalOpen(false);
  };

  const handleSelectTheme = (theme: 'dark' | 'light') => {
    const newIsDark = theme === 'dark';
    setIsDark(newIsDark);
    localStorage.setItem('@premium_theme', newIsDark ? 'dark' : 'light');
    window.dispatchEvent(new Event('config-updated'));
    setIsThemeModalOpen(false);
  };

  const t = translations[lang] || translations['pt-BR'];

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--primary-soft': '#60A5FA', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--primary-soft': '#60A5FA', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const diasSemana = useMemo(() => 
    eachDayOfInterval({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }), 
  []);

  // LÓGICA DE BLOQUEIO / VENCIMENTO DO ALUNO
  const isVencido = useMemo(() => {
    if (!aluno) return false;
    if (aluno.status_pagamento === 'bloqueado') return true;
    if (!aluno.data_vencimento) return false;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(aluno.data_vencimento + 'T00:00:00');
    return hoje > vencimento;
  }, [aluno]);

  // REDIRECIONAMENTO PARA O WHATSAPP DO PERSONAL
  const handleWhatsAppRedirect = () => {
    if (!personal?.telefone) {
      alert(lang === 'en' ? 'Trainer phone not found.' : 'Número do personal não encontrado no sistema.');
      return;
    }
    
    let phoneStr = String(personal.telefone).replace(/\D/g, '');
    
    if (phoneStr.length <= 11 && !phoneStr.startsWith('55')) {
      phoneStr = `55${phoneStr}`;
    }
    
    const personalNome = personal.nome?.split(' ')[0] || 'Personal';
    const message = encodeURIComponent(`Olá ${personalNome}, gostaria de regularizar a minha assinatura para liberar meus treinos.`);
    
    window.open(`https://wa.me/${phoneStr}?text=${message}`, '_blank');
  };

  useEffect(() => {
    if (!id) return;
    
    async function init() {
      const { data: alunoData } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
      if (!alunoData) return;
      setAluno(alunoData);

      if (alunoData.personal_id) {
        const { data: pData } = await supabase.from('personais').select('*').eq('id', alunoData.personal_id).maybeSingle();
        setPersonal(pData);
      }

      const { data: conclusoes } = await supabase.from('conclusoes_treino').select('data_conclusao, treino_id').eq('aluno_id', id);
      
      if (conclusoes) {
        const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
        const treinosSemana = conclusoes.filter(c => c.data_conclusao >= inicioSemana);
        setDiasTreino(treinosSemana.map(d => parseISO(d.data_conclusao)));
      }

      const { data: todasFichas } = await supabase.from('fichas').select('*').eq('aluno_id', id).or('ativo.eq.true,ativo.is.null').order('ordem', { ascending: true }).order('nome_treino', { ascending: true });

      if (todasFichas && todasFichas.length > 0) {
        if (!conclusoes || conclusoes.length === 0) {
          setTreinoDoDia(todasFichas[0]);
        } else {
          const ultimaConclusao = conclusoes.sort((a, b) => new Date(b.data_conclusao).getTime() - new Date(a.data_conclusao).getTime())[0];
          const indexUltimo = todasFichas.findIndex(f => f.id === ultimaConclusao.treino_id);

          if (indexUltimo !== -1 && indexUltimo < todasFichas.length - 1) {
            setTreinoDoDia(todasFichas[indexUltimo + 1]);
          } else {
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

  if (loading) return <DetalheAlunoSkeleton />;

  return (
    <div style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pb-[env(safe-area-inset-bottom)] flex flex-col relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md md:max-w-2xl mx-auto flex flex-col pt-[max(env(safe-area-inset-top),1.5rem)] px-5 pb-32 space-y-6 relative z-10">

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
            <div className="flex flex-col truncate pr-2">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">Personal Trainer</span>
              <h1 className="font-black text-lg leading-none tracking-tight truncate">{personal?.nome || 'Personal'}</h1>
              <p className="text-[var(--primary)] text-[9px] font-black uppercase tracking-[0.2em] mt-1">CREF: {personal?.cref || 'N/A'}</p>
            </div>
          </div>
          
          {/* ━━━━━━━━━━ PILL UI DE CONTROLES (Ação Imediata) ━━━━━━━━━━ */}
          <div className="flex items-center bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-full shadow-sm p-1 shrink-0">
            <button 
              onClick={() => setIsLangModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-2.5 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-95"
            >
              <FaGlobe size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{lang.split('-')[0]}</span>
            </button>
            
            <div className="w-[1px] h-4 bg-[var(--border)] mx-0.5" />
            
            <button 
              onClick={() => setIsThemeModalOpen(true)} 
              className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-95"
            >
              {isDark ? <FaMoon size={14} /> : <FaSun size={14} />}
            </button>

            <div className="w-[1px] h-4 bg-[var(--border)] mx-0.5" />

            <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--primary)]/5 transition-all">
              <NotificationBell />
            </div>
          </div>
        </header>

        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
          <div className="bg-gradient-to-r from-blue-600 to-[var(--primary)] p-5 rounded-[1.5rem] border border-white/10 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-black text-sm text-white tracking-tight">Não perca nenhum treino! </h3>
                <p className="text-white/80 text-[11px] font-medium leading-relaxed mt-1">
                  Ative as notificações para receber os novos treinos e avisos do seu Personal diretamente no telemóvel.
                </p>
              </div>
              <button onClick={async () => { await NotificationService.registrarDispositivo(); router.refresh(); }} className="w-full py-2.5 bg-white text-[var(--primary)] rounded-xl font-black text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all shadow-md">
                Permitir Notificações
              </button>
            </div>
          </div>
        )}

        <div className="px-2 animate-in fade-in duration-700 delay-300 mt-2 mb-2">
           <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{getSaudacao()}, {aluno?.nome?.split(' ')[0] || 'Aluno'}! 👋</h3>
           <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
             {format(horaAtual, "EEEE, d 'de' MMMM", { locale: lang === 'pt-BR' ? ptBR : lang === 'pt-PT' ? pt : enUS })}
           </p>
        </div>

        {/* ━━━━━━━━━━ HERO BANNER INTELIGENTE: BLOQUEIO OU TREINO ━━━━━━━━━━ */}
        {isVencido ? (
          <section className="relative overflow-hidden bg-gradient-to-br from-red-600 to-rose-700 p-8 rounded-[2rem] shadow-[0_10px_30px_rgba(225,29,72,0.3)] border border-white/10 group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[50px] rounded-full transform translate-x-1/2 -translate-y-1/2" />
            <div className="relative z-10 flex items-center gap-4 mb-3">
               <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl shadow-inner shrink-0 border border-white/10"><FaExclamationTriangle className="text-white text-xl" /></div>
               <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">{t.lockedTitle}</h2>
            </div>
            <p className="relative z-10 text-white/90 text-[11px] sm:text-xs font-medium leading-relaxed mb-6">{t.lockedDesc}</p>
            <button onClick={handleWhatsAppRedirect} className="relative z-10 w-full py-4 bg-[#25D366] text-white rounded-2xl font-black text-[12px] uppercase tracking-widest transition-transform active:scale-[0.98] shadow-xl hover:shadow-2xl hover:brightness-110 flex items-center justify-center gap-2">
              <FaWhatsapp size={18} /> {t.regularize}
            </button>
          </section>
        ) : treinoDoDia ? (
          (() => {
            let nomeLimpoHero = treinoDoDia.nome_treino || '';
            const matchTreino = nomeLimpoHero.match(/(treino\s+[a-z0-9]+)/i);
            if (matchTreino) nomeLimpoHero = matchTreino[0].toUpperCase();
            else if (nomeLimpoHero.includes('-')) nomeLimpoHero = nomeLimpoHero.split('-').pop()?.trim() || nomeLimpoHero;

            return (
              <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2rem] shadow-[0_10px_30px_rgba(37,99,235,0.3)] border border-white/10 group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[50px] rounded-full transform translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10 flex justify-between items-start mb-8">
                  <div className="flex flex-col flex-1 pr-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">{t.today}</span>
                    <h2 className="text-3xl font-black tracking-tight text-white leading-tight break-words">{nomeLimpoHero}</h2>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md p-3.5 rounded-2xl shadow-inner shrink-0 border border-white/10"><FaDumbbell className="text-white text-xl" /></div>
                </div>
                <button onClick={() => router.push(`/aluno/${id}/treino/${treinoDoDia.id}`)} className="relative z-10 w-full py-4 bg-white text-[var(--primary)] rounded-2xl font-black text-[12px] uppercase tracking-widest transition-transform active:scale-[0.98] shadow-xl hover:shadow-2xl flex items-center justify-center gap-2">{t.start}</button>
              </section>
            );
          })()
        ) : (
          <div className="p-8 text-center bg-[var(--surface)] rounded-[2rem] border border-dashed border-[var(--border)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <p className="text-[var(--text-secondary)] text-sm font-bold">{t.none}</p>
          </div>
        )}

        <section className="bg-[var(--surface)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="flex justify-between items-center mb-5"><h2 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">{t.week}</h2></div>
          <div className="flex justify-between items-center">
            {diasSemana.map((dia, i) => {
              const treinou = diasTreino.some(d => isSameDay(d, dia));
              const hoje = isSameDay(dia, new Date());
              const localeObj = lang === 'pt-BR' ? ptBR : lang === 'pt-PT' ? pt : enUS;
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center font-black text-sm transition-all duration-300 ${treinou ? 'bg-blue-600 text-white shadow-sm' : hoje ? 'bg-[var(--surface-sec)] border-2 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--surface-sec)] text-[var(--text-secondary)]'}`}>
                    {treinou ? '✓' : format(dia, 'd')}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${hoje ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`}>{format(dia, 'EEEEE', { locale: localeObj })}</span>
                </div>
              );
            })}
          </div>
        </section>

        <button onClick={() => setCalendarioAberto(true)} className="w-full py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {t.historyBtn}
        </button>

        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <BotaoMenu 
            icon={isVencido ? <FaLock className="text-[var(--danger)]/50 group-hover:text-[var(--danger)] transition-colors" /> : <FaDumbbell />} 
            label={t.trainings} 
            onClick={() => {
              if (isVencido) {
                alert(t.lockedDesc);
              } else {
                router.push(`/aluno/${id}/treinos`);
              }
            }} 
          />
          <BotaoMenu icon={<FaChartLine />} label={t.progress} onClick={() => router.push(`/aluno/${id}/progresso`)} />
          <BotaoMenu icon={<FaCommentMedical />} label={t.feedback} onClick={() => router.push(`/aluno/${id}/feedback`)} />
          <BotaoMenu icon={<FaUserCircle />} label={'Perfil'} onClick={() => router.push(`/aluno/${id}/perfil`)} />
        </div>

        <div className="h-20 w-full shrink-0" aria-hidden="true" />
      </div>

      {calendarioAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[99999] flex items-center justify-center p-4 transition-opacity">
          <div style={themeStyles} className="bg-[var(--surface)] w-full max-w-sm p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-2xl transform transition-transform animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--primary)]">{t.historyTitle}</h2>
              <button onClick={() => setCalendarioAberto(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95"><span className="text-xl leading-none">&times;</span></button>
            </div>
            <CalendarioTreino diasTreinados={diasTreino} lang={lang} />
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━ MODAIS DE CONFIGURAÇÃO (Fundo Escuro) ━━━━━━━━━━ */}
      {(isLangModalOpen || isThemeModalOpen) && (
        <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-5">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => { setIsLangModalOpen(false); setIsThemeModalOpen(false); }} 
          />
          
          <div style={themeStyles} className="w-full max-w-sm bg-[var(--bg)] border border-[var(--border)] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            
            {/* ━━ CONTEÚDO: IDIOMAS ━━ */}
            {isLangModalOpen && (
              <>
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="font-black text-lg tracking-tight text-[var(--text-primary)]">
                    {t.selectLanguage}
                  </h3>
                  <button 
                    onClick={() => setIsLangModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors active:scale-95 border border-[var(--border)]"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {languages.map((language) => {
                    const isActive = lang === language.code;
                    return (
                      <button
                        key={language.code}
                        onClick={() => handleSelectLanguage(language.code)}
                        className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border transition-all active:scale-[0.98] ${
                          isActive 
                            ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' 
                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{language.flag}</span>
                          <span className={`font-bold text-sm ${isActive ? 'text-[var(--primary)]' : ''}`}>
                            {language.name}
                          </span>
                        </div>
                        {isActive && <FaCheck className="text-[var(--primary)]" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ━━ CONTEÚDO: TEMA ━━ */}
            {isThemeModalOpen && (
              <>
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="font-black text-lg tracking-tight text-[var(--text-primary)]">
                    {t.selectTheme}
                  </h3>
                  <button 
                    onClick={() => setIsThemeModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors active:scale-95 border border-[var(--border)]"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleSelectTheme('light')}
                    className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border transition-all active:scale-[0.98] ${
                      !isDark 
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' 
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                        <FaSun size={16} />
                      </div>
                      <span className={`font-bold text-sm ${!isDark ? 'text-[var(--primary)]' : ''}`}>
                        {t.themeLight}
                      </span>
                    </div>
                    {!isDark && <FaCheck className="text-[var(--primary)]" />}
                  </button>
                  
                  <button
                    onClick={() => handleSelectTheme('dark')}
                    className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border transition-all active:scale-[0.98] ${
                      isDark 
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' 
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                        <FaMoon size={16} />
                      </div>
                      <span className={`font-bold text-sm ${isDark ? 'text-[var(--primary)]' : ''}`}>
                        {t.themeDark}
                      </span>
                    </div>
                    {isDark && <FaCheck className="text-[var(--primary)]" />}
                  </button>
                </div>
              </>
            )}
            
            <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mt-6 sm:hidden" />
          </div>
        </div>
      )}

    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE WRAPPER COM SUSPENSE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function AreaDoAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const bgTheme = mounted && localStorage.getItem('@premium_theme') === 'light' ? '#F3F6FB' : '#0F1115';

  return (
    <div style={{ backgroundColor: bgTheme }} className="min-h-screen transition-colors duration-500">
      <Suspense fallback={<DetalheAlunoSkeleton />}>
        <AreaDoAlunoContent id={use(params).id} />
      </Suspense>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTES AUXILIARES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function BotaoMenu({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all shadow-sm hover:shadow-[0_10px_30px_-15px_var(--primary)] hover:border-[var(--primary)]/50 group">
      <div className="text-2xl text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors group-hover:scale-110 duration-300">{icon}</div>
      <span className="font-bold text-[11px] uppercase tracking-widest text-[var(--text-primary)]">{label}</span>
    </button>
  );
}

function CalendarioTreino({ diasTreinados, lang }: { diasTreinados: Date[], lang: string }) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const diasDoMes = useMemo(() => eachDayOfInterval({ start: startOfMonth(dataAtual), end: endOfMonth(dataAtual) }), [dataAtual]);
  const localeObj = lang === 'pt-BR' ? ptBR : lang === 'pt-PT' ? pt : enUS;

  return (
    <div className="bg-[var(--surface-sec)] p-6 rounded-[1.5rem] border border-[var(--border)] shadow-inner">
      <div className="flex justify-between items-center mb-6 bg-[var(--surface)] p-2 rounded-full border border-[var(--border)]">
        <button onClick={() => setDataAtual(subMonths(dataAtual, 1))} className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-all"><FaChevronLeft size={12}/></button>
        <h3 className="font-black text-xs uppercase tracking-widest text-[var(--text-primary)]">{format(dataAtual, 'MMMM yyyy', { locale: localeObj })}</h3>
        <button onClick={() => setDataAtual(addMonths(dataAtual, 1))} className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-all"><FaChevronRight size={12}/></button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center mb-4 border-b border-[var(--border)] pb-4">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i} className="text-[10px] font-black text-[var(--text-secondary)] uppercase">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {diasDoMes.map((dia, i) => {
          const treinou = diasTreinados.some(d => isSameDay(d, dia));
          return (
            <div key={i} className={`w-9 h-9 sm:w-10 sm:h-10 mx-auto rounded-[12px] flex items-center justify-center text-xs font-bold transition-all relative ${treinou ? 'bg-[var(--primary)] text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]' : 'text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)]'} ${!isSameMonth(dia, dataAtual) ? 'opacity-20' : ''}`}>
              {format(dia, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}
