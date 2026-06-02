'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function HistoricoPagamentos({ personalId }: { personalId: string }) {
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    const carregarHistorico = async () => {
      const { data } = await supabase
        .from('financeiro')
        .select('*')
        .eq('personal_id', personalId)
        .order('data_pagamento', { ascending: false });
      
      setHistorico(data || []);
    };
    carregarHistorico();
  }, [personalId]);

  return (
    <div className="mt-8 bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <h3 className="font-black text-white text-lg mb-8 tracking-tighter">Histórico de Pagamentos</h3>
      <div className="space-y-4">
        {historico.length > 0 ? historico.map((p) => (
          <div key={p.id} className="flex justify-between items-center p-4 border-b border-white/5 last:border-0 last:pb-0">
            <span className="font-black text-emerald-400 text-sm">
              R$ {Number(p.valor).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              {new Date(p.data_pagamento).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )) : (
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest text-center py-4">
            Nenhum pagamento registrado.
          </p>
        )}
      </div>
    </div>
  );
}