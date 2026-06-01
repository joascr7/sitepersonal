'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function HistoricoPagamentos({ personalId }: { personalId: string }) {
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    const carregarHistorico = async () => {
      const { data } = await supabase
        .from('financeiro')
        .select('*')
        .eq('personal_id', personalId)
        .order('data_pagamento', { ascending: false }); // Mostra o mais recente primeiro
      
      setHistorico(data || []);
    };
    carregarHistorico();
  }, [personalId]);

  return (
    <div className="mt-6 bg-white p-6 rounded-2xl border">
      <h3 className="font-black text-lg mb-4">Histórico de Pagamentos</h3>
      <div className="space-y-3">
        {historico.length > 0 ? historico.map((p) => (
          <div key={p.id} className="flex justify-between border-b pb-2 text-sm">
            <span className="font-bold">R$ {p.valor}</span>
            <span className="text-gray-500">
              {new Date(p.data_pagamento).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )) : <p className="text-xs text-gray-400">Nenhum pagamento registrado.</p>}
      </div>
    </div>
  );
}