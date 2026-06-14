'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  FaCheckCircle, FaExclamationCircle, FaGlobe, FaMoon, FaSun, 
  FaChevronLeft, FaTimes, FaChartBar, FaListUl, 
  FaUserClock, FaWhatsapp, FaPlus, FaEye, FaEyeSlash, FaDumbbell,
  FaChevronDown
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
    <div className="w-full h-16 bg-[var(--surface-sec)] rounded-[1.5rem] mb-6" />
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-48 border border-[var(--border)]" />
      <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-48 border border-[var(--border)]" />
    </div>
    <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-64 border border-[var(--border)]" />
  </div>
);

const translations = {
  'pt-BR': {
    title: 'Financeiro', accumulated: 'Receita Anual', monthlyRevenue: 'Receita do Mês',
    manualPayment: 'Registrar Recebimento', selectStudent: 'Selecione o aluno...', valueLabel: 'Valor (R$)',
    transactions: 'Transações Recentes', student: 'Aluno', date: 'Data', value: 'Valor',
    noName: 'Sem nome', errMissing: 'Preencha todos os campos.', errProcess: 'Erro ao processar.', 
    successPay: 'Pagamento registrado com sucesso!', successConfig: 'Configurações atualizadas!',
    selectLanguage: 'Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro',
    tabOverview: 'Visão Geral', tabTransactions: 'Lançamentos', tabPending: 'Alunos Pendentes', tabAttendance: 'Frequência',
    graphTitle: 'Faturamento Anual', charge: 'Cobrar Aluno', noPending: 'Nenhum aluno com pagamento atrasado!'
  },
  'pt-PT': {
    title: 'Financeiro', accumulated: 'Receita Anual', monthlyRevenue: 'Receita do Mês',
    manualPayment: 'Registar Recebimento', selectStudent: 'Selecione o aluno...', valueLabel: 'Valor (€)',
    transactions: 'Transações Recentes', student: 'Aluno', date: 'Data', value: 'Valor',
    noName: 'Sem nome', errMissing: 'Preencha todos os campos.', errProcess: 'Erro ao processar.', 
    successPay: 'Pagamento registado com sucesso!', successConfig: 'Configurações atualizadas!',
    selectLanguage: 'Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro',
    tabOverview: 'Visão Geral', tabTransactions: 'Lançamentos', tabPending: 'Alunos Pendentes', tabAttendance: 'Frequência',
    graphTitle: 'Faturação Anual', charge: 'Cobrar Aluno', noPending: 'Nenhum aluno em incumprimento!'
  },
  'en': {
    title: 'Financial', accumulated: 'Yearly Revenue', monthlyRevenue: 'Monthly Revenue',
    manualPayment: 'Register Payment', selectStudent: 'Select student...', valueLabel: 'Value ($)',
    transactions: 'Recent Transactions', student: 'Student', date: 'Date', value: 'Value',
    noName: 'No name', errMissing: 'Fill in all fields.', errProcess: 'Error processing.', 
    successPay: 'Payment registered successfully!', successConfig: 'Settings updated!',
    selectLanguage: 'Language', selectTheme: 'Appearance', themeLight: 'Light Mode', themeDark: 'Dark Mode',
    tabOverview: 'Overview', tabTransactions: 'Transactions', tabPending: 'Pending Students', tabAttendance: 'Attendance',
    graphTitle: 'Yearly Revenue Chart', charge: 'Charge Student', noPending: 'No pending payments!'
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
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
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

  const t = translations[lang] || translations['pt-BR'];

  // Definição das opções do Menu Dropdown
  const tabs = [
    { id: 'overview', icon: <FaChartBar />, label: t.tabOverview },
    { id: 'transactions', icon: <FaListUl />, label: t.tabTransactions },
    { id: 'pending', icon: <FaExclamationCircle />, label: t.tabPending },
    { id: 'attendance', icon: <FaUserClock />, label: t.tabAttendance }
  ];
  const activeTabConfig = tabs.find(tab => tab.id === activeTab);

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

  const showToast = (type: 'success' | 'error', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': 'rgba(21, 26, 34, 0.7)', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.08)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': 'rgba(255, 255, 255, 0.8)', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.08)',
  } as React.CSSProperties;

  const fetchDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
    const aluno = listaAlunos.find(a => a.id === idSelecionado);
    if (aluno) {
      const valorParaCobrar = aluno.valor_mensalidade || configPersonal.valor_mensalidade_padrao;
      setNovoValor(valorParaCobrar ? valorParaCobrar.toString() : '');
    }
  };

  const registrarPagamentoManual = async () => {
    if (!alunoId || !novoValor) return showToast('error', t.errMissing);
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const alunoSelecionado = listaAlunos.find(a => a.id === alunoId);
    let novaDataStr = '';
    
    // LÓGICA DE DATA BLINDADA: Adiciona 1 mês exatamente, mantendo o dia original de vencimento
    if (alunoSelecionado?.data_vencimento) {
      const [anoStr, mesStr, diaStr] = alunoSelecionado.data_vencimento.split('T')[0].split('-');
      let ano = Number(anoStr);
      let mes = Number(mesStr);
      let dia = Number(diaStr);
      
      mes += 1;
      if (mes > 12) {
        mes = 1;
        ano += 1;
      }
      
      // Validação para o JS não quebrar meses curtos (ex: vencia dia 31 Jan, não pode virar 03 de Março)
      const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
      if (dia > ultimoDiaDoMes) dia = ultimoDiaDoMes;
      
      novaDataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    } else {
      // Se por acaso não tinha data nenhuma, cria uma nova pra daqui a 1 mês
      const hj = new Date();
      hj.setMonth(hj.getMonth() + 1);
      novaDataStr = hj.toISOString().split('T')[0];
    }

    const [pgError, alError] = await Promise.all([
      supabase.from('pagamentos').insert([{
        aluno_id: alunoId, personal_id: user?.id, valor: Number(novoValor), data_pagamento: new Date().toISOString(), status: 'pago'
      }]),
      supabase.from('alunos').update({ 
        status_pagamento: 'ativo', ativo: true, data_vencimento: novaDataStr 
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

  const formatCurrency = (val: number) => new Intl.NumberFormat(lang, { style: 'currency', currency: lang === 'pt-PT' ? 'EUR' : lang === 'en' ? 'USD' : 'BRL' }).format(val);

  const pagamentosMesFiltrado = useMemo(() => pagamentos.filter(p => {
    if (!p.data_pagamento) return false;
    const date = new Date(p.data_pagamento);
    return date.getMonth() === mesFiltro && date.getFullYear() === anoFiltro;
  }), [pagamentos, mesFiltro, anoFiltro]);

  const faturamentoMes = pagamentosMesFiltrado.reduce((acc, curr) => acc + Number(curr.valor), 0);
  
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

  // ━━━━━━━━━━━━━━━━ INADIMPLENTES (AGORA 100% BLINDADO CONTRA BUG DE FUSO HORÁRIO) ━━━━━━━━━━━━━━━━
  const alunosInadimplentes = useMemo(() => listaAlunos.filter(a => {
    if (!a.data_vencimento) return false;
    
    // Pegamos a data real do dispositivo AGORA e formatamos como string YYYY-MM-DD
    const hojeObj = new Date();
    const ano = hojeObj.getFullYear();
    const mes = String(hojeObj.getMonth() + 1).padStart(2, '0');
    const dia = String(hojeObj.getDate()).padStart(2, '0');
    const hojeStr = `${ano}-${mes}-${dia}`;
    
    // Pegamos a data do banco puramente como string
    const vencimentoStr = a.data_vencimento.split('T')[0];
    
    // Comparamos as duas Strings diretamente. Menor ou igual a hoje = devendo.
    return vencimentoStr <= hojeStr; 
  }).sort((a,b) => {
    return a.data_vencimento.localeCompare(b.data_vencimento);
  }), [listaAlunos]);

  const enviarCobrancaWhatsApp = (aluno: any) => {
    if(!aluno.telefone) return alert("Aluno sem telefone cadastrado.");
    const partes = aluno.data_vencimento.split('T')[0].split('-');
    const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    
    const msg = `Olá ${aluno.nome}, tudo bem? Notei que sua mensalidade com vencimento em ${dataFormatada} está pendente. Qualquer dúvida estou à disposição!`;
    const num = aluno.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />
      
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {loading ? <FinanceiroSkeleton /> : (
        <div className="max-w-4xl mx-auto space-y-6 relative z-10 animate-in fade-in duration-700">
          
          <header className="flex justify-between items-center mb-6 pt-2">
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

          {/* ━━━━━━━━━━ MENU DROPDOWN ELEGANTE ━━━━━━━━━━ */}
          <div className="relative mb-6 z-30">
            <button 
              onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
              className="w-full bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-5 rounded-[1.5rem] flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-[var(--primary)]">{activeTabConfig?.icon}</span>
                <span className="font-black text-[13px] tracking-wide text-[var(--text-primary)] uppercase">{activeTabConfig?.label}</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Etiqueta vermelha de aviso se houver devedores e não estiver na aba */}
                {(alunosInadimplentes.length > 0 && activeTab !== 'pending') && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--danger)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--danger)]"></span>
                  </span>
                )}
                <FaChevronDown className={`text-[var(--text-secondary)] transition-transform duration-300 ${isTabMenuOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Opções do Menu Dropdown */}
            {isTabMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsTabMenuOpen(false)}></div>
                <div className="absolute top-full mt-2 w-full bg-[var(--surface)] backdrop-blur-3xl border border-[var(--border)] rounded-[1.5rem] shadow-2xl overflow-hidden p-2 flex flex-col gap-1 z-30 animate-in slide-in-from-top-2 fade-in">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id as any); setIsTabMenuOpen(false); }}
                      className={`flex items-center gap-3 p-4 rounded-xl font-bold text-[13px] uppercase transition-all active:scale-[0.98] ${activeTab === tab.id ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sec)] hover:text-[var(--text-primary)]'}`}
                    >
                      {tab.icon} {tab.label}
                      {(tab.id === 'pending' && alunosInadimplentes.length > 0) && (
                        <span className="ml-auto bg-[var(--danger)] text-white text-[10px] px-2 py-0.5 rounded-full">{alunosInadimplentes.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ━━━━━━━━━━ ABA 1: VISÃO GERAL ━━━━━━━━━━ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface)] backdrop-blur-xl p-6 rounded-[2rem] border border-[var(--border)] shadow-sm relative overflow-hidden flex flex-col justify-center">
                  <button onClick={() => setOlhoAberto(!olhoAberto)} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--primary)] active:scale-95 transition-all">
                    {olhoAberto ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                  </button>
                  <h2 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">{t.monthlyRevenue}</h2>
                  <p className="text-2xl sm:text-3xl font-black tracking-tighter text-[var(--primary)]">{olhoAberto ? formatCurrency(faturamentoMes) : '••••••'}</p>
                </div>

                <div className="bg-[var(--danger)]/10 backdrop-blur-xl p-6 rounded-[2rem] border border-[var(--danger)]/20 shadow-sm relative overflow-hidden flex flex-col justify-center">
                  <h2 className="text-[9px] font-black text-[var(--danger)] uppercase tracking-[0.2em] mb-2">Pendências</h2>
                  <p className="text-2xl sm:text-3xl font-black tracking-tighter text-[var(--danger)]">
                    {alunosInadimplentes.length} {alunosInadimplentes.length === 1 ? 'Aluno' : 'Alunos'}
                  </p>
                </div>
              </div>

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

          {/* ━━━━━━━━━━ ABA 2: TRANSAÇÕES ━━━━━━━━━━ */}
          {activeTab === 'transactions' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="bg-[var(--surface)] backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
                <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4">{t.manualPayment}</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={alunoId} 
                    onChange={(e) => handleSelecionarAluno(e.target.value)} 
                    className="flex-[2] min-w-[200px] p-4 bg-[var(--surface-sec)] rounded-[1.2rem] text-sm font-bold border border-[var(--border)] outline-none text-[var(--text-primary)] appearance-none cursor-pointer"
                  >
                    <option value="">{t.selectStudent}</option>
                    {listaAlunos.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nome} {!a.ativo ? '(Inativo)' : ''}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex gap-3">
                    <input 
                      type="number" 
                      placeholder={t.valueLabel} 
                      value={novoValor} 
                      onChange={(e) => setNovoValor(e.target.value)} 
                      className="w-full sm:flex-1 p-4 bg-[var(--surface-sec)] rounded-[1.2rem] text-sm font-bold border border-[var(--border)] outline-none text-[var(--text-primary)] focus:border-[var(--primary)] transition-colors" 
                    />
                    <button onClick={registrarPagamentoManual} disabled={saving} className="bg-[var(--primary)] text-white px-8 rounded-[1.2rem] font-black hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[var(--primary)]/20 flex items-center justify-center">
                      <FaPlus />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--surface)] backdrop-blur-xl rounded-[2.5rem] border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-sec)]/50">
                  <h2 className="font-black text-sm tracking-tighter text-[var(--text-primary)]">{t.transactions}</h2>
                  <div className="flex gap-2">
                    <select value={mesFiltro} onChange={e => setMesFiltro(Number(e.target.value))} className="bg-[var(--surface)] border border-[var(--border)] p-2 rounded-lg text-xs font-bold outline-none cursor-pointer">
                      {getMeses(lang).map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[350px] custom-scrollbar">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-[var(--border)]">
                      {pagamentosMesFiltrado.map((p) => {
                        // Garante formatação correta sem perder 1 dia pelo fuso
                        const rawDate = p.data_pagamento ? p.data_pagamento.split('T')[0] : '';
                        const dateParts = rawDate.split('-');
                        const formattedDate = rawDate ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : '-';

                        return (
                          <tr key={p.id} className="hover:bg-[var(--surface-sec)]/30 transition-colors">
                            <td className="p-5 font-bold text-sm text-[var(--text-primary)]">{p.alunos?.nome || t.noName}</td>
                            <td className="p-5 text-xs font-medium text-[var(--text-secondary)]">{formattedDate}</td>
                            <td className="p-5 text-right font-black text-sm text-[var(--success)]">{formatCurrency(Number(p.valor))}</td>
                          </tr>
                        );
                      })}
                      {pagamentosMesFiltrado.length === 0 && (
                        <tr><td colSpan={3} className="p-8 text-center text-xs font-bold text-[var(--text-secondary)]">Nenhuma transação neste mês.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━ ABA 3: INADIMPLENTES (FOCADO EM QUEM FALTA PAGAR E 100% BLINDADO) ━━━━━━━━━━ */}
          {activeTab === 'pending' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
              {alunosInadimplentes.length === 0 ? (
                <div className="bg-[var(--success)]/10 border border-[var(--success)]/20 p-10 rounded-[2.5rem] text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-[var(--success)]/20 rounded-full flex items-center justify-center text-[var(--success)]">
                    <FaCheckCircle size={32} />
                  </div>
                  <h3 className="font-black text-lg text-[var(--success)]">{t.noPending}</h3>
                </div>
              ) : (
                alunosInadimplentes.map(aluno => {
                  const vencimentoStr = aluno.data_vencimento.split('T')[0];
                  
                  // Gerando strings seguras e locais para cálculo de dias
                  const hojeObj = new Date();
                  const anoH = hojeObj.getFullYear();
                  const mesH = String(hojeObj.getMonth() + 1).padStart(2, '0');
                  const diaH = String(hojeObj.getDate()).padStart(2, '0');
                  const hojeLimpo = `${anoH}-${mesH}-${diaH}`;
                  
                  const dataHoje = new Date(`${hojeLimpo}T00:00:00`).getTime();
                  const dataVencimento = new Date(`${vencimentoStr}T00:00:00`).getTime();
                  
                  const diasAtraso = Math.floor((dataHoje - dataVencimento) / (1000 * 3600 * 24));
                  const partes = vencimentoStr.split('-');
                  
                  return (
                    <div key={aluno.id} className="bg-[var(--surface)] p-5 rounded-[1.5rem] border border-[var(--danger)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-[var(--danger)]/60 transition-all">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[var(--text-primary)] text-sm">{aluno.nome}</span>
                          {!aluno.ativo && (
                            <span className="text-[8px] bg-[var(--danger)] text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">Inativo</span>
                          )}
                        </div>
                        <div className="flex gap-2 items-center mt-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-[var(--danger)]">
                            Venceu dia {partes[2]}/{partes[1]}
                          </span>
                          {diasAtraso === 0 ? (
                            <span className="text-[10px] font-bold text-[var(--warning)] uppercase tracking-wider">
                              (Vence Hoje)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[var(--danger)] uppercase tracking-wider">
                              ({diasAtraso} {diasAtraso === 1 ? 'dia atrasado' : 'dias atrasado'})
                            </span>
                          )}
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
                          Baixar Pgto
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
                      <div key={aluno.id} className="bg-[var(--surface-sec)] p-4 rounded-2xl flex items-center justify-between border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors">
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
                          className="text-[10px] font-black uppercase bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] px-3 py-2 rounded-lg hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all active:scale-95"
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
