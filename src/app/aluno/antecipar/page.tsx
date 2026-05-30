'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function PaginaAntecipar() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [personal, setPersonal] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data, error } = await supabase
        .from('alunos')
        .select(`
          status_pagamento, 
          personais(id, chave_pix, valor_mensalidade, modo_pagamento)
        `)
        .eq('id', session.user.id)
        .single();

      if (!error && data) {
        setPersonal(data.personais);
      }
      setLoading(false);
    };
    carregarDados();
  }, [router]);

  // Lógica para Mercado Pago Automático
  const handleMercadoPago = async () => {
    setIsProcessing(true);
    try {
      // Forçamos a busca da sessão exatamente no momento do clique
      const { data: { session } } = await supabase.auth.getSession();
      
      // DEBUG: Se isso imprimir 'undefined' no console do navegador (F12), o problema é a autenticação
      console.log("ID da sessão para envio:", session?.user.id);
      
      if (!session?.user.id) {
        alert("Erro: Você não está logado!");
        return;
      }

      const response = await fetch('https://caaxbbnikrtuzkdrkkqz.supabase.co/functions/v1/criar-pagamento', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          alunoId: session.user.id, // ID extraído diretamente da sessão
          personalId: personal.id,  
          valor: personal.valor_mensalidade 
        })
      });
      
      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("Erro do servidor: " + (data.error || "Tente novamente"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };
  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Carregando...</div>;

  return (
    <main className="min-h-screen bg-gray-950 p-6 flex flex-col items-center justify-center text-white">
      <div className="max-w-sm w-full space-y-6">
        <h1 className="text-2xl font-black">Renovação de Plano</h1>
        
        <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 space-y-4">
           <p className="text-gray-400 text-sm font-bold">Valor: R$ {parseFloat(personal?.valor_mensalidade).toFixed(2).replace('.', ',')}</p>
           
           {personal?.modo_pagamento === 'imediata' ? (
             <button 
               onClick={handleMercadoPago} 
               disabled={isProcessing}
               className="w-full py-4 bg-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all"
             >
               {isProcessing ? "Gerando..." : "Pagar via Pix Automático"}
             </button>
           ) : (
             <div className="space-y-3">
                <code className="block bg-black p-4 rounded-xl text-blue-400 text-xs break-all">{personal?.chave_pix}</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(personal?.chave_pix)}
                  className="w-full py-3 bg-white text-gray-950 rounded-xl font-bold text-xs uppercase"
                >
                  Copiar Chave PIX
                </button>
             </div>
           )}
        </div>

        <button 
  onClick={async () => { // Adicione 'async' aqui
    // Adicione o 'await' antes da função
    const { data } = await supabase.auth.getSession();
    
    // Acesse a session com segurança
    const session = data?.session;

    if (session?.user.id) {
      router.push(`/aluno/${session.user.id}`);
    } else {
      router.push('/'); 
    }
  }} 
  className="w-full text-xs font-bold text-gray-500 hover:text-white"
>
  Voltar para Perfil
</button>
      </div>
    </main>
  );
}