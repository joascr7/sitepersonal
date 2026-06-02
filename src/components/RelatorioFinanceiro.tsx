'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RelatorioFinanceiro() {
  const [pagamentos, setPagamentos] = useState<any[]>([]);

  useEffect(() => {
    const fetchPagamentos = async () => {
      const { data } = await supabase
        .from('financeiro')
        .select('*, personais(nome)')
        .order('data_pagamento', { ascending: false });
      
      setPagamentos(data || []);
    };
    fetchPagamentos();
  }, []);

  const formatarMes = (data: string) => {
    const d = new Date(data);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mt-10">
      <h2 className="font-black text-white text-lg mb-8 tracking-tighter">Relatório de Receitas</h2>
      <div className="space-y-4">
        {pagamentos.length > 0 ? (
          pagamentos.map((p) => (
            <div key={p.id} className="flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
              <div>
                <p className="font-bold text-sm text-white">{p.personais?.nome || 'Usuário Removido'}</p>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{formatarMes(p.data_pagamento)}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-neutral-600 font-bold uppercase tracking-widest text-xs py-10">
            Nenhum registro encontrado.
          </p>
        )}
      </div>
    </div>
  );
}