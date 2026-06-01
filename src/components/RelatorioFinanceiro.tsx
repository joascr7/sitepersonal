'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RelatorioFinanceiro() {
  const [pagamentos, setPagamentos] = useState<any[]>([]);

  useEffect(() => {
    const fetchPagamentos = async () => {
      // Busca histórico unindo com dados do Personal
      const { data } = await supabase
        .from('financeiro')
        .select('*, personais(nome)')
        .order('data_pagamento', { ascending: false });
      
      setPagamentos(data || []);
    };
    fetchPagamentos();
  }, []);

  // Agrupamento simples por mês (ex: 05/2026)
  const formatarMes = (data: string) => {
    const d = new Date(data);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mt-10">
      <h2 className="font-black text-lg mb-6">Relatório de Receitas</h2>
      <div className="space-y-4">
        {pagamentos.map((p) => (
          <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-bold text-sm">{p.personais?.nome}</p>
              <p className="text-[10px] text-gray-500 uppercase">{formatarMes(p.data_pagamento)}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-emerald-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}