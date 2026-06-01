'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { supabase } from '@/lib/supabaseClient';

initMercadoPago('APP_USR-aa430b51-73fc-4c01-a415-07749a12c130');

// Interface para garantir tipagem forte e evitar erros de build
interface FormData {
  email: string;
  nome: string;
  cpf: string;
}

export default function PagamentoAssinatura() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const personalId = searchParams.get('id') || '00000000-0000-0000-0000-000000000000'; 
  
  const [loading, setLoading] = useState(false);
  const [valorPlano, setValorPlano] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({ email: '', nome: '', cpf: '' });

  useEffect(() => {
    supabase.from('configuracoes_pagamento').select('valor_padrao').limit(1).single()
      .then(({ data }) => setValorPlano(data?.valor_padrao || 22.90));
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch('https://caaxbbnikrtuzkdrkkqz.supabase.co/functions/v1/criar-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: data.token, 
          email: formData.email, 
          personalId, 
          valor: valorPlano 
        }),
      });
      
      const response = await res.json();
      if (response.success) {
        router.push('/dashboard');
      } else {
        alert("Pagamento negado: " + (response.error?.message || "Verifique seus dados"));
      }
    } catch {
      alert("Falha de conexão com servidor seguro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center p-6 selection:bg-blue-500/30">
      <div className="max-w-md w-full relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] opacity-20 blur group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-[#0f172a] p-8 rounded-[2rem] border border-white/10 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Checkout AuraFit</h1>
            <p className="text-slate-400 text-sm mt-1">Pagamento seguro via Mercado Pago</p>
          </div>

          <div className="space-y-4 mb-8">
            <input type="text" placeholder="Nome Completo" className="w-full p-4 bg-[#1e293b] rounded-2xl border border-white/5 text-white outline-none focus:border-blue-500/50 transition-all" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
            <div className="flex gap-4">
              <input type="email" placeholder="E-mail" className="w-full p-4 bg-[#1e293b] rounded-2xl border border-white/5 text-white outline-none focus:border-blue-500/50 transition-all" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <input type="text" placeholder="CPF" className="w-1/3 p-4 bg-[#1e293b] rounded-2xl border border-white/5 text-white outline-none focus:border-blue-500/50 transition-all" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} />
            </div>
          </div>

          <div className="bg-white/5 p-2 rounded-2xl border border-white/5">
            {valorPlano !== null ? (
             <CardPayment
  initialization={{ 
    amount: valorPlano,
    payer: { 
      email: formData.email,
      identification: { type: "CPF", number: formData.cpf }
    } 
  }}
  onSubmit={onSubmit}
  customization={{ 
    visual: { style: { theme: 'dark' } }
    // Remova a linha 'paymentMethods: { creditCard: "all" }' 
    // O SDK já assume todos os métodos por padrão se não forem especificados.
  }}
/>
            ) : (
              <div className="h-48 flex items-center justify-center text-blue-400/50 animate-pulse">Carregando gateway...</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}