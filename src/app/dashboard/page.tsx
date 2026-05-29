'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AgendaGeral from '@/components/AgendaGeral';
import { FaWallet, FaUsers, FaExclamationTriangle, FaSearch, FaPlus, FaChartLine, FaUser, FaCalendarAlt } from 'react-icons/fa';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [totalMes, setTotalMes] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [valorPago, setValorPago] = useState('');
  const router = useRouter();

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
    const novaDataVencimento = new Date();
    novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 1);

    await supabase.from('pagamentos').insert([{ 
      aluno_id: alunoSelecionado.id, valor: parseFloat(valorPago), personal_id: user.id 
    }]);

    await supabase.from('alunos').update({ 
      status_pagamento: 'ativo', data_vencimento: novaDataVencimento.toISOString() 
    }).eq('id', alunoSelecionado.id);

    setIsModalOpen(false); setValorPago(''); fetchAlunos(user.id); fetchFinanceiro(user.id);
  };

  const alunosFiltrados = useMemo(() => 
    alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase())), 
  [alunos, busca]);

  const hoje = new Date();
  const alunosVencendo = alunos.filter(a => a.data_vencimento && (new Date(a.data_vencimento).getTime() - hoje.getTime()) / (1000 * 3600 * 24) <= 3);

  return (
    <main className="min-h-screen bg-[#F8F9FA] p-4 md:p-12 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-950 tracking-tighter">Dashboard</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Gestão de Alta Performance</p>
          </div>
          <button onClick={() => router.push('/dashboard/adicionar-aluno')} className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all">
            <FaPlus />
          </button>
        </header>

        {/* Grade: Indicadores e Agenda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="text-emerald-600 mb-2"><FaWallet /></div>
              <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mês Atual</h2>
              <p className="text-lg font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMes)}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="text-blue-600 mb-2"><FaUsers /></div>
              <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alunos</h2>
              <p className="text-lg font-black">{alunos.length}</p>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
             <div className="flex items-center gap-2 mb-4 text-gray-400"><FaCalendarAlt className="text-xs" /><span className="text-[9px] font-black uppercase tracking-widest">Agenda Geral</span></div>
             <AgendaGeral />
          </div>
        </div>

        {/* Alerta de Vencimento */}
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

        {/* Busca */}
        <div className="relative">
          <FaSearch className="absolute left-6 top-5 text-gray-400" />
          <input className="w-full bg-white p-5 pl-14 rounded-[2rem] border border-gray-100 shadow-sm outline-none text-sm font-bold" placeholder="Buscar aluno..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        {/* Lista de Alunos */}
        <div className="space-y-4">
          {alunosFiltrados.map((a) => (
            <div key={a.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-500 overflow-hidden">
                   {a.avatar_url ? <img src={a.avatar_url} className="w-full h-full object-cover"/> : a.nome.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-gray-900">{a.nome}</h3>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${a.status_pagamento === 'ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {a.status_pagamento}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => router.push(`/dashboard/aluno/${a.id}`)} className="bg-gray-100 p-3 rounded-xl text-gray-600"><FaUser /></button>
                <button onClick={() => router.push(`/dashboard/aluno/${a.id}/progresso`)} className="bg-gray-900 text-white p-3 rounded-xl"><FaChartLine /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Pagamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm">
            <h2 className="font-black text-lg mb-6">Receber de {alunoSelecionado?.nome}</h2>
            <input type="number" className="w-full p-5 bg-gray-50 rounded-2xl mb-6 font-bold text-lg outline-none" placeholder="R$ 0,00" value={valorPago} onChange={(e) => setValorPago(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 p-5 bg-gray-100 rounded-2xl font-black text-xs uppercase">Cancelar</button>
              <button onClick={processarPagamento} className="flex-1 p-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}