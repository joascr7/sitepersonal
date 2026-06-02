'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion'; // Requer: npm install framer-motion

function PaymentFormContent() {
  const searchParams = useSearchParams();
  const [valorPlano, setValorPlano] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('configuracoes_pagamento').select('valor_padrao').limit(1).single()
      .then(({ data }) => setValorPlano(data?.valor_padrao || 22.90));
  }, []);

  const handleAssinar = () => {
    const linkPagamento = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=a0a7aa35113046a6a7d7054adab9dfd7";
    window.location.href = linkPagamento;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-[#0b1120] p-8 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
    >
      {/* Background glow premium */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">AuraFit Pro</h1>
        <p className="text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest opacity-80">assinatura premium</p>
      </div>

      <div className="bg-[#111827] p-8 rounded-3xl border border-white/5 text-center shadow-inner">
        <span className="text-slate-400 text-sm">Valor mensal</span>
        <div className="text-white text-5xl font-black mb-8 mt-1 tracking-tighter">
          {valorPlano ? `R$ ${valorPlano.toFixed(2)}` : <span className="animate-pulse">...</span>}
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAssinar}
          className="w-full p-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
        >
          Assinar Agora
        </motion.button>
        
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" /></svg>
          Ambiente 100% seguro via Mercado Pago
        </div>
      </div>
    </motion.div>
  );
}

export default function PagamentoAssinatura() {
  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="max-w-md w-full relative">
        <Suspense fallback={<div className="text-white">Carregando...</div>}>
          <PaymentFormContent />
        </Suspense>
      </div>
    </main>
  );
}