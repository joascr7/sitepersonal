'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AgendaGeral from '@/components/AgendaGeral';
import { FaWallet, FaUsers, FaExclamationTriangle, FaSearch, FaPlus, FaChartLine, FaEdit, FaUser, FaTimes, FaCalendarAlt } from 'react-icons/fa';

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

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [totalMes, setTotalMes] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [valorPago, setValorPago] = useState('');
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // 2. CORREÇÃO: Tipando o estado corretamente com a interface ou null
  const [personalInfo, setPersonalInfo] = useState<PersonalData | null>(null);
  
  const [statusAcesso, setStatusAcesso] = useState({ emTeste: true, status: 'ativo' })
  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  
  const router = useRouter();

  const getStatusDisplay = (aluno: any) => {
    if (aluno.status_pagamento === 'bloqueado' || aluno.acesso_permitido === false) return { text: 'BLOQUEADO', color: 'bg-red-50 text-red-600' };
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = aluno.data_vencimento ? new Date(aluno.data_vencimento + 'T00:00:00') : null;
    if (vencimento) {
      const dataLimite = new Date(vencimento);
      dataLimite.setDate(dataLimite.getDate() + 2);
      if (hoje > vencimento && hoje <= dataLimite) return { text: 'PENDENTE', color: 'bg-amber-50 text-amber-600' };
    }
    return { text: 'ATIVO EM DIA', color: 'bg-emerald-50 text-emerald-600' };
  };

 useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }

      const personalId = data.session.user.id;
      
      const { data: personal } = await supabase
        .from('personais')
        .select('status_pagamento, data_expiracao_teste')
        .eq('id', personalId)
        .single();

      if (personal) {
        // 3. CORREÇÃO: Agora o setPersonalInfo aceita o objeto do Supabase com segurança
        setPersonalInfo(personal as PersonalData); 
        
        const hoje = new Date();
        const expira = new Date(personal.data_expiracao_teste);

        if (personal.status_pagamento === 'teste' && hoje > expira) {
          router.push('/acesso-personal'); 
          return;
        }
      }

      setUser(data.session.user);
      fetchAlunos(personalId);
      fetchFinanceiro(personalId);
    };
    init();
  }, [router]);


  useEffect(() => {
  const verificarAcesso = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: personal } = await supabase
      .from('personais')
      .select('data_expiracao_teste, status_pagamento')
      .eq('id', user.id)
      .single();

    if (personal) {
      const hoje = new Date();
      const dataExpiracao = new Date(personal.data_expiracao_teste);
      
      // Se hoje for maior que a data de expiração E o status não for 'pago', ele sai do teste
      const estaEmTeste = hoje <= dataExpiracao && personal.status_pagamento !== 'pago';
      
      setStatusAcesso({ emTeste: estaEmTeste, status: personal.status_pagamento });
    }
  };
  verificarAcesso();
}, []);

  useEffect(() => {
    if (user?.id) {
      fetchFaturamentoPorMes(supabase, user.id, mesSelecionado, anoSelecionado)
        .then(setFaturamentoMes);
    }
  }, [user, mesSelecionado, anoSelecionado]);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const fetchAlunos = async (personalId: string) => {
    const { data } = await supabase.from('alunos').select('*').eq('personal_id', personalId).order('nome');
    if (data) setAlunos(data);
  };

  const fetchFinanceiro = async (personalId: string) => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
    const { data } = await supabase.from('pagamentos').select('valor').eq('personal_id', personalId).gte('data_pagamento', inicioMes);
    if (data) setTotalMes(data.reduce((acc, curr) => acc + Number(curr.valor), 0));
  };

  const toggleStatus = async (aluno: any) => {
  const novoStatus = !aluno.ativo; // Inverte o valor atual
  const confirmMsg = novoStatus 
    ? `Confirmar reativação do acesso para ${aluno.nome}?` 
    : `Confirmar bloqueio de acesso para ${aluno.nome}?`;

  if (!confirm(confirmMsg)) return;
  
  const { error } = await supabase
    .from('alunos')
    .update({ ativo: novoStatus })
    .eq('id', aluno.id);
    
  if (error) {
    showStatus('error', 'Erro ao alterar status.');
  } else {
    showStatus('success', novoStatus ? 'Aluno reativado!' : 'Acesso bloqueado!');
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
        aluno_id: alunoSelecionado.id, 
        valor: parseFloat(valorPago), 
        personal_id: user.id, 
        data_pagamento: new Date().toISOString()
      }]);
      if (pgError) throw pgError;

      const novaData = calcularNovoVencimento(alunoSelecionado.data_vencimento);
      const { error: alError } = await supabase.from('alunos').update({ status_pagamento: 'ativo', data_vencimento: novaData }).eq('id', alunoSelecionado.id);
      if (alError) throw alError;

      setIsModalOpen(false); 
      setValorPago(''); 
      await Promise.all([fetchAlunos(user.id), fetchFinanceiro(user.id)]);
      showStatus('success', 'Pagamento registrado com sucesso!');
    } catch (err: any) {
      showStatus('error', 'Falha ao processar: ' + err.message);
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
    <main className="min-h-screen bg-[#F8F9FA] p-4 md:p-12 pb-24">
      {statusMsg && (
        <div className={`fixed top-6 right-6 p-4 rounded-2xl shadow-2xl z-[100] text-[10px] font-black uppercase tracking-widest ${statusMsg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {statusMsg.text}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black">Registrar Pagamento</h3>
              <button onClick={() => setIsModalOpen(false)}><FaTimes /></button>
            </div>
            <input type="number" value={valorPago} onChange={(e) => setValorPago(e.target.value)} placeholder="Valor (R$)" className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
            <button onClick={processarPagamento} className="w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase text-xs">Confirmar Pagamento</button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-950 tracking-tighter">Dashboard</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Gestão de Alta Performance</p>
          </div>
          <button onClick={() => router.push('/dashboard/adicionar-aluno')} className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all">
            <FaPlus />
          </button>
        </header>

{/* 1. Toast de status (corrigido para não dar erro) */}
{statusMsg && (
  <div className={`fixed top-6 right-6 p-4 rounded-2xl shadow-2xl z-[100] text-[10px] font-black uppercase tracking-widest ${statusMsg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
    {statusMsg.text}
  </div>
)}

{/* 2. Aviso de Teste Grátis */}
{/* 2. Aviso de Teste Grátis Dinâmico */}
{statusAcesso.emTeste && (
  <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex justify-between items-center shadow-sm">
    <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
      Você está no período de teste.
    </p>
    <button 
      onClick={() => router.push('/acesso-personal')} 
      className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all"
    >
      Assinar Plano
    </button>
  </div>
)}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <FaWallet className="text-emerald-500 mb-2" />
              <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mês Atual</h2>
              <p className="text-lg font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMes)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-blue-500"><FaCalendarAlt /> <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Relatório por Mês</h2></div>
              <div className="flex gap-2">
                <select className="bg-gray-50 p-2 rounded-xl text-[10px] font-black w-full" value={mesSelecionado} onChange={(e) => setMesSelecionado(Number(e.target.value))}>
                  {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <input type="number" className="bg-gray-50 p-2 rounded-xl text-[10px] font-black w-16 text-center" value={anoSelecionado} onChange={(e) => setAnoSelecionado(Number(e.target.value))} />
              </div>
              <p className="text-lg font-black mt-3 text-blue-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoMes)}</p>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
             <AgendaGeral />
          </div>
        </div>

        {alunosVencendo.length > 0 && (
          <div className="p-6 bg-amber-500 rounded-[2rem] text-white flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3"><FaExclamationTriangle /> <span className="font-black text-xs">Renovação próxima</span></div>
            <div className="flex gap-2">
              {alunosVencendo.map(a => (
                <button key={a.id} onClick={() => { setAlunoSelecionado(a); setIsModalOpen(true); }} className="bg-amber-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-amber-700 uppercase">{a.nome}</button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <FaSearch className="absolute left-6 top-5 text-gray-400" />
          <input className="w-full bg-white p-5 pl-14 rounded-[2rem] border border-gray-100 shadow-sm outline-none text-sm font-bold" placeholder="Buscar aluno..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        <div className="space-y-4">
          {alunosFiltrados.map((a) => {
            const statusDisplay = getStatusDisplay(a);
            return (
              <div key={a.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-500 overflow-hidden">
                    {a.avatar_url ? <img src={a.avatar_url} className="w-full h-full object-cover" /> : a.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900">{a.nome}</h3>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <button 
  onClick={() => toggleStatus(a)} 
  className={`p-3 rounded-xl transition-colors ${
    a.ativo 
      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
      : 'bg-red-50 text-red-600 hover:bg-red-100'
  }`}
  title={a.ativo ? "Bloquear Acesso" : "Liberar Acesso"}
>
  {a.ativo ? <FaTimes /> : <FaUser />} 
</button>
                  <button onClick={() => router.push(`/dashboard/editar-aluno/${a.id}`)} className="bg-gray-100 p-3 rounded-xl text-gray-600 hover:bg-gray-200"><FaEdit /></button>
                  <button onClick={() => router.push(`/dashboard/aluno/${a.id}`)} className="bg-gray-100 p-3 rounded-xl text-gray-600 hover:bg-gray-200"><FaUser /></button>
                  <button onClick={() => router.push(`/dashboard/aluno/${a.id}/progresso`)} className="bg-gray-900 text-white p-3 rounded-xl"><FaChartLine /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}