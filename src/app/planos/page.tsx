'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion'; 

export default function EscolherPlano() {
  const router = useRouter();
  const [valorPlano, setValorPlano] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from('configuracoes_pagamento')
        .select('valor_padrao')
        .limit(1)
        .single();
      
      setValorPlano(data?.valor_padrao || 22.90); // Fallback caso não encontre
      setLoading(false);
    };
    fetchConfig();
  }, []);

 const handleAssinar = () => {
  setIsRedirecting(true); // Bloqueia novos cliques e mostra carregando
  const linkPagamento = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=a0a7aa35113046a6a7d7054adab9dfd7";
  window.location.href = linkPagamento;
};

  return (
    <main className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4 md:p-8 selection:bg-indigo-500/30">
      
      {/* Efeito de fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-lg w-full bg-[#161921]/80 backdrop-blur-xl p-10 md:p-12 rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-[10px] font-bold tracking-[0.2em] text-indigo-400 uppercase bg-indigo-500/10 rounded-full border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Edição Enterprise
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">AuraFit Pro</h1>
          <p className="text-slate-400 leading-relaxed font-light">
            O ecossistema definitivo para a gestão de consultorias de alta performance.
          </p>
        </header>

        <div className="relative group bg-gradient-to-b from-white/[0.08] to-transparent p-8 rounded-[2rem] mb-10 border border-white/5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Mensalidade</p>
          <div className="flex items-baseline text-white">
            <span className="text-sm text-slate-500 mr-1">R$</span>
            {loading ? (
              <span className="h-10 w-24 bg-white/10 animate-pulse rounded-lg" />
            ) : (
              <span className="text-6xl font-black">{valorPlano?.toFixed(2).replace('.', ',')}</span>
            )}
            <span className="ml-2 font-medium text-slate-500">/ mês</span>
          </div>
        </div>

        <section className="mb-10 space-y-5">
          {[
            "Consultas e prescrições ilimitadas",
            "Dashboards de performance em tempo real",
            "Gestão inteligente de ciclos de treino",
            "Suporte técnico prioritário"
          ].map((feature, i) => (
            <div key={i} className="flex items-center text-slate-300">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-500/20 mr-4">
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[15px] font-light tracking-wide">{feature}</span>
            </div>
          ))}
        </section>

        <motion.button 
  whileHover={!isRedirecting ? { scale: 1.02 } : {}}
  whileTap={!isRedirecting ? { scale: 0.98 } : {}}
  onClick={handleAssinar}
  disabled={isRedirecting}
  className={`w-full p-5 rounded-2xl font-bold transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] 
    ${isRedirecting ? 'bg-slate-700 cursor-wait' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'}`}
>
  {isRedirecting ? "Redirecionando..." : "Assinar Agora"}
</motion.button>

        <footer className="mt-8 text-center">
          <div className="inline-flex items-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            <svg className="w-3.5 h-3.5 mr-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Checkout seguro com Mercado Pago
          </div>
        </footer>
      </div>
    </main>
  );
}