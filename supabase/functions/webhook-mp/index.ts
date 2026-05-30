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

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 
        "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`,
        "Content-Type": "application/json"
      }
    });
    
    const paymentData = await response.json();
    console.log(`Verificando pagamento ${paymentId}: Status ${paymentData.status}`);

    if (paymentData.status === 'approved') {
      const alunoId = paymentData.external_reference;
      if (!alunoId) return new Response("OK - Sem referência", { status: 200 });

      // 1. Busca dados do aluno (incluindo personal_id para o financeiro)
      const { data: aluno, error: dbError } = await supabase
        .from('alunos')
        .select('data_vencimento, personal_id')
        .eq('id', alunoId)
        .single();

      if (dbError) throw dbError;

      // 2. Calcula nova data
      const vencimentoAtual = aluno?.data_vencimento ? new Date(aluno.data_vencimento) : new Date();
      const hoje = new Date();
      let novaData = (vencimentoAtual > hoje) ? vencimentoAtual : hoje;
      novaData.setDate(novaData.getDate() + 30);

      // 3. Atualiza o status do aluno
      const { error: updateError } = await supabase
        .from('alunos')
        .update({ 
          status_pagamento: 'ativo',
          data_vencimento: novaData.toISOString().split('T')[0]
        })
        .eq('id', alunoId);

      if (updateError) throw updateError;

      // 4. CORREÇÃO: Registra no financeiro para o Dashboard somar
      const { error: financeError } = await supabase
        .from('pagamentos')
        .insert([{ 
          aluno_id: alunoId,
          valor: paymentData.transaction_amount,
          personal_id: aluno.personal_id, // Usamos o personal_id do aluno
          data_pagamento: new Date().toISOString()
        }]);

      if (financeError) console.error("Erro ao salvar no Financeiro:", financeError);
      
      console.log(`SUCESSO: Aluno ${alunoId} renovado e financeiro registrado.`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Erro no processamento:", error);
    return new Response("Erro interno", { status: 500 });
  }
});