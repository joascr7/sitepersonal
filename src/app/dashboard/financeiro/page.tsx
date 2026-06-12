'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  FaCheckCircle, FaDollarSign, FaPlus, FaGlobe, FaMoon, 
  FaSun, FaExclamationCircle, FaCog, FaWallet, FaEye, FaEyeSlash,
  FaChevronLeft, FaTimes, FaCheck
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
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-48 border border-[var(--border)]" />
      <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-48 border border-[var(--border)]" />
    </div>
    <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-32 border border-[var(--border)]" />
    <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-64 border border-[var(--border)]" />
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Financeiro',
    accumulated: 'Faturamento Acumulado', 
    monthlyRevenue: 'Faturamento do Mês',
    activeSystem: 'Sistema Ativo',
    config: 'Configurações', monthlyFee: 'Valor Mensalidade', pix: 'Chave PIX',
    saveChanges: 'Salvar Alterações', saving: 'Salvando...',
    manualPayment: 'Registrar Pagamento Manual', selectStudent: 'Selecione o aluno...',
    valueLabel: 'Valor R$', register: 'Registrar',
    transactions: 'Transações do Mês', student: 'Aluno', date: 'Data', value: 'Valor',
    noName: 'Sem nome', errMissing: 'Preencha todos os campos.',
    errProcess: 'Erro ao processar.', successPay: 'Pagamento registrado!',
    successConfig: 'Configurações atualizadas!',
    selectLanguage: 'Selecione o Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro'
  },
  'pt-PT': {
    title: 'Financeiro',
    accumulated: 'Faturação Acumulada', 
    monthlyRevenue: 'Faturação do Mês',
    activeSystem: 'Sistema Ativo',
    config: 'Configurações', monthlyFee: 'Valor Mensalidade', pix: 'Chave PIX',
    saveChanges: 'Guardar Alterações', saving: 'A guardar...',
    manualPayment: 'Registar Pagamento Manual', selectStudent: 'Selecione o aluno...',
    valueLabel: 'Valor €', register: 'Registar',
    transactions: 'Transações do Mês', student: 'Aluno', date: 'Data', value: 'Valor',
    noName: 'Sem nome', errMissing: 'Preencha todos os campos.',
    errProcess: 'Erro ao processar.', successPay: 'Pagamento registado!',
    successConfig: 'Configurações atualizadas!',
    selectLanguage: 'Selecione o Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro'
  },
  'en': {
    title: 'Financial',
    accumulated: 'Accumulated Revenue', 
    monthlyRevenue: 'Monthly Revenue',
    activeSystem: 'System Active',
    config: 'Settings', monthlyFee: 'Monthly Fee', pix: 'PIX Key',
    saveChanges: 'Save Changes', saving: 'Saving...',
    manualPayment: 'Register Manual Payment', selectStudent: 'Select student...',
    valueLabel: 'Value $', register: 'Register',
    transactions: 'Monthly Transactions', student: 'Student', date: 'Date', value: 'Value',
    noName: 'No name', errMissing: 'Fill in all fields.',
    errProcess: 'Error processing.', successPay: 'Payment registered!',
    successConfig: 'Settings updated!',
    selectLanguage: 'Select Language', selectTheme: 'Appearance', themeLight: 'Light Mode', themeDark: 'Dark Mode'
  }
};

const languages = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

const getMeses = (lang: string) => {
  if (lang === 'en') return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
};

export default function Financeiro() {
  const router = useRouter();
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ pix: '', valor: 150 });
  const [saving, setSaving] = useState(false);
  const [novoValor, setNovoValor] = useState('');
  const [alunoId, setAlunoId] = useState('');
  const [listaAlunos, setListaAlunos] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [olhoAberto, setOlhoAberto] = useState(true);
  
  // Filtros de Mês/Ano
  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth());
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());

  // Estados UI Premium
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
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
  const showToast = (type: 'success' | 'error', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

  // Configuração Dinâmica do Tema Premium (Glassmorphism atualizado)
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': 'rgba(21, 26, 34, 0.8)', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.08)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': 'rgba(255, 255, 255, 0.85)', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.08)',
  } as React.CSSProperties;

  const fetchDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [pRes, cRes, aRes] = await Promise.all([
      supabase.from('pagamentos').select('id, valor, data_pagamento, alunos(nome)').eq('personal_id', user.id).order('data_pagamento', { ascending: false }),
      supabase.from('personais').select('chave_pix, valor_mensalidade').eq('id', user.id).single(),
      supabase.from('alunos').select('id, nome').eq('personal_id', user.id).eq('ativo', true)
    ]);

    setPagamentos(pRes.data || []);
    setListaAlunos(aRes.data || []);
    if (cRes.data) {
      setConfig({ 
        pix: cRes.data.chave_pix || '', 
        valor: cRes.data.valor_mensalidade || 150
      });
    }
    setLoading(false);
  };

  const registrarPagamentoManual = async () => {
    if (!alunoId || !novoValor) {
      return showToast('error', t.errMissing);
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Atualiza a data de vencimento do aluno (adiciona 1 mês)
    const { data: alunoData } = await supabase.from('alunos').select('data_vencimento').eq('id', alunoId).single();
    let novaDataVencimento = new Date();
    if (alunoData?.data_vencimento) {
      const dataAtual = new Date(alunoData.data_vencimento + 'T00:00:00');
      if (dataAtual > novaDataVencimento) novaDataVencimento = dataAtual;
    }
    novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 1);

    const [pgError, alError] = await Promise.all([
      supabase.from('pagamentos').insert([{
        aluno_id: alunoId,
        personal_id: user?.id,
        valor: Number(novoValor),
        data_pagamento: new Date().toISOString(),
        status: 'pago'
      }]),
      supabase.from('alunos').update({ 
        status_pagamento: 'ativo', 
        data_vencimento: novaDataVencimento.toISOString().split('T')[0] 
      }).eq('id', alunoId)
    ]);

    if (!pgError.error && !alError.error) {
      setNovoValor('');
      setAlunoId('');
      showToast('success', t.successPay);
      await fetchDados();
    } else {
      showToast('error', t.errProcess);
    }
    setSaving(false);
  };

  const salvarConfig = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('personais').update({ 
      chave_pix: config.pix, 
      valor_mensalidade: config.valor
    }).eq('id', user?.id);
    
    if (!error) showToast('success', t.successConfig);
    else showToast('error', t.errProcess);
    
    setSaving(false);
  };

  // Cálculos Financeiros
  const pagamentosFiltrados = useMemo(() => {
    return pagamentos.filter(p => {
      if (!p.data_pagamento) return false;
      const date = new Date(p.data_pagamento);
      return date.getMonth() === mesFiltro && date.getFullYear() === anoFiltro;
    });
  }, [pagamentos, mesFiltro, anoFiltro]);

  const faturamentoMes = pagamentosFiltrados.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalGeral = pagamentos.reduce((acc, curr) => acc + Number(curr.valor), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(lang, { 
      style: 'currency', 
      currency: lang === 'pt-PT' ? 'EUR' : lang === 'en' ? 'USD' : 'BRL' 
    }).format(val);
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Toast Flutuante */}
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {loading ? <FinanceiroSkeleton /> : (
        <div className="max-w-4xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">
          
          {/* CABEÇALHO PREMIUM UNIFICADO */}
          <header className="flex justify-between items-center mb-8 pt-4">
            <button 
              onClick={() => router.back()} 
              className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] active:scale-95 transition-all shadow-sm hover:bg-[var(--surface-sec)]"
            >
              <FaChevronLeft className="text-[var(--text-primary)]" size={14} />
            </button>
            
            <h1 className="text-xl sm:text-3xl font-black tracking-tighter text-[var(--text-primary)] px-2">{t.title}</h1>
            
            {/* ━━━━━━━━━━ CONTROLES UNIFICADOS (PILL UI) ━━━━━━━━━━ */}
            <div className="flex items-center bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-full shadow-sm p-1">
              <button 
                onClick={() => setIsLangModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-95"
              >
                <FaGlobe size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{lang.split('-')[0]}</span>
              </button>
              
              <div className="w-[1px] h-4 bg-[var(--border)] mx-0.5" />
              
              <button 
                onClick={() => setIsThemeModalOpen(true)} 
                className="flex items-center justify-center w-10 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-95"
              >
                {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>
            </div>
          </header>
          
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Card Faturamento Acumulado & Mensal */}
            <div className="bg-[var(--surface)] backdrop-blur-xl p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm relative overflow-hidden flex flex-col justify-center gap-6">
              
              {/* Header com Olho alinhado ao topo direito */}
              <button 
                onClick={() => setOlhoAberto(!olhoAberto)} 
                className="absolute top-6 right-6 text-[var(--text-secondary)] hover:text-[var(--primary)] z-20 active:scale-90 transition-transform"
              >
                {olhoAberto ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
              </button>

              {/* Bloco Faturamento do Mês */}
              <div className="relative z-10 mt-2">
                <h2 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-1">
                  {t.monthlyRevenue}
                </h2>
                <p className="text-3xl sm:text-4xl font-black tracking-tighter text-[var(--primary)]">
                  {olhoAberto ? formatCurrency(faturamentoMes) : '••••••••'}
                </p>
              </div>
              
              {/* Bloco Faturamento Acumulado */}
              <div className="relative z-10">
                <h2 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-1">
                  {t.accumulated}
                </h2>
                <p className="text-xl sm:text-2xl font-black tracking-tighter text-[var(--text-primary)]">
                  {olhoAberto ? formatCurrency(totalGeral) : '••••••••'}
                </p>
              </div>
            </div>

            {/* Opcional: Se for usar o card de configurações novamente, o bloco entra aqui */}
            
          </div>

          {/* Card Pagamento Manual */}
          <div className="bg-[var(--surface)] backdrop-blur-xl p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
            <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-6">{t.manualPayment}</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={alunoId}
                onChange={(e) => setAlunoId(e.target.value)} 
                className="flex-[2] min-w-[200px] p-4 bg-[var(--surface-sec)] rounded-[1.2rem] text-sm font-bold border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text-primary)] shadow-inner appearance-none truncate cursor-pointer"
              >
                <option value="" className="bg-[var(--surface)]">{t.selectStudent}</option>
                {listaAlunos.map(a => <option key={a.id} value={a.id} className="bg-[var(--surface)]">{a.nome}</option>)}
              </select>
              <div className="flex gap-3">
                <input 
                  type="number" placeholder={t.valueLabel} value={novoValor} 
                  onChange={(e) => setNovoValor(e.target.value)} 
                  className="w-full sm:flex-1 min-w-[100px] p-4 bg-[var(--surface-sec)] rounded-[1.2rem] text-sm font-bold border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] shadow-inner" 
                />
                <button 
                  onClick={registrarPagamentoManual} disabled={saving} 
                  className="bg-[var(--primary)] text-white px-8 rounded-[1.2rem] font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[var(--primary)]/20 shrink-0 disabled:opacity-50"
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Transações com Filtro de Mês/Ano e Rolagem Controlada */}
          <div className="bg-[var(--surface)] backdrop-blur-xl rounded-[2.5rem] border border-[var(--border)] shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 sm:p-8 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <h2 className="font-black text-lg sm:text-xl tracking-tighter text-[var(--text-primary)]">{t.transactions}</h2>
              <div className="flex gap-2">
                <select 
                  value={mesFiltro} 
                  onChange={e => setMesFiltro(Number(e.target.value))} 
                  className="bg-[var(--surface-sec)] border border-[var(--border)] p-3 rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] cursor-pointer"
                >
                  {getMeses(lang).map((m, i) => <option key={i} value={i} className="bg-[var(--surface)]">{m}</option>)}
                </select>
                <input 
                  type="number" 
                  value={anoFiltro} 
                  onChange={e => setAnoFiltro(Number(e.target.value))} 
                  className="w-20 bg-[var(--surface-sec)] border border-[var(--border)] p-3 rounded-xl text-xs font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" 
                />
              </div>
            </div>
            
            {/* Limitador de altura da tabela (Scroll controlado) */}
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
              <table className="w-full text-left min-w-[400px] relative">
                <thead className="bg-[var(--surface-sec)] text-[9px] uppercase font-black text-[var(--text-secondary)] tracking-[0.2em] sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-5 sm:p-6">{t.student}</th>
                    <th className="p-5 sm:p-6">{t.date}</th>
                    <th className="p-5 sm:p-6 text-right">{t.value}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {pagamentosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface-sec)]/50 transition-colors">
                      <td className="p-5 sm:p-6 font-bold text-sm text-[var(--text-primary)]">{p.alunos?.nome || t.noName}</td>
                      <td className="p-5 sm:p-6 text-xs font-medium text-[var(--text-secondary)]">
                        {p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString(lang) : '-'}
                      </td>
                      <td className="p-5 sm:p-6 text-right font-black text-sm text-[var(--success)]">
                        {formatCurrency(Number(p.valor))}
                      </td>
                    </tr>
                  ))}
                  {pagamentosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                        Nenhuma transação encontrada neste mês.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                  {/* Botão Claro */}
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
                  
                  {/* Botão Escuro */}
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
            
            {/* Indicador de Swipe Mobile (Trancinho) */}
            <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mt-6 sm:hidden" />
          </div>
        </div>
      )}

    </main>
  );
}
