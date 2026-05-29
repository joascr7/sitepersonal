'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ControleFinanceiro({ alunoId, initialStatus }: { alunoId: string, initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    setLoading(true);
    const novoStatus = status === 'ativo' ? 'bloqueado' : 'ativo';
    
    const { error } = await supabase
      .from('alunos')
      .update({ status_pagamento: novoStatus })
      .eq('id', alunoId);

    if (!error) {
      setStatus(novoStatus);
    } else {
      alert("Erro ao atualizar status");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-6">
      <div className="flex justify-between items-center">
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">
            Status Financeiro
          </label>
          <p className={`font-bold text-sm ${status === 'ativo' ? 'text-green-600' : 'text-red-600'}`}>
            {status === 'ativo' ? '✅ Acesso Liberado' : '🔒 Acesso Bloqueado'}
          </p>
        </div>
        <button 
          onClick={toggleStatus}
          disabled={loading}
          className={`px-6 py-3 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
            status === 'ativo' 
              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          {loading ? '...' : status === 'ativo' ? 'Bloquear Acesso' : 'Liberar Acesso'}
        </button>
      </div>
    </div>
  );
}