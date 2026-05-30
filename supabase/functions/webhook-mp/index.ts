import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    });
  }

  try {
    const body = await req.json();
    const paymentId = body.data?.id;

    if (body.type === "payment" && paymentId) {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 
          "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`,
          "Content-Type": "application/json"
        }
      });
      
      const payment = await payment.json();

      if (payment.status === 'approved') {
        const alunoId = payment.external_reference;
        
        if (alunoId) {
          // 1. Busca os dados atuais do aluno
          const { data: aluno } = await supabase
            .from('alunos')
            .select('data_vencimento')
            .eq('id', alunoId)
            .single();

          // 2. Calcula a nova data: se já passou do vencimento, usa hoje + 30.
          // Se ainda não venceu, usa o vencimento atual + 30.
          const vencimentoAtual = aluno?.data_vencimento ? new Date(aluno.data_vencimento) : new Date();
          const hoje = new Date();
          
          let novaData = (vencimentoAtual > hoje) ? vencimentoAtual : hoje;
          novaData.setDate(novaData.getDate() + 30);

          // 3. Atualiza o banco
          await supabase
            .from('alunos')
            .update({ 
              status_pagamento: 'ativo',
              data_vencimento: novaData.toISOString().split('T')[0] // Formato YYYY-MM-DD
            })
            .eq('id', alunoId);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response("Erro interno", { status: 500 });
  }
});