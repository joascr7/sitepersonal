'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AgendaGeral from '@/components/AgendaGeral';
import { FaWallet, FaUsers, FaExclamationTriangle, FaSearch, FaPlus, FaChartLine, FaEdit, FaUser } from 'react-icons/fa';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [totalMes, setTotalMes] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [valorPago, setValorPago] = useState('');
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const router = useRouter();

  // Função para determinar o status visual com tolerância de 2 dias
  const getStatusDisplay = (aluno: any) => {
    if (aluno.status_pagamento === 'bloqueado') return { text: 'BLOQUEADO', color: 'bg-red-50 text-red-600' };
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = aluno.data_vencimento ? new Date(aluno.data_vencimento + 'T00:00:00') : null;
    
    if (vencimento) {
      const dataLimite = new Date(vencimento);
      dataLimite.setDate(dataLimite.getDate() + 2);
      
      if (hoje > vencimento && hoje <= dataLimite) return { text: 'PENDENTE', color: 'bg-amber-50 text-amber-600' };
    }
    return { text: 'ATIVO', color: 'bg-emerald-50 text-emerald-600' };
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/');
      else {
        setUser(data.session.user);
        fetchAlunos(data.session.user.id);
        fetchFinanceiro(data.session.user.id);
      }
    };
    init();
  }, [router]);

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

  const processarPagamento = async () => {
    if (!alunoSelecionado || !valorPago) return;

    const dataVencimentoAtual = alunoSelecionado.data_vencimento;
    
    const calcularNovoVencimento = (dataVencimentoAtual: string | null) => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = dataVencimentoAtual ? new Date(dataVencimentoAtual + 'T00:00:00') : null;

      if (vencimento && vencimento >= hoje) {
        const novo = new Date(vencimento);
        novo.setMonth(novo.getMonth() + 1);
        return novo.toISOString();
      }
      const novo = new Date();
      novo.setMonth(novo.getMonth() + 1);
      return novo.toISOString();
    };

    const novaData = calcularNovoVencimento(dataVencimentoAtual);

    const { error } = await supabase.from('pagamentos').insert([{ 
      aluno_id: alunoSelecionado.id, valor: parseFloat(valorPago), personal_id: user.id 
    }]);

    if (!error) {
      await supabase.from('alunos').update({ 
        status_pagamento: 'ativo', data_vencimento: novaData 
      }).eq('id', alunoSelecionado.id);
      
      setIsModalOpen(false); setValorPago(''); fetchAlunos(user.id); fetchFinanceiro(user.id);
      showStatus('success', 'Pagamento registrado com sucesso!');
    }
  };

  const alunosFiltrados = useMemo(() => alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase())), [alunos, busca]);
  
  // Lógica para listar alunos vencendo ou pendentes (vencimento + 2 dias)
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <FaWallet className="text-emerald-500 mb-2" />
              <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mês Atual</h2>
              <p className="text-lg font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMes)}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <FaUsers className="text-blue-500 mb-2" />
              <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alunos</h2>
              <p className="text-lg font-black">{alunos.length}</p>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
             <AgendaGeral />
          </div>
        </div>

        {alunosVencendo.length > 0 && (
          <div className="p-6 bg-amber-500 rounded-[2rem] text-white flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3"><FaExclamationTriangle /> <span className="font-black text-xs">Renovação próxima/Pendente</span></div>
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