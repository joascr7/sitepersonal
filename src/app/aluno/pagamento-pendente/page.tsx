'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function PagamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const motivo = searchParams.get('motivo'); // 'vencido' ou 'renovacao'
  
  const [loading, setLoading] = useState(true);
  const [personal, setPersonal] = useState<any>(null);
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setAlunoId(session.user.id);

      const { data: alunoData, error: dbError } = await supabase
        .from('alunos')
        .select(`
          status_pagamento, 
          personais(id, chave_pix, mp_access_token, modo_pagamento, valor_mensalidade)
        `)
        .eq('id', session.user.id)
        .single();

      if (!dbError && alunoData?.personais) {
        setPersonal(alunoData.personais);
      }
      setLoading(false);
    };
    init();
  }, [router]);

  // Polling para redirecionar automaticamente assim que o status mudar no banco
  useEffect(() => {
  if (!alunoId) return;

  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('alunos')
      .select('status_pagamento')
      .eq('id', alunoId)
      .single();

    // Só redireciona se o status for realmente 'ativo'
    // E evitamos o loop verificando se já não estamos tentando navegar
    if (data?.status_pagamento === 'ativo') {
      clearInterval(interval); // Mata o timer antes de mudar a rota
      router.push(`/aluno/${alunoId}`);
    }
  }, 5000);

  return () => clearInterval(interval);
}, [alunoId, router]);

  const handleMercadoPago = async () => {
    if (!alunoId || !personal?.id) return;
    setIsProcessing(true);
    setStatusMessage("Conectando com Mercado Pago...");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      const response = await fetch('https://caaxbbnikrtuzkdrkkqz.supabase.co/functions/v1/criar-pagamento', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          alunoId: alunoId,
          valor: parseFloat(personal.valor_mensalidade) || 150.00, 
          personalId: personal.id 
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao gerar pagamento.");
      if (data.init_point) window.location.href = data.init_point;
    } catch (err: any) {
      console.error(err);
      setStatusMessage("Erro ao iniciar pagamento. Tente novamente.");
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="text-gray-500 font-bold animate-pulse text-center">Sincronizando...</div>;

  return (
    <div className="max-w-md w-full text-center p-6">
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tighter mb-3">
          {motivo === 'vencido' ? "Acesso Suspenso" : "Renovação de Plano"}
        </h1>
        <p className="text-gray-400 font-medium text-sm">
          {motivo === 'vencido' 
            ? "Seu plano expirou. Regularize para continuar." 
            : "Seu plano vence em breve. Renove para garantir mais 30 dias."}
        </p>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 bg-gray-900 border border-gray-800 rounded-2xl text-xs font-bold text-blue-400">
          {statusMessage}
        </div>
      )}

      {personal?.modo_pagamento === 'imediata' ? (
        <div className="bg-blue-600 p-8 rounded-3xl mb-8 shadow-2xl">
          <p className="text-white font-bold mb-6">
            {motivo === 'vencido' ? "Pague agora para liberação imediata." : "Pague agora para adicionar +30 dias ao seu plano."}
          </p>
          <button 
            onClick={handleMercadoPago} 
            disabled={isProcessing}
            className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            {isProcessing ? "Processando..." : `Pagar R$ ${parseFloat(personal.valor_mensalidade || 150).toFixed(2).replace('.', ',')}`}
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl mb-8">
          <p className="text-[10px] font-black uppercase text-gray-500 mb-4">Dados PIX</p>
          <code className="block bg-black p-4 rounded-xl text-blue-400 text-sm mb-4 break-all">{personal?.chave_pix || 'Configurando...'}</code>
          <button 
            onClick={() => navigator.clipboard.writeText(personal?.chave_pix || '')}
            className="w-full py-3 bg-white text-gray-950 rounded-2xl font-bold text-sm"
          >
            Copiar Chave PIX
          </button>
        </div>
      )}

      <button onClick={() => window.location.reload()} className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-all">
        ← Já realizei o pagamento
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