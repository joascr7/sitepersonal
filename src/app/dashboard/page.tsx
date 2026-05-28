'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AgendaGeral from '@/components/AgendaGeral';

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
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/');
      else {
        setUser(data.session.user);
        fetchAlunos(data.session.user.id);
        fetchFinanceiro(data.session.user.id);
      }
    };
    checkUser();
  }, [router]);

  const fetchAlunos = async (personalId: string) => {
    const { data } = await supabase.from('alunos').select('*').eq('personal_id', personalId).order('nome');
    if (data) setAlunos(data);
  };

  const fetchFinanceiro = async (personalId: string) => {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
    const { data } = await supabase.from('pagamentos').select('valor').eq('personal_id', personalId).gte('data_pagamento', primeiroDiaMes);
    if (data) setTotalMes(data.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0));
  };

  const processarPagamento = async () => {
    if (!alunoSelecionado || !valorPago) return;
    try {
      const { error } = await supabase.from('pagamentos').insert([{ 
        aluno_id: alunoSelecionado.id, valor: parseFloat(valorPago), personal_id: user.id 
      }]);
      if (error) throw error;
      const novaData = new Date();
      novaData.setDate(novaData.getDate() + 30);
      await supabase.from('alunos').update({ data_vencimento: novaData.toISOString().split('T')[0] }).eq('id', alunoSelecionado.id);
      setIsModalOpen(false);
      setValorPago('');
      fetchAlunos(user.id);
      fetchFinanceiro(user.id);
    } catch (err: any) { console.error(err); }
  };

  const hoje = new Date();
  const alunosVencendo = alunos.filter(a => a.data_vencimento && (new Date(a.data_vencimento).getTime() - hoje.getTime()) / (1000 * 3600 * 24) <= 3);
  const alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()));

  if (!user) return <div className="flex h-screen items-center justify-center font-bold text-gray-500">Carregando painel...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tighter">Dashboard</h1>
            <p className="text-gray-500 font-medium mt-1">Bem-vindo, veja as movimentações de hoje.</p>
          </div>
          <button onClick={() => router.push('/dashboard/adicionar-aluno')} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all active:scale-[0.98]">
            + Adicionar Aluno
          </button>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Faturamento Mês</h2>
            <p className="text-3xl font-black text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMes)}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Total Alunos</h2>
            <p className="text-3xl font-black text-gray-900">{alunos.length}</p>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <AgendaGeral />
          </div>
        </div>

        {/* Cobranças */}
        {alunosVencendo.length > 0 && (
          <div className="p-8 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-200">
            <h2 className="font-bold text-sm mb-5 flex items-center gap-2">⚠️ Vencendo nos próximos 3 dias</h2>
            <div className="flex flex-wrap gap-3">
              {alunosVencendo.map(aluno => (
                <button key={aluno.id} onClick={() => { setAlunoSelecionado(aluno); setIsModalOpen(true); }} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/10">
                  {aluno.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabela */}
        <section className="bg-white shadow-sm border border-gray-100 rounded-3xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center">
            <input className="w-full text-sm outline-none placeholder:text-gray-400" placeholder="Filtrar alunos por nome..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
              <tr>
                <th className="px-8 py-4">Nome</th>
                <th className="px-8 py-4 hidden md:table-cell">Objetivo</th>
                <th className="px-8 py-4 text-right">Progresso</th> 
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alunosFiltrados.map((aluno) => (
                <tr key={aluno.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6 font-bold text-blue-600 cursor-pointer hover:text-blue-800" onClick={() => router.push(`/dashboard/aluno/${aluno.id}`)}>{aluno.nome}</td>
                  <td className="px-8 py-6 text-sm text-gray-600 hidden md:table-cell">{aluno.objetivo}</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => router.push(`/dashboard/aluno/${aluno.id}/progresso`)} className="bg-gray-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* Modal Pagamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="font-bold text-lg mb-6">Receber de {alunoSelecionado?.nome}</h2>
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