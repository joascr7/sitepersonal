'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ControleFinanceiro({ alunoId, initialStatus }: { alunoId: string, initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleStatus = async () => {
    setIsProcessing(true);
    const novoStatus = status === 'ativo' ? 'bloqueado' : 'ativo';
    
    const { error } = await supabase
      .from('alunos')
      .update({ status_pagamento: novoStatus })
      .eq('id', alunoId);

    if (!error) {
      setStatus(novoStatus);
    }
    setIsProcessing(false);
  };

  return (
    <section className="bg-neutral-950/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden mt-8">
      {/* Header do Widget */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
          Política de Acesso
        </h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status === 'ativo' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {status === 'ativo' ? 'Ativo' : 'Restrito'}
          </span>
        </div>
      </div>

      {/* Conteúdo do Widget */}
      <div className="p-8 flex items-center justify-between gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-white">
            {status === 'ativo' ? 'Acesso total concedido' : 'Acesso bloqueado por inadimplência'}
          </p>
          <p className="text-[11px] text-neutral-500 max-w-[300px] leading-relaxed">
            {status === 'ativo' 
              ? 'O aluno possui permissões completas no sistema e app.' 
              : 'O acesso a treinos e métricas está temporariamente desativado.'}
          </p>
        </div>

        <button 
          onClick={toggleStatus}
          disabled={isProcessing}
          className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            ${status === 'ativo' 
              ? 'border-white/5 text-white hover:border-red-500/50 hover:text-red-400' 
              : 'border-blue-600/50 text-blue-400 hover:bg-blue-600/10'}`}
        >
          {isProcessing ? 'Processando...' : status === 'ativo' ? 'Revogar Acesso' : 'Conceder Acesso'}
        </button>
      </div>
    </section>
  );
}