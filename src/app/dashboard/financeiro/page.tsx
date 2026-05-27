'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Financeiro() {
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPagamentos();
  }, []);

  const fetchPagamentos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('pagamentos')
      .select(`
        id, 
        valor, 
        data_pagamento, 
        alunos!inner(nome, personal_id)
      `)
      .eq('alunos.personal_id', user.id)
      .order('data_pagamento', { ascending: false });

    if (data) {
      setPagamentos(data);
      const total = data.reduce((acc, curr) => acc + Number(curr.valor), 0);
      setTotalGeral(total);
    }
    setLoading(false);
  };

  if (loading) return <main className="p-10 text-center text-gray-500">Carregando dados financeiros...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-10 tracking-tight">Relatório Financeiro</h1>
        
        {/* Card de Faturamento */}
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 mb-10">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Acumulado (Histórico)</h2>
          <p className="text-5xl font-black text-gray-900 tracking-tighter">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral)}
          </p>
        </div>

        {/* Lista de Registros */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <h2 className="font-black text-xl text-gray-900">Histórico Completo</h2>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
              <tr>
                <th className="p-6">Aluno</th>
                <th className="p-6">Data</th>
                <th className="p-6 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition">
                  <td className="p-6 font-bold text-gray-900">{p.alunos?.nome || 'Aluno Removido'}</td>
                  <td className="p-6 text-sm text-gray-600">
                    {p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-6 text-right font-black text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.valor))}
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