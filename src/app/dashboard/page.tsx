'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AgendaGeral from '@/components/AgendaGeral';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { 
  FaWallet, FaExclamationTriangle, FaSearch, FaPlus, FaChartLine, 
  FaEdit, FaUser, FaTimes, FaCalendarAlt, FaCheckCircle, 
  FaExclamationCircle, FaGlobe, FaMoon, FaSun 
} from 'react-icons/fa';

interface PersonalData {
  status_pagamento: string;
  data_expiracao_teste: string;
}

// 1. Função auxiliar para buscar faturamento histórico
const fetchFaturamentoPorMes = async (supabaseClient: any, personalId: string, mes: number, ano: number) => {
  const inicio = new Date(ano, mes, 1).toISOString();
  const fim = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString();
  
  const { data, error } = await supabaseClient
    .from('pagamentos')
    .select('valor')
    .eq('personal_id', personalId)
    .gte('data_pagamento', inicio)
    .lte('data_pagamento', fim);
    
  if (error || !data) return 0;
  return data.reduce((acc: number, curr: any) => acc + Number(curr.valor), 0);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN (UX PREMIUM)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-8 animate-pulse pt-8">
    <div className="flex justify-between items-end">
      <div className="space-y-2"><div className="h-10 w-48 bg-[var(--surface-sec)] rounded-2xl" /><div className="h-4 w-32 bg-[var(--surface-sec)] rounded-xl" /></div>
      <div className="h-14 w-14 bg-[var(--surface-sec)] rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-40 bg-[var(--surface-sec)] rounded-[2.5rem]" />
      <div className="md:col-span-2 h-40 bg-[var(--surface-sec)] rounded-[2.5rem]" />
    </div>
    <div className="h-20 bg-[var(--surface-sec)] rounded-[2.5rem]" />
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--surface-sec)] rounded-[2.5rem]" />)}
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Dashboard', subtitle: 'Gestão de Alta Performance', revenue: 'Mês Atual', report: 'Relatório por Mês', search: 'Buscar aluno...', statusBlocked: 'BLOQUEADO', statusActive: 'ATIVO', statusPending: 'PENDENTE', testPeriod: 'Você está no período de teste.', subscribe: 'Assinar Plano', renewal: 'Renovação próxima', confirmReativar: 'Confirmar reativação do acesso para ', confirmBloqueio: 'Confirmar bloqueio de acesso para ', errStatus: 'Erro ao alterar status.', successStatusReativado: 'Aluno reativado!', successStatusBloqueado: 'Acesso bloqueado!', errProcess: 'Falha ao processar: ', successPay: 'Pagamento registrado com sucesso!', confirmPagamento: 'Confirmar Pagamento', valorPlaceholder: 'Valor (R$)', registrarPagamento: 'Registrar Pagamento'
  },
  'pt-PT': {
    title: 'Dashboard', subtitle: 'Gestão de Alta Performance', revenue: 'Mês Atual', report: 'Relatório por Mês', search: 'Procurar aluno...', statusBlocked: 'BLOQUEADO', statusActive: 'ATIVO', statusPending: 'PENDENTE', testPeriod: 'Está no período de teste.', subscribe: 'Assinar Plano', renewal: 'Renovação próxima', confirmReativar: 'Confirmar reativação do acesso para ', confirmBloqueio: 'Confirmar bloqueio de acesso para ', errStatus: 'Erro ao alterar status.', successStatusReativado: 'Aluno reativado!', successStatusBloqueado: 'Acesso bloqueado!', errProcess: 'Falha ao processar: ', successPay: 'Pagamento registado com sucesso!', confirmPagamento: 'Confirmar Pagamento', valorPlaceholder: 'Valor', registrarPagamento: 'Registar Pagamento'
  },
  'en': {
    title: 'Dashboard', subtitle: 'High Performance Management', revenue: 'Current Month', report: 'Monthly Report', search: 'Search student...', statusBlocked: 'BLOCKED', statusActive: 'ACTIVE', statusPending: 'PENDING', testPeriod: 'You are in the trial period.', subscribe: 'Subscribe', renewal: 'Upcoming renewal', confirmReativar: 'Confirm access reactivation for ', confirmBloqueio: 'Confirm access blocking for ', errStatus: 'Error changing status.', successStatusReativado: 'Student reactivated!', successStatusBloqueado: 'Access blocked!', errProcess: 'Failed to process: ', successPay: 'Payment registered successfully!', confirmPagamento: 'Confirm Payment', valorPlaceholder: 'Value', registrarPagamento: 'Register Payment'
  }
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [totalMes, setTotalMes] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [valorPago, setValorPago] = useState('');
  
  // ━━━━━━━━━ CORREÇÃO DOS ESTADOS FALTANTES ━━━━━━━━━
  const [personalInfo, setPersonalInfo] = useState<PersonalData | null>(null);
  const [statusAcesso, setStatusAcesso] = useState({ emTeste: false, status: '' });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3000);
  };
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  
  // Estados UI Premium
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();

  // Configuração Dinâmica do Tema Premium
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--primary-soft': '#60A5FA', '--danger': '#EF4444', '--success': '#22C55E', '--warning': '#F59E0B', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--primary-soft': '#60A5FA', '--danger': '#DC2626', '--success': '#16A34A', '--warning': '#D97706', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    setMounted(true);
  }, []);

  const toggleTheme = () => { const newTheme = !isDark; setIsDark(newTheme); localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light'); window.dispatchEvent(new Event('storage')); };
  const toggleLang = () => { const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en']; const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length]; setLang(nextLang); localStorage.setItem('@premium_lang', nextLang); };
  
  const t = translations[lang] || translations['pt-BR'];

  const getStatusDisplay = (aluno: any) => {
    if (aluno.status_pagamento === 'bloqueado' || aluno.acesso_permitido === false) return { text: t.statusBlocked, color: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20 border' };
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
      const { data: personal } = await supabase.from('personais').select('status_pagamento, data_expiracao_teste').eq('id', personalId).single();

      if (personal) {
        setPersonalInfo(personal as PersonalData); 
        const hoje = new Date();
        const expira = new Date(personal.data_expiracao_teste);
        if (personal.status_pagamento === 'teste' && hoje > expira) {
          router.push('/acesso-personal'); 
          return;
        }
      }
      setUser(data.session.user);
      await fetchAlunos(personalId);
      await fetchFinanceiro(personalId);
      setLoading(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    const verificarAcesso = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: personal } = await supabase.from('personais').select('data_expiracao_teste, status_pagamento').eq('id', user.id).single();
      if (personal) {
        const hoje = new Date();
        const dataExpiracao = new Date(personal.data_expiracao_teste);
        const estaEmTeste = hoje <= dataExpiracao && personal.status_pagamento !== 'pago';
        setStatusAcesso({ emTeste: estaEmTeste, status: personal.status_pagamento });
      }
    };
    verificarAcesso();
  }, []);

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

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <SubscriptionGuard>
      <main style={themeStyles} className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+8rem)] px-5 transition-colors duration-500 font-sans">
        
        {/* Toast Flutuante Premium */}
        {statusMsg && (
          <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${statusMsg.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>
            {statusMsg.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{statusMsg.text}</span>
          </div>
        )}

        {/* Modal de Pagamento Premium */}
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

        {loading ? <DashboardSkeleton /> : (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pt-8">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black tracking-tighter">{t.title}</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mt-1">{t.subtitle}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={toggleLang} className="w-12 h-12 rounded-[1.2rem] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 shadow-sm relative">
                  <FaGlobe size={18} />
                  <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{lang.split('-')[0].toUpperCase()}</span>
                </button>
                <button onClick={toggleTheme} className="w-12 h-12 rounded-[1.2rem] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 shadow-sm">
                  {isDark ? <FaSun size={18} /> : <FaMoon size={18} />}
                </button>
                <button onClick={() => router.push('/dashboard/adicionar-aluno')} className="w-12 h-12 flex items-center justify-center bg-[var(--primary)] text-white rounded-[1.2rem] shadow-lg shadow-[var(--primary)]/20 hover:brightness-110 active:scale-95 transition-all">
                  <FaPlus size={18} />
                </button>
              </div>
            </header>

            {/* Aviso de Teste Grátis */}
            {statusAcesso.emTeste && (
              <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 p-6 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">{t.testPeriod}</p>
                <button onClick={() => router.push('/acesso-personal')} className="w-full sm:w-auto bg-[var(--primary)] text-white px-8 py-3.5 rounded-[1.2rem] text-[10px] font-black uppercase hover:brightness-110 active:scale-95 transition-all shadow-md">{t.subscribe}</button>
              </div>
            )}
              
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-6">
                {/* Card Mês Atual */}
                <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
                  <FaWallet className="text-[var(--primary)] mb-3 text-xl" />
                  <h2 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t.revenue}</h2>
                  <p className="text-2xl font-black text-[var(--text-primary)] mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMes)}
                  </p>
                </div>
                
                {/* Card Relatório por Mês */}
                <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)]">
                    <FaCalendarAlt size={14} /> 
                    <h2 className="text-[9px] font-black uppercase tracking-widest">{t.report}</h2>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative w-full">
                      <select 
                        className="w-full appearance-none bg-[var(--surface-sec)] p-4 rounded-[1.2rem] text-[11px] font-bold outline-none text-[var(--text-primary)] transition-all focus:border-[var(--primary)] border border-[var(--border)]" 
                        value={mesSelecionado} 
                        onChange={(e) => setMesSelecionado(Number(e.target.value))}
                      >
                        {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => (
                          <option key={i} value={i} className="bg-[var(--surface)] text-[var(--text-primary)]">{m}</option>
                        ))}
                      </select>
                    </div>
                    <input 
                      type="number" 
                      className="w-24 bg-[var(--surface-sec)] p-4 rounded-[1.2rem] text-[11px] font-bold text-center outline-none text-[var(--text-primary)] transition-all focus:border-[var(--primary)] border border-[var(--border)]" 
                      value={anoSelecionado} 
                      onChange={(e) => setAnoSelecionado(Number(e.target.value))} 
                    />
                  </div>
                  <p className="text-2xl font-black mt-4 text-[var(--primary)]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoMes)}
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm overflow-hidden">
                 <AgendaGeral />
              </div>
            </div>

            {alunosVencendo.length > 0 && (
              <div className="p-6 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-[var(--warning)]">
                  <FaExclamationTriangle size={16} /> 
                  <span className="font-black text-[10px] uppercase tracking-widest">{t.renewal}</span>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center">
                  {alunosVencendo.map(a => (
                    <button key={a.id} onClick={() => { setAlunoSelecionado(a); setIsModalOpen(true); }} className="bg-[var(--warning)] text-white px-5 py-2.5 rounded-[1rem] text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider shadow-sm">{a.nome}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative group">
              <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
              <input className="w-full bg-[var(--surface)] p-6 pl-14 rounded-[2rem] border border-[var(--border)] shadow-sm outline-none text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:font-medium focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all" placeholder={t.search} value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>

            <div className="space-y-4">
              {alunosFiltrados.map((a) => {
                const statusDisplay = getStatusDisplay(a);
                return (
                  <div key={a.id} className="bg-[var(--surface)] p-5 sm:p-6 rounded-[2.5rem] border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between shadow-sm hover:border-[var(--primary)]/30 transition-all gap-4">
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="shrink-0 w-14 h-14 rounded-full bg-[var(--surface-sec)] flex items-center justify-center font-black text-[var(--text-secondary)] border border-[var(--border)] overflow-hidden">
                        {a.avatar_url ? <img src={a.avatar_url} className="w-full h-full object-cover" alt={a.nome} /> : a.nome.charAt(0)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="font-black text-[var(--text-primary)] text-sm">{a.nome}</h3>
                        <span className={`self-start text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${statusDisplay.color}`}>
                          {statusDisplay.text}
                        </span>
                      </div>
                    </div>
                    
                    {/* OS 4 BOTÕES ORIGINAIS PRESERVADOS */}
                    <div className="flex gap-2 items-center w-full sm:w-auto justify-between sm:justify-end">
                      <button onClick={() => toggleStatus(a)} className={`flex-1 sm:flex-none flex items-center justify-center p-4 rounded-[1.2rem] transition-all active:scale-95 ${a.ativo ? 'bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20'}`} aria-label="Alterar Status">
                        {a.ativo ? <FaTimes size={16} /> : <FaUser size={16} />} 
                      </button>
                      <button onClick={() => router.push(`/dashboard/editar-aluno/${a.id}`)} className="flex-1 sm:flex-none flex items-center justify-center bg-[var(--surface-sec)] p-4 rounded-[1.2rem] text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-white transition-all active:scale-95" aria-label="Editar">
                        <FaEdit size={16} />
                      </button>
                      <button onClick={() => router.push(`/dashboard/aluno/${a.id}`)} className="flex-1 sm:flex-none flex items-center justify-center bg-[var(--surface-sec)] p-4 rounded-[1.2rem] text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-white transition-all active:scale-95" aria-label="Perfil">
                        <FaUser size={16} />
                      </button>
                      <button onClick={() => router.push(`/dashboard/aluno/${a.id}/progresso`)} className="flex-1 sm:flex-none flex items-center justify-center bg-[var(--primary)] text-white p-4 rounded-[1.2rem] shadow-md shadow-[var(--primary)]/20 hover:brightness-110 active:scale-95 transition-all" aria-label="Progresso">
                        <FaChartLine size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
        )}
      </main>
    </SubscriptionGuard>
  );
}
