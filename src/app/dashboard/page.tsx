'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AgendaGeral from '@/components/AgendaGeral';
import { FaWallet, FaUsers, FaExclamationTriangle, FaCheckCircle, FaSearch } from 'react-icons/fa';

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

  // Função Premium de Baixa Automática
  const processarPagamento = async () => {
    if (!alunoSelecionado || !valorPago) return;
    
    const novaDataVencimento = new Date();
    novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 1);

    // 1. Registra no Financeiro
    await supabase.from('pagamentos').insert([{ 
      aluno_id: alunoSelecionado.id, 
      valor: parseFloat(valorPago), 
      personal_id: user.id 
    }]);

    // 2. Atualiza Aluno
    await supabase.from('alunos').update({ 
      status_pagamento: 'ativo',
      data_vencimento: novaDataVencimento.toISOString() 
    }).eq('id', alunoSelecionado.id);

    setIsModalOpen(false);
    setValorPago('');
    fetchAlunos(user.id);
    fetchFinanceiro(user.id);
  };

  const alunosFiltrados = useMemo(() => 
    alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase())), 
  [alunos, busca]);

  const hoje = new Date();
  const alunosVencendo = alunos.filter(a => a.data_vencimento && (new Date(a.data_vencimento).getTime() - hoje.getTime()) / (1000 * 3600 * 24) <= 3);

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Dashboard</h1>
            <p className="text-gray-500 font-medium">Gestão operacional e financeira.</p>
          </div>
          <button onClick={() => router.push('/dashboard/adicionar-aluno')} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-black transition-all">
            + Novo Aluno
          </button>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><FaWallet /></div>
            <div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Faturamento Mês</h2>
              <p className="text-xl font-black text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMes)}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><FaUsers /></div>
            <div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Alunos</h2>
              <p className="text-xl font-black text-gray-900">{alunos.length}</p>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <AgendaGeral />
          </div>
        </div>

        {alunosVencendo.length > 0 && (
          <div className="p-8 bg-amber-500 rounded-3xl text-white shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3"><FaExclamationTriangle /> <span className="font-bold text-sm">Alunos precisando de renovação</span></div>
            <div className="flex gap-2">
              {alunosVencendo.map(a => (
                <button key={a.id} onClick={() => { setAlunoSelecionado(a); setIsModalOpen(true); }} className="bg-amber-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700">{a.nome}</button>
              ))}
            </div>
          </div>
        )}

        <section className="bg-white shadow-sm border border-gray-100 rounded-3xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3">
            <FaSearch className="text-gray-400" />
            <input className="w-full text-sm outline-none" placeholder="Buscar aluno por nome..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
              <tr>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Nome</th>
                <th className="px-8 py-4 hidden md:table-cell">Objetivo</th>
                <th className="px-8 py-4 text-right">Ações</th> 
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alunosFiltrados.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${a.status_pagamento === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{a.status_pagamento}</span></td>
                  <td className="px-8 py-6 font-bold text-gray-900">{a.nome}</td>
                  <td className="px-8 py-6 text-sm text-gray-600 hidden md:table-cell">{a.objetivo}</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => router.push(`/dashboard/aluno/${a.id}/progresso`)} className="bg-gray-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Ver Perfil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm">
            <h2 className="font-bold text-lg mb-6">Confirmar Pagamento: {alunoSelecionado?.nome}</h2>
            <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl mb-6 font-bold outline-none" placeholder="Valor (R$)" value={valorPago} onChange={(e) => setValorPago(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 p-4 bg-gray-100 rounded-2xl font-bold">Cancelar</button>
              <button onClick={processarPagamento} className="flex-1 p-4 bg-gray-900 text-white rounded-2xl font-bold">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}