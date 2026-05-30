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
    const url = new URL(req.url);
    let paymentId;
    let type;

    // 1. Tenta ler o ID do pagamento com segurança
    try {
      const body = await req.json();
      paymentId = body.data?.id;
      type = body.type;
    } catch {
      paymentId = url.searchParams.get("data.id");
      type = url.searchParams.get("type");
    }

    if (type !== "payment" || !paymentId) {
      return new Response("OK - Evento ignorado", { status: 200 });
    }

    // 2. Busca detalhes no Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 
        "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`,
        "Content-Type": "application/json"
      }
    });
    
    const paymentData = await response.json();
    console.log(`Verificando pagamento ${paymentId}: Status ${paymentData.status}, Ref: ${paymentData.external_reference}`);

    // 3. Processa apenas se aprovado
    if (paymentData.status === 'approved') {
      const alunoId = paymentData.external_reference;
      
      if (!alunoId) {
        console.error("ERRO: O pagamento não possui um 'external_reference' (ID do Aluno).");
        return new Response("OK - Sem referência", { status: 200 });
      }

      // Busca dados atuais do aluno
      const { data: aluno, error: dbError } = await supabase
        .from('alunos')
        .select('data_vencimento')
        .eq('id', alunoId)
        .single();

      if (dbError) {
        console.error(`ERRO: Aluno ${alunoId} não encontrado no banco.`, dbError);
        throw dbError;
      }

      // 4. Calcula nova data (Lógica à prova de falhas)
      const vencimentoAtual = aluno?.data_vencimento ? new Date(aluno.data_vencimento) : new Date();
      const hoje = new Date();
      
      // Se a data do banco for futura, soma 30 dias nela. Se for passada, soma 30 dias a partir de hoje.
      let novaData = (vencimentoAtual > hoje) ? vencimentoAtual : hoje;
      novaData.setDate(novaData.getDate() + 30);

      // 5. Atualiza o banco
      const { error: updateError } = await supabase
        .from('alunos')
        .update({ 
          status_pagamento: 'ativo',
          data_vencimento: novaData.toISOString().split('T')[0]
        })
        .eq('id', alunoId);

      if (updateError) throw updateError;
      
      console.log(`SUCESSO: Aluno ${alunoId} renovado até ${novaData.toISOString().split('T')[0]}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Erro no processamento:", error);
    return new Response("Erro interno", { status: 500 });
  }
});