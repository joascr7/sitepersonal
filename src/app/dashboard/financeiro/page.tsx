'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  FaCheckCircle, FaExclamationCircle, FaGlobe, FaMoon, FaSun, 
  FaChevronLeft, FaTimes, FaCheck, FaChartBar, FaListUl, 
  FaUserClock, FaWhatsapp, FaPlus, FaEye, FaEyeSlash, FaDumbbell
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN PREMIUM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FinanceiroSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-8 animate-pulse pt-8 px-5">
    <div className="flex justify-between items-center mb-10">
      <div className="w-48 h-10 bg-[var(--surface-sec)] rounded-[1.2rem]" />
      <div className="w-24 h-10 bg-[var(--surface-sec)] rounded-[1.2rem]" />
    </div>
    <div className="flex gap-4 mb-6">
      <div className="w-24 h-10 bg-[var(--surface-sec)] rounded-full" />
      <div className="w-24 h-10 bg-[var(--surface-sec)] rounded-full" />
      <div className="w-24 h-10 bg-[var(--surface-sec)] rounded-full" />
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-48 border border-[var(--border)]" />
      <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-48 border border-[var(--border)]" />
    </div>
    <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-64 border border-[var(--border)]" />
  </div>
);

const translations = {
  'pt-BR': {
    title: 'Gestão Financeira', accumulated: 'Receita Anual', monthlyRevenue: 'Receita do Mês',
    pendingRevenue: 'A Receber (Atrasado)', activeStudents: 'Alunos Ativos',
    config: 'Configurações', monthlyFee: 'Mensalidade Padrão', pix: 'Chave PIX',
    manualPayment: 'Registrar Recebimento', selectStudent: 'Selecione o aluno...', valueLabel: 'Valor (R$)',
    transactions: 'Transações Recentes', student: 'Aluno', date: 'Data', value: 'Valor',
    noName: 'Sem nome', errMissing: 'Preencha todos os campos.', errProcess: 'Erro ao processar.', 
    successPay: 'Pagamento registrado com sucesso!', successConfig: 'Configurações atualizadas!',
    selectLanguage: 'Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro',
    tabOverview: 'Visão Geral', tabTransactions: 'Transações', tabPending: 'Pendências', tabAttendance: 'Frequência',
    graphTitle: 'Faturamento Anual', charge: 'Cobrar', lastSeen: 'Última atividade', daysAgo: 'dias atrás',
    noPending: 'Nenhum aluno inadimplente!', noAttendance: 'Nenhum dado de frequência.'
  },
  'pt-PT': {
    title: 'Gestão Financeira', accumulated: 'Receita Anual', monthlyRevenue: 'Receita do Mês',
    pendingRevenue: 'A Receber (Atrasado)', activeStudents: 'Alunos Ativos',
    config: 'Configurações', monthlyFee: 'Mensalidade Padrão', pix: 'Chave PIX',
    manualPayment: 'Registar Recebimento', selectStudent: 'Selecione o aluno...', valueLabel: 'Valor (€)',
    transactions: 'Transações Recentes', student: 'Aluno', date: 'Data', value: 'Valor',
    noName: 'Sem nome', errMissing: 'Preencha todos os campos.', errProcess: 'Erro ao processar.', 
    successPay: 'Pagamento registado com sucesso!', successConfig: 'Configurações atualizadas!',
    selectLanguage: 'Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro',
    tabOverview: 'Visão Geral', tabTransactions: 'Transações', tabPending: 'Pendências', tabAttendance: 'Frequência',
    graphTitle: 'Faturação Anual', charge: 'Cobrar', lastSeen: 'Última atividade', daysAgo: 'dias atrás',
    noPending: 'Nenhum aluno em incumprimento!', noAttendance: 'Nenhum dado de frequência.'
  },
  'en': {
    title: 'Financial Mgmt', accumulated: 'Yearly Revenue', monthlyRevenue: 'Monthly Revenue',
    pendingRevenue: 'Pending (Overdue)', activeStudents: 'Active Students',
    config: 'Settings', monthlyFee: 'Standard Fee', pix: 'PIX Key',
    manualPayment: 'Register Payment', selectStudent: 'Select student...', valueLabel: 'Value ($)',
    transactions: 'Recent Transactions', student: 'Student', date: 'Date', value: 'Value',
    noName: 'No name', errMissing: 'Fill in all fields.', errProcess: 'Error processing.', 
    successPay: 'Payment registered successfully!', successConfig: 'Settings updated!',
    selectLanguage: 'Language', selectTheme: 'Appearance', themeLight: 'Light Mode', themeDark: 'Dark Mode',
    tabOverview: 'Overview', tabTransactions: 'Transactions', tabPending: 'Pending', tabAttendance: 'Attendance',
    graphTitle: 'Yearly Revenue Chart', charge: 'Charge', lastSeen: 'Last seen', daysAgo: 'days ago',
    noPending: 'No pending payments!', noAttendance: 'No attendance data.'
  }
};

const getMeses = (lang: string) => {
  if (lang === 'en') return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
};

export default function FinanceiroSaaS() {
  const router = useRouter();
  
  // Dados do DB
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [listaAlunos, setListaAlunos] = useState<any[]>([]);
  const [configPersonal, setConfigPersonal] = useState({ valor_mensalidade_padrao: 0 });
  const [loading, setLoading] = useState(true);
  
  // UI & UX States
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'pending' | 'attendance'>('overview');
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [olhoAberto, setOlhoAberto] = useState(true);
  
  // Filtros
  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth());
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());

  // Form Pagamento Manual
  const [novoValor, setNovoValor] = useState('');
  const [alunoId, setAlunoId] = useState('');
  const [saving, setSaving] = useState(false);

  // Configurações e Tema
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    const updateSettings = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);
    };

    updateSettings();
    setMounted(true);
    fetchDados();

    window.addEventListener('storage', updateSettings);
    window.addEventListener('config-updated', updateSettings);

    return () => {
      window.removeEventListener('storage', updateSettings);
      window.removeEventListener('config-updated', updateSettings);
    };
  }, []);

  const t = translations[lang] || translations['pt-BR'];
  const showToast = (type: 'success' | 'error', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': 'rgba(21, 26, 34, 0.7)', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--warning': '#F59E0B', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.08)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': 'rgba(255, 255, 255, 0.8)', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--warning': '#D97706', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.08)',
  } as React.CSSProperties;

  const fetchDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Busca o valor padrão do personal, pagamentos e os dados dos alunos (agora incluindo valor_mensalidade individual)
    const [cRes, pRes, aRes] = await Promise.all([
      supabase.from('personais').select('valor_mensalidade').eq('id', user.id).single(),
      supabase.from('pagamentos').select('id, valor, data_pagamento, alunos(nome)').eq('personal_id', user.id).order('data_pagamento', { ascending: false }),
      supabase.from('alunos').select('id, nome, ativo, data_vencimento, telefone, status_pagamento, valor_mensalidade, data_ultimo_treino').eq('personal_id', user.id)
    ]);

    if (cRes.data) setConfigPersonal({ valor_mensalidade_padrao: cRes.data.valor_mensalidade || 0 });
    setPagamentos(pRes.data || []);
    setListaAlunos(aRes.data || []);
    setLoading(false);
  };

  const handleSelecionarAluno = (idSelecionado: string) => {
    setAlunoId(idSelecionado);
    if (!idSelecionado) {
      setNovoValor('');
      return;
    }
    // Procura o aluno selecionado
    const aluno = listaAlunos.find(a => a.id === idSelecionado);
    if (aluno) {
      // Se o aluno tiver um valor específico, puxa ele. Se não tiver, puxa o valor padrão do Personal.
      const valorParaCobrar = aluno.valor_mensalidade || configPersonal.valor_mensalidade_padrao;
      setNovoValor(valorParaCobrar ? valorParaCobrar.toString() : '');
    }
  };

  const registrarPagamentoManual = async () => {
    if (!alunoId || !novoValor) return showToast('error', t.errMissing);
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Calcula nova data de vencimento (Soma 1 mês)
    const alunoSelecionado = listaAlunos.find(a => a.id === alunoId);
    let novaDataVencimento = new Date();
    if (alunoSelecionado?.data_vencimento) {
      const dataAtual = new Date(alunoSelecionado.data_vencimento + 'T00:00:00');
      if (dataAtual > novaDataVencimento) novaDataVencimento = dataAtual;
    }
    novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 1);

    const [pgError, alError] = await Promise.all([
      supabase.from('pagamentos').insert([{
        aluno_id: alunoId, personal_id: user?.id, valor: Number(novoValor), data_pagamento: new Date().toISOString(), status: 'pago'
      }]),
      supabase.from('alunos').update({ 
        status_pagamento: 'ativo', ativo: true, data_vencimento: novaDataVencimento.toISOString().split('T')[0] 
      }).eq('id', alunoId)
    ]);

    if (!pgError.error && !alError.error) {
      setNovoValor(''); setAlunoId('');
      showToast('success', t.successPay);
      await fetchDados();
      setActiveTab('transactions');
    } else {
      showToast('error', t.errProcess);
    }
    setSaving(false);
  };

  // ━━━━━━━━━━━━━━━━ CÁLCULOS FINANCEIROS & GRÁFICO ━━━━━━━━━━━━━━━━
  const formatCurrency = (val: number) => new Intl.NumberFormat(lang, { style: 'currency', currency: lang === 'pt-PT' ? 'EUR' : lang === 'en' ? 'USD' : 'BRL' }).format(val);

  // Pagamentos do Mês
  const pagamentosMesFiltrado = useMemo(() => pagamentos.filter(p => {
    if (!p.data_pagamento) return false;
    const date = new Date(p.data_pagamento);
    return date.getMonth() === mesFiltro && date.getFullYear() === anoFiltro;
  }), [pagamentos, mesFiltro, anoFiltro]);

  const faturamentoMes = pagamentosMesFiltrado.reduce((acc, curr) => acc + Number(curr.valor), 0);
  
  // Faturamento do Ano Selecionado (para o Gráfico)
  const faturamentoAnual = useMemo(() => {
    const dadosAno = new Array(12).fill(0);
    pagamentos.forEach(p => {
      if (!p.data_pagamento) return;
      const d = new Date(p.data_pagamento);
      if (d.getFullYear() === anoFiltro) dadosAno[d.getMonth()] += Number(p.valor);
    });
    return dadosAno;
  }, [pagamentos, anoFiltro]);

  const totalAno = faturamentoAnual.reduce((acc, val) => acc + val, 0);
  const maxMes = Math.max(...faturamentoAnual, 1); 

  // ━━━━━━━━━━━━━━━━ INADIMPLENTES (CÁLCULO DINÂMICO) ━━━━━━━━━━━━━━━━
  const alunosInadimplentes = useMemo(() => listaAlunos.filter(a => {
    if (!a.data_vencimento) return false;
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const vencimento = new Date(a.data_vencimento + 'T00:00:00');
    return vencimento < hoje; 
  }).sort((a,b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()), [listaAlunos]);

  // Total a receber (Soma os valores INDIVIDUAIS de cada aluno)
  const valorAtrasado = alunosInadimplentes.reduce((total, aluno) => {
    // Tenta usar o valor específico do aluno. Se ele não tiver, usa o valor padrão do personal. Se nenhum existir, 0.
    const valorCobrado = aluno.valor_mensalidade || configPersonal.valor_mensalidade_padrao || 0;
    return total + Number(valorCobrado);
  }, 0); 

  const enviarCobrancaWhatsApp = (aluno: any) => {
    if(!aluno.telefone) return alert("Aluno sem telefone cadastrado.");
    const valorCobrado = aluno.valor_mensalidade || configPersonal.valor_mensalidade_padrao || 0;
    const msg = `Olá ${aluno.nome}, tudo bem? Notei que sua mensalidade no valor de ${formatCurrency(valorCobrado)} com vencimento em ${new Date(aluno.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')} está pendente. Qualquer dúvida estou à disposição!`;
    const num = aluno.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />
      
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {loading ? <FinanceiroSkeleton /> : (
        <div className="max-w-4xl mx-auto space-y-6 relative z-10 animate-in fade-in duration-700">
          
          {/* HEADER PREMIUM */}
          <header className="flex justify-between items-center mb-4 pt-2">
            <button onClick={() => router.back()} className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] active:scale-95 transition-all shadow-sm">
              <FaChevronLeft className="text-[var(--text-primary)]" size={14} />
            </button>
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-[var(--text-primary)]">{t.title}</h1>
            <div className="flex items-center bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-full shadow-sm p-1">
              <button onClick={() => setIsThemeModalOpen(true)} className="flex items-center justify-center w-10 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-95">
                {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>
            </div>
          </header>

          {/* MENU DE ABAS HORIZONTAL */}
          <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar snap-x">
            {[
              { id: 'overview', icon: <FaChartBar />, label: t.tabOverview },
              { id: 'transactions', icon: <FaListUl />, label: t.tabTransactions },
              { id: 'pending', icon: <FaExclamationCircle />, label: t.tabPending },
              { id: 'attendance', icon: <FaUserClock />, label: t.tabAttendance }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`snap-center shrink-0 flex items-center gap-2 px-5 py-3 rounded-[1.2rem] text-xs font-black uppercase tracking-wider transition-all border ${activeTab === tab.id ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary)]/20' : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-secondary)]/30'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ━━━━━━━━━━ ABA 1: VISÃO GERAL (Dashboard Visual) ━━━━━━━━━━ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Receita do Mês Selecionado */}
                <div className="bg-[var(--surface)] backdrop-blur-xl p-6 rounded-[2rem] border border-[var(--border)] shadow-sm relative overflow-hidden">
                  <button onClick={() => setOlhoAberto(!olhoAberto)} className="absolute top-4 right-4 text-[var(--text-secondary)]">
                    {olhoAberto ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                  </button>
                  <h2 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">{t.monthlyRevenue}</h2>
                  <p className="text-2xl font-black tracking-tighter text-[var(--primary)]">{olhoAberto ? formatCurrency(faturamentoMes) : '••••••'}</p>
                </div>

                {/* Pendentes (A Receber) - AGORA COM VALOR DINÂMICO! */}
                <div className="bg-[var(--danger)]/10 backdrop-blur-xl p-6 rounded-[2rem] border border-[var(--danger)]/20 shadow-sm relative overflow-hidden">
                  <h2 className="text-[9px] font-black text-[var(--danger)] uppercase tracking-[0.2em] mb-2">{t.pendingRevenue}</h2>
                  <p className="text-2xl font-black tracking-tighter text-[var(--danger)]">{olhoAberto ? formatCurrency(valorAtrasado) : '••••••'}</p>
                </div>
              </div>

              {/* Gráfico de Faturamento Anual */}
              <div className="bg-[var(--surface)] backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{t.graphTitle}</h2>
                  <input type="number" value={anoFiltro} onChange={e => setAnoFiltro(Number(e.target.value))} className="w-20 bg-[var(--surface-sec)] border border-[var(--border)] py-1.5 px-3 rounded-lg text-xs font-bold text-center outline-none focus:border-[var(--primary)]" />
                </div>
                
                <div className="flex items-end justify-between h-48 gap-1 sm:gap-2 pt-4">
                  {getMeses(lang).map((mes, index) => {
                    const valor = faturamentoAnual[index];
                    const percent = Math.max((valor / maxMes) * 100, 0);
                    return (
                      <div key={mes} className="flex flex-col items-center flex-1 group">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-8 bg-[var(--surface-sec)] text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-[var(--border)] pointer-events-none">
                          {formatCurrency(valor)}
                        </div>
                        <div className="w-full max-w-[2rem] bg-[var(--surface-sec)] rounded-t-lg flex items-end overflow-hidden transition-all duration-1000 group-hover:brightness-110" style={{ height: '100%' }}>
                          <div className={`w-full rounded-t-lg transition-all duration-1000 ease-out ${valor > 0 ? 'bg-gradient-to-t from-blue-700 to-[var(--primary)] shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}`} style={{ height: `${percent}%` }} />
                        </div>
                        <span className="text-[8px] sm:text-[10px] font-bold text-[var(--text-secondary)] mt-2 uppercase">{mes}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total {anoFiltro}</span>
                  <span className="text-sm font-black text-[var(--text-primary)]">{olhoAberto ? formatCurrency(totalAno) : '••••••'}</span>
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━ ABA 2: TRANSAÇÕES (Lançamentos e Histórico) ━━━━━━━━━━ */}
          {activeTab === 'transactions' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              
              {/* Formulário de Lançamento Rápido */}
              <div className="bg-[var(--surface)] backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
                <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4">{t.manualPayment}</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* SELECIONAR ALUNO */}
                  <select 
                    value={alunoId} 
                    onChange={(e) => handleSelecionarAluno(e.target.value)} 
                    className="flex-[2] min-w-[200px] p-4 bg-[var(--surface-sec)] rounded-[1.2rem] text-sm font-bold border border-[var(--border)] outline-none text-[var(--text-primary)] appearance-none cursor-pointer"
                  >
                    <option value="">{t.selectStudent}</option>
                    {listaAlunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                  
                  <div className="flex gap-3">
                    <input 
                      type="number" 
                      placeholder={t.valueLabel} 
                      value={novoValor} 
                      onChange={(e) => setNovoValor(e.target.value)} 
                      className="w-full sm:flex-1 p-4 bg-[var(--surface-sec)] rounded-[1.2rem] text-sm font-bold border border-[var(--border)] outline-none text-[var(--text-primary)]" 
                    />
                    <button onClick={registrarPagamentoManual} disabled={saving} className="bg-[var(--primary)] text-white px-8 rounded-[1.2rem] font-black hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[var(--primary)]/20 flex items-center justify-center">
                      <FaPlus />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabela do Mês */}
              <div className="bg-[var(--surface)] backdrop-blur-xl rounded-[2.5rem] border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-sec)]/50">
                  <h2 className="font-black text-sm tracking-tighter text-[var(--text-primary)]">{t.transactions}</h2>
                  <div className="flex gap-2">
                    <select value={mesFiltro} onChange={e => setMesFiltro(Number(e.target.value))} className="bg-[var(--surface)] border border-[var(--border)] p-2 rounded-lg text-xs font-bold">
                      {getMeses(lang).map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[350px] custom-scrollbar">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-[var(--border)]">
                      {pagamentosMesFiltrado.map((p) => (
                        <tr key={p.id} className="hover:bg-[var(--surface-sec)]/30 transition-colors">
                          <td className="p-4 font-bold text-sm text-[var(--text-primary)]">{p.alunos?.nome || t.noName}</td>
                          <td className="p-4 text-xs text-[var(--text-secondary)]">{p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString(lang) : '-'}</td>
                          <td className="p-4 text-right font-black text-sm text-[var(--success)]">{formatCurrency(Number(p.valor))}</td>
                        </tr>
                      ))}
                      {pagamentosMesFiltrado.length === 0 && (
                        <tr><td colSpan={3} className="p-8 text-center text-xs font-bold text-[var(--text-secondary)]">Nenhuma transação neste mês.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━ ABA 3: INADIMPLENTES ━━━━━━━━━━ */}
          {activeTab === 'pending' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
              {alunosInadimplentes.length === 0 ? (
                <div className="bg-[var(--success)]/10 border border-[var(--success)]/20 p-8 rounded-[2rem] text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-[var(--success)]/20 rounded-full flex items-center justify-center text-[var(--success)]">
                    <FaCheckCircle size={32} />
                  </div>
                  <h3 className="font-black text-lg text-[var(--success)]">{t.noPending}</h3>
                </div>
              ) : (
                alunosInadimplentes.map(aluno => {
                  const diasAtraso = Math.floor((new Date().getTime() - new Date(aluno.data_vencimento + 'T00:00:00').getTime()) / (1000 * 3600 * 24));
                  const valorCobrado = aluno.valor_mensalidade || configPersonal.valor_mensalidade_padrao || 0;
                  
                  return (
                    <div key={aluno.id} className="bg-[var(--surface)] p-5 rounded-[1.5rem] border border-[var(--danger)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-[var(--danger)]/60 transition-all">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[var(--text-primary)] text-sm">{aluno.nome}</span>
                          <span className="text-[10px] font-black text-[var(--text-secondary)]">({formatCurrency(valorCobrado)})</span>
                        </div>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-[var(--danger)]">
                            Venceu dia {new Date(aluno.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR').substring(0, 5)}
                          </span>
                          <span className="text-[10px] font-bold text-[var(--danger)] uppercase tracking-wider">
                            ({diasAtraso} dias atrasado)
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => enviarCobrancaWhatsApp(aluno)}
                          className="flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                        >
                          <FaWhatsapp size={16} /> {t.charge}
                        </button>
                        <button 
                          onClick={() => { handleSelecionarAluno(aluno.id); setActiveTab('transactions'); }}
                          className="bg-[var(--surface-sec)] text-[var(--text-primary)] border border-[var(--border)] px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:border-[var(--primary)] transition-all active:scale-95"
                        >
                          Baixar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ━━━━━━━━━━ ABA 4: FREQUÊNCIA ━━━━━━━━━━ */}
          {activeTab === 'attendance' && (
            <div className="bg-[var(--surface)] backdrop-blur-xl rounded-[2.5rem] border border-[var(--border)] shadow-sm overflow-hidden p-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="p-6">
                <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4">Controle de Engajamento</h2>
                <p className="text-xs text-[var(--text-secondary)] mb-6">Lista de alunos ativos. Acompanhe há quantos dias o aluno não registra um treino.</p>
                
                <div className="space-y-3">
                  {listaAlunos.filter(a => a.ativo).map(aluno => {
                    const temDados = aluno.data_ultimo_treino; 
                    return (
                      <div key={aluno.id} className="bg-[var(--surface-sec)] p-4 rounded-2xl flex items-center justify-between border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                            <FaDumbbell size={14} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[var(--text-primary)]">{aluno.nome}</p>
                            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
                              {temDados ? `Visto: ${new Date(aluno.data_ultimo_treino).toLocaleDateString()}` : 'Sem registros ainda'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => router.push(`/dashboard/aluno/${aluno.id}/progresso`)}
                          className="text-[10px] font-black uppercase bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1.5 rounded-lg hover:bg-[var(--primary)] hover:text-white transition-all"
                        >
                          Ver Perfil
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL DE TEMA */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsThemeModalOpen(false)} />
          <div style={themeStyles} className="w-full max-w-sm bg-[var(--bg)] border border-[var(--border)] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative z-10 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="font-black text-lg text-[var(--text-primary)]">{t.selectTheme}</h3>
              <button onClick={() => setIsThemeModalOpen(false)} className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)]"><FaTimes size={14} /></button>
            </div>
            <div className="space-y-2">
              <button onClick={() => {setIsDark(false); localStorage.setItem('@premium_theme','light'); window.dispatchEvent(new Event('config-updated')); setIsThemeModalOpen(false);}} className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border ${!isDark ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]'}`}>
                <div className="flex gap-4 items-center"><FaSun size={16} /> <span className="font-bold text-sm">Claro</span></div>
              </button>
              <button onClick={() => {setIsDark(true); localStorage.setItem('@premium_theme','dark'); window.dispatchEvent(new Event('config-updated')); setIsThemeModalOpen(false);}} className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border ${isDark ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]'}`}>
                <div className="flex gap-4 items-center"><FaMoon size={16} /> <span className="font-bold text-sm">Escuro</span></div>
              </button>
            </div>
            <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mt-6 sm:hidden" />
          </div>
        </div>
      )}

    </main>
  );
}
