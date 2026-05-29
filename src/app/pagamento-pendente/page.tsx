'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function PagamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const motivo = searchParams.get('motivo');
  
  const [loading, setLoading] = useState(true);
  const [personal, setPersonal] = useState<any>(null);
  const [alunoId, setAlunoId] = useState<string | null>(null); // CORREÇÃO: Estado definido aqui
  const [error, setError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      // CORREÇÃO: Agora salvamos o ID no estado para usar no handleMercadoPago
      setAlunoId(session.user.id);

      const { data: alunoData, error: dbError } = await supabase
        .from('alunos')
        .select(`
          status_pagamento, 
          personais(id, chave_pix, mp_access_token, modo_pagamento)
        `)
        .eq('id', session.user.id)
        .single();

      if (dbError || !alunoData || !alunoData.personais) {
        console.error("Erro na busca:", dbError);
        setError(true);
        setLoading(false);
        return;
      }

      setPersonal(alunoData.personais);
      setLoading(false);
    };

    init();
  }, [router]);

  const handleMercadoPago = async () => {
  // 1. Validação de segurança dos dados carregados
  if (!alunoId || !personal?.id) {
    alert("Dados de pagamento não carregados. Recarregue a página.");
    return;
  }
  
  setIsProcessing(true);
  
  try {
    // 2. Busca o token de sessão atual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) throw new Error("Sessão expirada. Faça login novamente.");

    // 3. Chamada à Edge Function utilizando o valor vindo do banco (personal.valor_mensalidade)
    const response = await fetch('https://caaxbbnikrtuzkdrkkqz.supabase.co/functions/v1/criar-pagamento', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}` 
      },
      body: JSON.stringify({
        alunoId: alunoId,
        // O valor agora é dinâmico, garantindo que cada personal cobre o seu preço
        valor: parseFloat(personal.valor_mensalidade) || 150.00, 
        personalId: personal.id 
      }),
    });
    
    // 4. Tratamento de erro detalhado
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro de conexão (${response.status})`);
    }
    
    const data = await response.json();
    
    // 5. Redirecionamento para o gateway de pagamento
    if (data.init_point) {
      window.location.href = data.init_point;
    } else {
      throw new Error("O gateway de pagamento não retornou o link.");
    }
  } catch (err: any) {
    console.error("Erro técnico no pagamento:", err);
    alert(err.message);
    setIsProcessing(false);
  }
};

  if (loading) return <div className="text-gray-500 font-black tracking-widest uppercase text-xs animate-pulse">Carregando...</div>;
  
  if (error || !personal) return (
    <div className="text-white text-center p-6">
      <h2 className="text-lg font-black uppercase tracking-widest mb-2">Atenção</h2>
      <p className="text-gray-400 text-sm">Não foi possível carregar os dados de pagamento. Verifique seu vínculo com o treinador.</p>
    </div>
  );

  const modoImediatoAtivo = personal.modo_pagamento === 'imediata' && personal.mp_access_token;

  return (
    <div className="max-w-md w-full text-center">
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tighter mb-3">Acesso Suspenso</h1>
        <p className="text-gray-400 font-medium text-sm tracking-wide leading-relaxed">
          {motivo === 'vencido' ? "Seu plano expirou." : "Identificamos uma pendência no seu plano."}
        </p>
      </div>

      {modoImediatoAtivo ? (
        <div className="bg-blue-600 p-8 rounded-3xl mb-8 shadow-2xl">
          <p className="text-white font-bold mb-6">Pague agora para liberação automática.</p>
          <button 
            onClick={handleMercadoPago} 
            disabled={isProcessing}
            className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            {isProcessing ? "Processando..." : "Pagar com Mercado Pago"}
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl mb-8 shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-6">Dados PIX</p>
          <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 font-mono text-sm text-blue-400 mb-6 break-all">
            {personal.chave_pix || 'Chave não configurada'}
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(personal.chave_pix || '')}
            className="w-full py-4 bg-white text-gray-950 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
          >
            Copiar Chave PIX
          </button>
        </div>
      )}
      <button onClick={() => window.location.reload()} className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-all">
        ← Verificar pagamento
      </button>
    </div>
  );
}

export default function PagamentoPendente() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-white">
      <Suspense fallback={<div className="animate-pulse text-gray-500">Carregando...</div>}>
        <PagamentoContent />
      </Suspense>
    </main>
  );
}