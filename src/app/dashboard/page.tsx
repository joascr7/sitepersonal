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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Dashboard',
    subtitle: 'Gestão de Alta Performance',
    revenue: 'Receita Mês',
    report: 'Relatório',
    search: 'Buscar aluno por nome...',
    statusBlocked: 'BLOQUEADO',
    statusActive: 'ATIVO',
    statusPending: 'PENDENTE',
    add: 'Adicionar',
    testPeriod: 'Período de teste ativo',
    subscribe: 'Assinar',
    renewal: 'Renovação próxima',
    confirmReativar: 'Confirmar reativação do acesso para ',
    confirmBloqueio: 'Confirmar bloqueio de acesso para ',
    errStatus: 'Erro ao alterar status.',
    successStatus: 'Status atualizado!',
    errProcess: 'Falha ao processar: ',
    successPay: 'Pagamento registrado com sucesso!',
    confirmPagamento: 'Confirmar Pagamento',
    valorPlaceholder: 'Valor (R$)'
  },
  'pt-PT': {
    title: 'Dashboard',
    subtitle: 'Gestão de Alta Performance',
    revenue: 'Receita Mês',
    report: 'Relatório',
    search: 'Procurar aluno por nome...',
    statusBlocked: 'BLOQUEADO',
    statusActive: 'ATIVO',
    statusPending: 'PENDENTE',
    add: 'Adicionar',
    testPeriod: 'Período de teste ativo',
    subscribe: 'Assinar',
    renewal: 'Renovação próxima',
    confirmReativar: 'Confirmar reativação do acesso para ',
    confirmBloqueio: 'Confirmar bloqueio de acesso para ',
    errStatus: 'Erro ao alterar status.',
    successStatus: 'Status atualizado!',
    errProcess: 'Falha ao processar: ',
    successPay: 'Pagamento registado com sucesso!',
    confirmPagamento: 'Confirmar Pagamento',
    valorPlaceholder: 'Valor'
  },
  'en': {
    title: 'Dashboard',
    subtitle: 'High Performance Management',
    revenue: 'Monthly Revenue',
    report: 'Report',
    search: 'Search student by name...',
    statusBlocked: 'BLOCKED',
    statusActive: 'ACTIVE',
    statusPending: 'PENDING',
    add: 'Add',
    testPeriod: 'Active trial period',
    subscribe: 'Subscribe',
    renewal: 'Upcoming renewal',
    confirmReativar: 'Confirm access reactivation for ',
    confirmBloqueio: 'Confirm access blocking for ',
    errStatus: 'Error changing status.',
    successStatus: 'Status updated!',
    errProcess: 'Failed to process: ',
    successPay: 'Payment registered successfully!',
    confirmPagamento: 'Confirm Payment',
    valorPlaceholder: 'Value'
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
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [statusAcesso, setStatusAcesso] = useState({ emTeste: true });

  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
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

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const getStatusDisplay = (aluno: any) => {
    if (!aluno.ativo) return { text: t.statusBlocked, color: 'bg-red-500/10 text-red-500 border-red-500/20' };
    return { text: t.statusActive, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push('/'); return; }

      const personalId = data.session.user.id;
      const { data: personal } = await supabase.from('personais').select('status_pagamento, data_expiracao_teste').eq('id', personalId).single();

      if (personal) {
        const hoje = new Date();
        const expira = new Date(personal.data_expiracao_teste);
        if (personal.status_pagamento === 'teste' && hoje > expira) { router.push('/acesso-personal'); return; }
        setStatusAcesso({ emTeste: hoje <= expira && personal.status_pagamento !== 'pago' });
      }

      setUser(data.session.user);
      fetchAlunos(personalId);
      fetchFinanceiro(personalId);
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
    const confirmMsg = aluno.ativo ? `${t.confirmBloqueio}${aluno.nome}?` : `${t.confirmReativar}${aluno.nome}?`;
    if (!confirm(confirmMsg)) return;
    
    const { error } = await supabase.from('alunos').update({ ativo: !aluno.ativo }).eq('id', aluno.id);
    if (error) showToast('error', t.errStatus);
    else { showToast('success', t.successStatus); fetchAlunos(user.id); }
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
        aluno_id: alunoSelecionado.id, 
        valor: parseFloat(valorPago), 
        personal_id: user.id, 
        data_pagamento: new Date().toISOString()
      }]);
      if (pgError) throw pgError;

      const novaData = calcularNovoVencimento(alunoSelecionado.data_vencimento);
      const { error: alError } = await supabase.from('alunos').update({ status_pagamento: 'ativo', data_vencimento: novaData }).eq('id', alunoSelecionado.id);
      if (alError) throw alError;

      setIsModalOpen(false); setValorPago(''); 
      await Promise.all([fetchAlunos(user.id), fetchFinanceiro(user.id)]);
      showToast('success', t.successPay);
    } catch (err: any) {
      showToast('error', t.errProcess + err.message);
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

  return (
    <SubscriptionGuard>
      <main className={`min-h-screen p-6 pt-24 pb-32 transition-colors duration-500 ${isDark ? 'bg-[#0F1115] text-[#F8FAFC]' : 'bg-[#F3F6FB] text-[#111827]'}`}>
        
        {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[500] px-6 py-4 rounded-[1.2rem] border backdrop-blur-md shadow-2xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
            {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <div className={`p-8 rounded-[2rem] w-full max-w-sm border shadow-2xl ${isDark ? 'bg-[#151A22] border-white/5' : 'bg-white border-black/5'}`}>
              <div className="flex justify-between items-center mb-6"><h3 className="font-black">{t.confirmPagamento}</h3><button onClick={() => setIsModalOpen(false)}><FaTimes /></button></div>
              <input type="number" value={valorPago} onChange={(e) => setValorPago(e.target.value)} placeholder={t.valorPlaceholder} className="w-full p-4 mb-4 rounded-xl font-bold border border-white/10 bg-black/10 outline-none" />
              <button onClick={processarPagamento} className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-black uppercase text-xs">{t.confirmPagamento}</button>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">{t.title}</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleLang} className="p-4 rounded-[1.2rem] bg-black/5"><FaGlobe /></button>
              <button onClick={toggleTheme} className="p-4 rounded-[1.2rem] bg-black/5">{isDark ? <FaSun /> : <FaMoon />}</button>
              <button onClick={() => router.push('/dashboard/adicionar-aluno')} className="bg-[var(--primary)] text-white p-4 rounded-[1.2rem] shadow-lg"><FaPlus /></button>
            </div>
          </header>

          {statusAcesso.emTeste && (
            <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 p-6 rounded-[2rem] flex justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">{t.testPeriod}</p>
              <button onClick={() => router.push('/acesso-personal')} className="bg-[var(--primary)] text-white px-6 py-3 rounded-[1.2rem] text-[10px] font-black uppercase">{t.subscribe}</button>
            </div>
          )}
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div className="bg-[#151A22] p-8 rounded-[2rem] border border-white/5 shadow-sm">
                <FaWallet className="text-[var(--primary)] mb-3 text-lg" />
                <h2 className="text-[9px] font-black uppercase tracking-widest opacity-60">{t.revenue}</h2>
                <p className="text-xl font-black mt-1">R$ {totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-[#151A22] p-8 rounded-[2rem] border border-white/5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 opacity-60">
                  <FaCalendarAlt size={14} /> 
                  <h2 className="text-[9px] font-black uppercase tracking-widest">{t.report}</h2>
                </div>
                <select className="w-full bg-[#1B2330] p-3 rounded-[1.2rem] text-[10px] font-bold outline-none mb-2" value={mesSelecionado} onChange={(e) => setMesSelecionado(Number(e.target.value))}>
                  {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <p className="text-xl font-black text-[var(--primary)]">R$ {faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="md:col-span-2 bg-[#151A22] p-8 rounded-[2rem] border border-white/5 shadow-sm overflow-hidden">
               <AgendaGeral />
            </div>
          </div>

          {alunosVencendo.length > 0 && (
            <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center justify-between">
              <p className="font-black text-xs uppercase tracking-widest text-amber-500">{t.renewal}</p>
              <div className="flex gap-2">{alunosVencendo.map(a => <button key={a.id} onClick={() => { setAlunoSelecionado(a); setIsModalOpen(true); }} className="bg-amber-500 px-4 py-2 rounded-xl text-[10px] font-black">{a.nome}</button>)}</div>
            </div>
          )}

          <div className="relative group">
            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 opacity-40" />
            <input 
              className="w-full bg-[#151A22] p-6 pl-14 rounded-[2rem] border border-white/5 outline-none focus:border-[var(--primary)] transition-all text-sm font-bold shadow-sm" 
              placeholder={t.search} 
              value={busca} 
              onChange={(e) => setBusca(e.target.value)} 
            />
          </div>

          <div className="space-y-4">
            {alunosFiltrados.map((a) => {
              const status = getStatusDisplay(a);
              return (
                <div key={a.id} className="bg-[#151A22] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between hover:border-[var(--primary)]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1B2330] flex items-center justify-center font-black text-xs border border-white/5 overflow-hidden">
                      {a.avatar_url ? <img src={a.avatar_url} className="w-full h-full rounded-full object-cover" /> : a.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-sm">{a.nome}</h3>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${status.color}`}>{status.text}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleStatus(a)} className="p-3 rounded-xl bg-[#1B2330] hover:bg-white/10"><FaTimes size={14} /></button>
                    <button onClick={() => router.push(`/dashboard/aluno/${a.id}`)} className="p-3 rounded-xl bg-[var(--primary)] text-white"><FaUser size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-20" />
        </div>
      </main>
    </SubscriptionGuard>
  );
}
