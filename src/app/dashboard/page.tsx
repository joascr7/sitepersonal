'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AgendaGeral from '@/components/AgendaGeral'; 
import LogoutButton from '@/components/LogoutButton';

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
      if (!data.session) {
        router.push('/');
      } else {
        setUser(data.session.user);
        fetchAlunos(data.session.user.id);
        fetchFinanceiro(data.session.user.id);
      }
    };
    checkUser();
  }, [router]);

  const fetchAlunos = async (personalId: string) => {
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .eq('personal_id', personalId)
      .order('nome');
    if (data) setAlunos(data);
  };

  const fetchFinanceiro = async (personalId: string) => {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

    const { data } = await supabase
      .from('pagamentos')
      .select('valor, data_pagamento')
      .eq('personal_id', personalId)
      .gte('data_pagamento', primeiroDiaMes);
    
    if (data) {
      const total = data.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
      setTotalMes(total);
    }
  };

  const processarPagamento = async () => {
    if (!alunoSelecionado || !valorPago) return;
    try {
      const { error: pagError } = await supabase.from('pagamentos').insert([{ 
        aluno_id: alunoSelecionado.id, 
        valor: parseFloat(valorPago),
        personal_id: user.id 
      }]);
      if (pagError) throw pagError;
      
      const novaData = new Date();
      novaData.setDate(novaData.getDate() + 30);
      const dataFormatada = novaData.toISOString().split('T')[0];

      await supabase.from('alunos').update({ data_vencimento: dataFormatada }).eq('id', alunoSelecionado.id);

      setAlunos(prev => prev.map(a => a.id === alunoSelecionado.id ? { ...a, data_vencimento: dataFormatada } : a));
      fetchFinanceiro(user.id);
      setIsModalOpen(false);
      setValorPago('');
    } catch (err: any) {
      alert("Erro ao registrar: " + err.message);
    }
  };

  const hoje = new Date();
  const alunosVencendo = alunos.filter(a => a.data_vencimento && (new Date(a.data_vencimento).getTime() - hoje.getTime()) / (1000 * 3600 * 24) <= 3);
  const alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()));

  if (!user) return <main className="p-10 text-center text-gray-500">Carregando painel...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Modal de Pagamento */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-xl border border-gray-100">
              <h2 className="font-black text-xl mb-6">Pagamento: {alunoSelecionado?.nome}</h2>
              <input 
                type="number" 
                className="w-full p-4 border border-gray-200 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-gray-900" 
                placeholder="Valor pago (R$)" 
                value={valorPago} 
                onChange={(e) => setValorPago(e.target.value)} 
              />
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 p-4 bg-gray-100 rounded-xl font-bold">Cancelar</button>
                <button onClick={processarPagamento} className="flex-1 p-4 bg-gray-900 text-white rounded-xl font-bold">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          <LogoutButton />
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Mês</h2>
            <p className="text-4xl font-black text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMes)}
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Alunos Ativos</h2>
            <p className="text-4xl font-black text-gray-900">{alunos.length}</p>
          </div>
          <AgendaGeral />
        </div>

        {/* Cobranças Próximas */}
        {alunosVencendo.length > 0 && (
          <div className="mb-10 p-8 bg-blue-50 border border-blue-100 rounded-3xl">
            <h2 className="font-black text-blue-900 mb-6 text-lg">⚠️ Cobranças Próximas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alunosVencendo.map(aluno => (
                <div key={aluno.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-blue-100">
                  <p className="font-bold text-sm">{aluno.nome}</p>
                  <button onClick={() => { setAlunoSelecionado(aluno); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.98]">
                    Registrar Pagamento
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        

        {/* Tabela de Alunos */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-black text-xl text-gray-900">Meus Alunos</h2>
            <div className="flex gap-3">
              <input 
                className="p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900" 
                placeholder="Buscar..." 
                value={busca} 
                onChange={(e) => setBusca(e.target.value)} 
              />
              <button onClick={() => router.push('/dashboard/adicionar-aluno')} className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-black transition-all active:scale-[0.98]">
                + Novo Aluno
              </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
  <tr>
    <th className="p-6">Nome</th>
    <th className="p-6">Objetivo</th>
    <th className="p-6 text-center">Ações</th> 
  </tr>
</thead>
            <tbody>
  {alunosFiltrados.map((aluno) => (
    <tr key={aluno.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition">
      <td className="p-6 font-bold">
        <a href={`/dashboard/aluno/${aluno.id}`} className="text-blue-600 hover:underline">
          {aluno.nome}
        </a>
      </td>
      <td className="p-6 text-sm text-gray-600">{aluno.objetivo}</td>
      <td className="p-6 text-center">
        {/* Botão de Progresso */}
        <button 
  onClick={() => router.push(`/dashboard/aluno/${aluno.id}/progresso`)}
  className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-[0.98]"
>
  Progresso
</button>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </div>
    </main>
  );
}