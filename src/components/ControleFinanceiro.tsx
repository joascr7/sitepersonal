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
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mt-8">
      {/* Header do Widget */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Política de Acesso
        </h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status === 'ativo' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
            {status === 'ativo' ? 'Ativo' : 'Restrito'}
          </span>
        </div>
      </div>

      {/* Conteúdo do Widget */}
      <div className="p-6 flex items-center justify-between gap-8">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-gray-900">
            {status === 'ativo' ? 'Acesso total concedido' : 'Acesso bloqueado por inadimplência'}
          </p>
          <p className="text-xs text-gray-500 max-w-[300px]">
            {status === 'ativo' 
              ? 'O aluno possui permissões completas no sistema e app.' 
              : 'O acesso a treinos e métricas está temporariamente desativado.'}
          </p>
        </div>

        <button 
          onClick={toggleStatus}
          disabled={isProcessing}
          className={`px-5 py-2.5 rounded text-[11px] font-bold uppercase tracking-widest border transition-all duration-200 
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            ${status === 'ativo' 
              ? 'border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600' 
              : 'border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50'}`}
        >
          {isProcessing ? 'Processando...' : status === 'ativo' ? 'Revogar Acesso' : 'Conceder Acesso'}
        </button>
      </div>
    </section>
  );
}