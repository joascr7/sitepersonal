'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AgendaGeral from '@/components/AgendaGeral';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { NotificationBell } from '@/components/NotificationBell';
import BirthdaysWidget from '@/components/BirthdaysWidget';
import NotificationManager from '@/components/NotificationManager';
import ParqListPersonal from '@/components/ParqListPersonal';

import { 
  FaSearch, FaChartLine, FaEdit, FaUser, FaTimes, 
  FaCalendarAlt, FaCheckCircle, FaExclamationCircle, FaGlobe, 
  FaMoon, FaSun, FaUsers, FaCommentDots, FaUserPlus, 
  FaChevronRight, FaInfoCircle, FaDumbbell, FaBookOpen, FaListUl,
  FaPaperPlane, FaCheck
} from 'react-icons/fa';

interface PersonalData {
  status_pagamento: string;
  data_expiracao_teste: string;
  avatar_url?: string;
  nome?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DashboardSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-8 animate-pulse pt-8 px-5">
    <div className="h-40 bg-[#1C283F] rounded-b-[2rem] w-full absolute top-0 left-0" />
    <div className="relative z-10 pt-20">
      <div className="flex gap-4 mb-8">
        <div className="w-16 h-16 bg-slate-700 rounded-full" />
        <div className="w-40 h-8 bg-slate-700 rounded-xl" />
      </div>
      <div className="h-14 w-full bg-slate-200 rounded-xl mb-8" />
      <div className="flex justify-around mb-8">
        {[1,2,3].map(i => <div key={i} className="w-16 h-16 bg-slate-200 rounded-full" />)}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-24 bg-blue-200 rounded-xl" />
        <div className="h-24 bg-blue-200 rounded-xl" />
      </div>
      <div className="h-20 bg-slate-800 rounded-xl mb-8" />
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE TRADUÇÕES (i18n) APRIMORADO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    search: 'Buscar aluno...', statusBlocked: 'BLOQUEADO', statusActive: 'ATIVO', statusPending: 'PENDENTE', testPeriod: 'Você está no período de teste.', subscribe: 'Assinar Plano', renewal: 'Renovação próxima', confirmReativar: 'Confirmar reativação do acesso para ', confirmBloqueio: 'Confirmar bloqueio de acesso para ', errStatus: 'Erro ao alterar status.', successStatusReativado: 'Aluno reativado!', successStatusBloqueado: 'Acesso bloqueado!', errProcess: 'Falha ao processar: ', successPay: 'Pagamento registrado com sucesso!', confirmPagamento: 'Confirmar Pagamento', valorPlaceholder: 'Valor (R$)', registrarPagamento: 'Registrar Pagamento', report: 'Relatório por Mês',
    addStudents: 'Adicionar novo aluno', students: 'Meus Alunos', active: 'Ativos', inactive: 'Inativos', yourStudents: 'Gestão de Alunos', manageStudents: 'Gerenciar Alunos', workouts: 'Gestão de Treinos', libraryWorkouts: 'Biblioteca de treinos', libraryExercises: 'Biblioteca de exercícios',
    sendNotice: 'Enviar Aviso', noticeDesc: 'Notifique seus alunos rapidamente', parqTitle: 'Avaliações PAR-Q dos Alunos', notFound: 'Nenhum aluno encontrado.', prev: 'Anterior', next: 'Próxima', page: 'Página', of: 'de',
    greetingMorning: 'Bom dia', greetingAfternoon: 'Boa tarde', greetingEvening: 'Boa noite',
    tabHome: 'Início', tabFinance: 'Finanças', widgetFeedbacks: 'Feedbacks', widgetParq: 'PAR-Q', widgetNotices: 'Avisos',
    selectLanguage: 'Selecione o Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro'
  },
  'pt-PT': {
    search: 'Procurar aluno...', statusBlocked: 'BLOQUEADO', statusActive: 'ATIVO', statusPending: 'PENDENTE', testPeriod: 'Está no período de teste.', subscribe: 'Assinar Plano', renewal: 'Renovação próxima', confirmReativar: 'Confirmar reativação do acesso para ', confirmBloqueio: 'Confirmar bloqueio de acesso para ', errStatus: 'Erro ao alterar status.', successStatusReativado: 'Aluno reativado!', successStatusBloqueado: 'Acesso bloqueado!', errProcess: 'Falha ao processar: ', successPay: 'Pagamento registado com sucesso!', confirmPagamento: 'Confirmar Pagamento', valorPlaceholder: 'Valor', registrarPagamento: 'Registar Pagamento', report: 'Relatório por Mês',
    addStudents: 'Adicionar novo aluno', students: 'Meus Alunos', active: 'Ativos', inactive: 'Inativos', yourStudents: 'Gestão de Alunos', manageStudents: 'Gerir Alunos', workouts: 'Gestão de Treinos', libraryWorkouts: 'Biblioteca de treinos', libraryExercises: 'Biblioteca de exercícios',
    sendNotice: 'Enviar Aviso', noticeDesc: 'Notifique os seus alunos rapidamente', parqTitle: 'Avaliações PAR-Q dos Alunos', notFound: 'Nenhum aluno encontrado.', prev: 'Anterior', next: 'Seguinte', page: 'Página', of: 'de',
    greetingMorning: 'Bom dia', greetingAfternoon: 'Boa tarde', greetingEvening: 'Boa noite',
    tabHome: 'Início', tabFinance: 'Finanças', widgetFeedbacks: 'Feedbacks', widgetParq: 'PAR-Q', widgetNotices: 'Avisos',
    selectLanguage: 'Selecione o Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro'
  },
  'en': {
    search: 'Search student...', statusBlocked: 'BLOCKED', statusActive: 'ACTIVE', statusPending: 'PENDING', testPeriod: 'You are in the trial period.', subscribe: 'Subscribe', renewal: 'Upcoming renewal', confirmReativar: 'Confirm access reactivation for ', confirmBloqueio: 'Confirm access blocking for ', errStatus: 'Error changing status.', successStatusReativado: 'Student reactivated!', successStatusBloqueado: 'Access blocked!', errProcess: 'Failed to process: ', successPay: 'Payment registered successfully!', confirmPagamento: 'Confirm Payment', valorPlaceholder: 'Value', registrarPagamento: 'Register Payment', report: 'Monthly Report',
    addStudents: 'Add new student', students: 'My Students', active: 'Active', inactive: 'Inactive', yourStudents: 'Student Management', manageStudents: 'Manage Students', workouts: 'Workout Management', libraryWorkouts: 'Workout Library', libraryExercises: 'Exercise Library',
    sendNotice: 'Send Notice', noticeDesc: 'Notify your students quickly', parqTitle: 'Student PAR-Q Assessments', notFound: 'No students found.', prev: 'Previous', next: 'Next', page: 'Page', of: 'of',
    greetingMorning: 'Good Morning', greetingAfternoon: 'Good Afternoon', greetingEvening: 'Good Evening',
    tabHome: 'Home', tabFinance: 'Finances', widgetFeedbacks: 'Feedbacks', widgetParq: 'PAR-Q', widgetNotices: 'Notices',
    selectLanguage: 'Select Language', selectTheme: 'Appearance', themeLight: 'Light Mode', themeDark: 'Dark Mode'
  }
};

const languages = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

const ITEMS_PER_PAGE = 5;

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [totalMes, setTotalMes] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [valorPago, setValorPago] = useState('');
  
  const [personalInfo, setPersonalInfo] = useState<PersonalData | null>(null);
  const [statusAcesso, setStatusAcesso] = useState({ emTeste: false, status: '' });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'inicio' | 'financas'>('inicio');
  const [isParqModalOpen, setIsParqModalOpen] = useState(false);

  // Estados do Modal de Alunos e Paginação
  const [isAlunosModalOpen, setIsAlunosModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estado para expansão das Notificações
  const [isNotificacaoExpanded, setIsNotificacaoExpanded] = useState(false);

  // Estados dos Modais Premium (Tema/Idioma)
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--primary-soft': '#60A5FA', '--danger': '#EF4444', '--success': '#22C55E', '--warning': '#F59E0B', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--primary-soft': '#60A5FA', '--danger': '#DC2626', '--success': '#16A34A', '--warning': '#D97706', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  useEffect(() => {
    const updateSettings = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);
    };

    updateSettings();
    setMounted(true);

    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    
    window.addEventListener('storage', updateSettings);
    window.addEventListener('config-updated', updateSettings);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', updateSettings);
      window.removeEventListener('config-updated', updateSettings);
    };
  }, []);

  const t = translations[lang] || translations['pt-BR'];

  const getSaudacao = () => {
    const hora = horaAtual.getHours();
    if (hora < 12) return t.greetingMorning;
    if (hora < 18) return t.greetingAfternoon;
    return t.greetingEvening;
  };

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

  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const getStatusDisplay = (aluno: any) => {
    if (aluno.status_pagamento === 'bloqueado' || aluno.ativo === false) return { text: t.statusBlocked, color: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20 border' };
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = aluno.data_vencimento ? new Date(aluno.data_vencimento + 'T00:00:00') : null;
    if (vencimento) {
      const dataLimite = new Date(vencimento);
      dataLimite.setDate(dataLimite.getDate() + 2);
      if (hoje > vencimento && hoje <= dataLimite) return { text: t.statusPending, color: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20 border' };
    }
    return { text: t.statusActive, color: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20 border' };
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      const personalId = data.session.user.id;
      
      const { data: personal } = await supabase.from('personais').select('status_pagamento, data_expiracao_teste, avatar_url, nome').eq('id', personalId).single();

      if (personal) {
        setPersonalInfo(personal as PersonalData); 
        const hoje = new Date();
        const expira = new Date(personal.data_expiracao_teste);
        
        const expirou = personal.status_pagamento === 'teste' && hoje > expira;
        const estaEmTeste = hoje <= expira && personal.status_pagamento !== 'pago';
        
        if (expirou) {
          router.push('/acesso-personal'); 
          return;
        }
        
        setStatusAcesso({ emTeste: estaEmTeste, status: personal.status_pagamento });
      }
      
      setUser(data.session.user);
      
      await Promise.all([
        fetchAlunos(personalId),
        fetchFinanceiro(personalId)
      ]);
      
      setLoading(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (user?.id) {
      const fetchFat = async () => {
        const inicio = new Date(anoSelecionado, mesSelecionado, 1).toISOString();
        const fim = new Date(anoSelecionado, mesSelecionado + 1, 0, 23, 59, 59).toISOString();
        const { data } = await supabase.from('pagamentos').select('valor').eq('personal_id', user.id).gte('data_pagamento', inicio).lte('data_pagamento', fim);
        setFaturamentoMes(data ? data.reduce((acc, curr) => acc + Number(curr.valor), 0) : 0);
      };
      fetchFat();
    }
  }, [user, mesSelecionado, anoSelecionado]);

  const fetchAlunos = async (pId: string) => {
    const { data } = await supabase.from('alunos').select('*').eq('personal_id', pId).order('nome');
    if (data) setAlunos(data);
  };

  const fetchFinanceiro = async (pId: string) => {
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data } = await supabase.from('pagamentos').select('valor').eq('personal_id', pId).gte('data_pagamento', inicioMes);
    if (data) setTotalMes(data.reduce((acc, curr) => acc + Number(curr.valor), 0));
  };

  const toggleStatus = async (aluno: any) => {
    const novoStatus = !aluno.ativo; 
    const confirmMsg = novoStatus ? `${t.confirmReativar}${aluno.nome}?` : `${t.confirmBloqueio}${aluno.nome}?`;
    if (!confirm(confirmMsg)) return;
    
    const { error } = await supabase.from('alunos').update({ ativo: novoStatus }).eq('id', aluno.id);
      
    if (error) {
      showStatus('error', t.errStatus);
    } else {
      showStatus('success', novoStatus ? t.successStatusReativado : t.successStatusBloqueado);
      if (user?.id) fetchAlunos(user.id);
    }
  };

  const calcularNovoVencimento = (dataAtual: string) => {
    const data = new Date(dataAtual + 'T00:00:00');
    data.setMonth(data.getMonth() + 1);
    return data.toISOString().split('T')[0];
  };

  const processarPagamento = async () => {
    if (!alunoSelecionado || !valorPago || !user?.id) return;
    try {
      const { error: pgError } = await supabase.from('pagamentos').insert([{ 
        aluno_id: alunoSelecionado.id, valor: parseFloat(valorPago), personal_id: user.id, data_pagamento: new Date().toISOString()
      }]);
      if (pgError) throw pgError;

      const novaData = calcularNovoVencimento(alunoSelecionado.data_vencimento);
      const { error: alError } = await supabase.from('alunos').update({ status_pagamento: 'ativo', data_vencimento: novaData }).eq('id', alunoSelecionado.id);
      if (alError) throw alError;

      setIsModalOpen(false); setValorPago(''); 
      await Promise.all([fetchAlunos(user.id), fetchFinanceiro(user.id)]);
      showStatus('success', t.successPay);
    } catch (err: any) {
      showStatus('error', t.errProcess + err.message);
    }
  };

  const alunosFiltrados = useMemo(() => alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase())), [alunos, busca]);
  const alunosVencendo = alunos.filter(a => {
    if (!a.data_vencimento) return false;
    const hoje = new Date();
    const vencimento = new Date(a.data_vencimento + 'T00:00:00');
    const limite = new Date(vencimento);
    limite.setDate(limite.getDate() + 2);
    return hoje >= vencimento && hoje <= limite;
  });

  const alunosAtivosCount = alunos.filter(a => a.ativo).length;
  const alunosInativosCount = alunos.length - alunosAtivosCount;

  // Lógica de Paginação dos Alunos
  const totalPages = Math.ceil(alunosFiltrados.length / ITEMS_PER_PAGE);
  const paginatedAlunos = alunosFiltrados.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const avatarUrlRender = personalInfo?.avatar_url || user?.user_metadata?.avatar_url;
  const nomeDisplay = personalInfo?.nome || user?.user_metadata?.nome || 'Personal';

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <SubscriptionGuard>
      <div style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans pb-[env(safe-area-inset-bottom)] relative overflow-hidden">
        
        {/* Toast Notificações Flutuante */}
        {statusMsg && (
          <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${
            statusMsg.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 
            statusMsg.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' : 
            'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'
          }`}>
            {statusMsg.type === 'success' ? <FaCheckCircle size={16} /> : statusMsg.type === 'error' ? <FaExclamationCircle size={16} /> : <FaInfoCircle size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{statusMsg.text}</span>
          </div>
        )}

        {/* ━━━━━━━━━━ CONTROLES UNIFICADOS FLUTUANTES (PILL UI) ━━━━━━━━━━ */}
        <div className="absolute top-[max(env(safe-area-inset-top,1rem),1.5rem)] right-5 z-40 animate-in fade-in duration-700">
          <div className="flex items-center bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-full shadow-sm p-1">
            <button 
              onClick={() => setIsLangModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 transition-all active:scale-95"
            >
              <FaGlobe size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{lang.split('-')[0]}</span>
            </button>
            
            <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />
            
            <button 
              onClick={() => setIsThemeModalOpen(true)} 
              className="flex items-center justify-center w-10 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 transition-all active:scale-95"
            >
              {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>

            <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

            <div className="flex items-center justify-center w-10 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 transition-all cursor-pointer">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Modal de Pagamento */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[300] flex items-center justify-center p-5 animate-in fade-in duration-300">
            <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] w-full max-w-sm border border-[var(--border)] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg tracking-tighter">{t.registrarPagamento}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors p-2"><FaTimes size={18} /></button>
              </div>
              <input type="number" value={valorPago} onChange={(e) => setValorPago(e.target.value)} placeholder={t.valorPlaceholder} className="w-full p-4 bg-[var(--surface-sec)] rounded-[1.2rem] font-bold border border-[var(--border)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all mb-6 placeholder:text-[var(--text-secondary)] text-[var(--text-primary)]" />
              <button onClick={processarPagamento} className="w-full py-4 bg-[var(--primary)] text-white rounded-[1.2rem] font-black uppercase text-[11px] tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[var(--primary)]/20">{t.confirmPagamento}</button>
            </div>
          </div>
        )}

        {/* Modal ParQ */}
        {isParqModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[400] flex items-center justify-center p-5 animate-in fade-in duration-300">
            <div className="bg-[var(--surface)] p-6 rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-[var(--border)] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg tracking-tighter">{t.parqTitle}</h3>
                <button onClick={() => setIsParqModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors p-2 bg-[var(--surface-sec)] rounded-full">
                  <FaTimes size={16} />
                </button>
              </div>
              <ParqListPersonal personalId={user?.id} />
            </div>
          </div>
        )}

        {/* Modal Livro: Lista de Alunos Paginada */}
        {isAlunosModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[400] flex items-center justify-center p-5 animate-in fade-in duration-300">
            <div className="bg-[var(--surface)] p-6 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col border border-[var(--border)] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 relative">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="font-black text-xl tracking-tighter">{t.manageStudents}</h3>
                <button onClick={() => setIsAlunosModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors p-2 bg-[var(--surface-sec)] rounded-full">
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="relative group mb-6 shrink-0">
                <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={16} />
                <input 
                  className="w-full bg-[var(--surface-sec)] p-4 pl-12 rounded-[1.2rem] border border-[var(--border)] shadow-sm outline-none text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)] transition-all" 
                  placeholder={t.search} 
                  value={busca} 
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setCurrentPage(1); 
                  }} 
                />
              </div>

              <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2 pb-2">
                {paginatedAlunos.map((a) => {
                  const statusDisplay = getStatusDisplay(a);
                  return (
                    <div key={a.id} className="bg-[var(--surface-sec)] p-5 rounded-[1.5rem] border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between shadow-sm hover:border-[#3B82F6]/50 transition-all gap-5">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="shrink-0 w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center font-black text-lg text-[var(--text-secondary)] border border-[var(--border)] overflow-hidden">
                          {a.avatar_url ? <img src={a.avatar_url} className="w-full h-full object-cover" alt={a.nome} /> : a.nome.charAt(0)}
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3 className="font-black text-[var(--text-primary)] text-sm tracking-tight">{a.nome}</h3>
                          <span className={`self-start text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${statusDisplay.color}`}>
                            {statusDisplay.text}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 sm:flex gap-2 w-full sm:w-auto">
                        <button onClick={() => toggleStatus(a)} className={`flex items-center justify-center p-3.5 rounded-xl transition-all active:scale-95 border ${a.ativo ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`} title="Alterar Status">
                          {a.ativo ? <FaTimes size={14} /> : <FaUser size={14} />} 
                        </button>
                        <button onClick={() => router.push(`/dashboard/editar-aluno/${a.id}`)} className="flex items-center justify-center bg-[var(--surface)] p-3.5 rounded-xl text-[var(--text-secondary)] hover:text-[#3B82F6] border border-[var(--border)] transition-all active:scale-95" title="Editar">
                          <FaEdit size={14} />
                        </button>
                        <button onClick={() => router.push(`/dashboard/aluno/${a.id}`)} className="flex items-center justify-center bg-[var(--surface)] p-3.5 rounded-xl text-[var(--text-secondary)] hover:text-[#3B82F6] border border-[var(--border)] transition-all active:scale-95" title="Perfil">
                          <FaUser size={14} />
                        </button>
                        <button onClick={() => router.push(`/dashboard/aluno/${a.id}/progresso`)} className="flex items-center justify-center bg-[#3B82F6] text-white p-3.5 rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all" title="Progresso">
                          <FaChartLine size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {paginatedAlunos.length === 0 && (
                  <p className="text-center text-sm font-bold text-[var(--text-secondary)] py-8">{t.notFound}</p>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 shrink-0 pt-4 border-t border-[var(--border)]">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-2.5 bg-[var(--surface-sec)] text-[var(--text-primary)] rounded-xl font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--border)] border border-transparent hover:border-[var(--border)] transition-all active:scale-95"
                  >
                    {t.prev}
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                    {t.page} {currentPage} {t.of} {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-5 py-2.5 bg-[var(--surface-sec)] text-[var(--text-primary)] rounded-xl font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--border)] border border-transparent hover:border-[var(--border)] transition-all active:scale-95"
                  >
                    {t.next}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? <DashboardSkeleton /> : (
          <div className="max-w-4xl mx-auto flex flex-col pt-[max(env(safe-area-inset-top),2rem)]">
            
            <header className="px-5 relative z-10 mb-8">
              <div className="flex items-center gap-2 text-2xl font-black tracking-widest text-[var(--text-primary)] mb-6 opacity-90">
                <FaDumbbell className="text-[var(--primary)]" />
                AURAFIT<span className="font-light">PERSONAL</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-[var(--border)] bg-[var(--surface-sec)] flex items-center justify-center font-black text-xl overflow-hidden shrink-0 shadow-lg">
                  {avatarUrlRender && !avatarError ? (
                    <img 
                      src={avatarUrlRender} 
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span className="text-[var(--text-secondary)]">{nomeDisplay.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-widest opacity-80">
                    {getSaudacao()},
                  </span>
                  <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                    {nomeDisplay}
                  </span>
                </div>
              </div>
            </header>

            {/* ABAS PREMIUM */}
            <div className="px-5 relative z-10 mb-6">
              <div className="flex bg-[var(--surface-sec)] p-1.5 rounded-[1.2rem] shadow-inner border border-[var(--border)] backdrop-blur-md">
                <button 
                  onClick={() => setActiveTab('inicio')} 
                  className={`flex-1 py-3 text-[13px] font-black rounded-xl transition-all duration-300 ${activeTab === 'inicio' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {t.tabHome}
                </button>
                <button 
                  onClick={() => setActiveTab('financas')} 
                  className={`flex-1 py-3 text-[13px] font-black rounded-xl transition-all duration-300 ${activeTab === 'financas' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {t.tabFinance}
                </button>
              </div>
            </div>

            {activeTab === 'inicio' && (
              <div className="px-5 space-y-8 animate-in fade-in duration-500">
                
                {/* WIDGETS DE AÇÃO */}
                <div className="flex justify-around items-end bg-[var(--surface)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm">
                  <div onClick={() => router.push('/dashboard/feedbacks')} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-14 h-14 bg-[var(--surface-sec)] text-[var(--primary)] rounded-full shadow-inner border border-[var(--border)] flex items-center justify-center text-xl group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                      <FaCommentDots />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{t.widgetFeedbacks}</span>
                  </div>
                  
                  <div onClick={() => setIsParqModalOpen(true)} className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="relative">
                      <div className="w-14 h-14 bg-[var(--surface-sec)] text-[var(--primary)] rounded-full shadow-inner border border-[var(--border)] flex items-center justify-center text-xl group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                        <FaCalendarAlt />
                      </div>
                      {alunosVencendo.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[var(--danger)] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-[var(--bg)] shadow-sm">
                          {alunosVencendo.length}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{t.widgetParq}</span>
                  </div>
                  
                  {/* Ocultado NotificationBell duplicado */}
                </div>

                {/* GESTÃO DE TREINOS */}
                <section>
                  <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4 ml-1">{t.workouts}</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button 
                      onClick={() => router.push('/dashboard/BibliotecaTreinos')} 
                      className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:border-[var(--primary)]/50 hover:shadow-md transition-all active:scale-95 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                        <FaBookOpen size={18} />
                      </div>
                      <span className="font-bold text-[12px] text-left text-[var(--text-primary)] leading-tight">{t.libraryWorkouts}</span>
                    </button>
                    
                    <button 
                      onClick={() => router.push('/dashboard/BibliotecaTreinos?aba=exercicios')} 
                      className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:border-[var(--primary)]/50 hover:shadow-md transition-all active:scale-95 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                        <FaListUl size={18} />
                      </div>
                      <span className="font-bold text-[12px] text-left text-[var(--text-primary)] leading-tight">{t.libraryExercises}</span>
                    </button>
                  </div>
                </section>

                {/* GESTÃO DE ALUNOS */}
                <section>
                  <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4 ml-1">{t.yourStudents}</h3>
                  
                  <BirthdaysWidget alunos={alunos} />

                  <button 
                    onClick={() => { setIsAlunosModalOpen(true); setCurrentPage(1); }} 
                    className="w-full bg-gradient-to-br from-[var(--primary)] to-indigo-700 text-white p-6 rounded-[1.5rem] shadow-lg shadow-[var(--primary)]/20 flex justify-between items-center mb-3 hover:shadow-[var(--primary)]/40 active:scale-[0.98] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <FaUsers size={22} className="text-white" />
                      </div>
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-black text-lg tracking-tight">{t.students}</span>
                        <div className="flex gap-2">
                          <span className="bg-white/20 border border-white/10 text-white text-[9px] px-2 py-0.5 rounded-md uppercase tracking-widest font-black flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> {t.active}: {alunosAtivosCount}
                          </span>
                          {alunosInativosCount > 0 && (
                            <span className="bg-black/20 border border-black/10 text-white/90 text-[9px] px-2 py-0.5 rounded-md uppercase tracking-widest font-black flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> {t.inactive}: {alunosInativosCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <FaChevronRight className="opacity-50 group-hover:opacity-100 transition-opacity" size={18} />
                  </button>

                  <button 
                    onClick={() => router.push('/dashboard/adicionar-aluno')} 
                    className="w-full bg-[var(--surface)] border border-dashed border-[var(--border)] p-4 rounded-[1.2rem] flex items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-all font-bold text-xs uppercase tracking-widest active:scale-95 shadow-sm mb-6"
                  >
                    <FaUserPlus size={16} />
                    {t.addStudents}
                  </button>
                  
                  {/* ACCORDION DE NOTIFICAÇÕES */}
                  <div className="mt-8 mb-6">
                    <button
                      onClick={() => setIsNotificacaoExpanded(!isNotificacaoExpanded)}
                      className={`w-full bg-[var(--surface)] border p-5 rounded-[1.2rem] flex items-center justify-between shadow-sm transition-all active:scale-[0.98] group ${isNotificacaoExpanded ? 'border-[var(--primary)]/50 bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--primary)]/30'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isNotificacaoExpanded ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--surface-sec)] text-[var(--primary)] group-hover:bg-[var(--primary)]/10'}`}>
                          <FaPaperPlane size={14} />
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-black text-[13px] text-[var(--text-primary)] tracking-tight">{t.sendNotice}</span>
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] tracking-wider uppercase">{t.noticeDesc}</span>
                        </div>
                      </div>
                      <FaChevronRight className={`text-[var(--text-secondary)] transition-transform duration-300 ${isNotificacaoExpanded ? 'rotate-90 text-[var(--primary)]' : ''}`} size={14} />
                    </button>

                    <div className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out ${isNotificacaoExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                      <div className="overflow-hidden">
                        <div className="bg-[var(--surface-sec)] p-2 rounded-[1.5rem] border border-[var(--border)] shadow-inner">
                          <NotificationManager personalId={user?.id} alunos={alunos} showStatus={showStatus} />
                        </div>
                      </div>
                    </div>
                  </div>

                </section>
              </div>
            )}

            {activeTab === 'financas' && (
              <div className="px-5 mt-8 space-y-6 animate-in fade-in duration-500">
                <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
                  <div className="flex items-center gap-2 mb-6 text-[var(--text-secondary)]">
                    <FaCalendarAlt size={14} /> 
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">{t.report}</h2>
                  </div>
                  <div className="flex gap-3 mb-6">
                    <select className="w-full appearance-none bg-[var(--surface-sec)] p-4 rounded-[1.2rem] text-xs font-bold outline-none text-[var(--text-primary)] focus:border-[#3B82F6] border border-[var(--border)]" value={mesSelecionado} onChange={(e) => setMesSelecionado(Number(e.target.value))}>
                      {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                        <option key={i} value={i} className="bg-[var(--surface)]">{m}</option>
                      ))}
                    </select>
                    <input type="number" className="w-28 bg-[var(--surface-sec)] p-4 rounded-[1.2rem] text-xs font-bold text-center outline-none text-[var(--text-primary)] focus:border-[#3B82F6] border border-[var(--border)]" value={anoSelecionado} onChange={(e) => setAnoSelecionado(Number(e.target.value))} />
                  </div>
                  <p className="text-4xl font-black text-[#3B82F6] tracking-tight">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoMes)}
                  </p>
                </div>

                <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm overflow-hidden">
                   <AgendaGeral />
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>

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
                    className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors active:scale-95"
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
                    className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors active:scale-95"
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

    </SubscriptionGuard>
  );
}
