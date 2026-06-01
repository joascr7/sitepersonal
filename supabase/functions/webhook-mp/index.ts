import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  // CORS para permitir Webhooks
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } 
    });
  }

  try {
    const body = await req.json();
    const paymentId = body.data?.id;
    const type = body.type;

    if (type !== "payment" || !paymentId) return new Response("OK - Evento ignorado", { status: 200 });

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` }
    });
    
    const paymentData = await response.json();
    if (paymentData.status !== 'approved') return new Response("OK - Pagamento não aprovado", { status: 200 });

    const ref = paymentData.external_reference || "";

    // LÓGICA DIFERENCIADA POR PREFIXO
    if (ref.startsWith("ALUNO_")) {
      const alunoId = ref.replace("ALUNO_", "");
      
      const { data: aluno } = await supabase.from('alunos')
        .select('data_vencimento, personal_id').eq('id', alunoId).single();

      if (!aluno) throw new Error("Aluno não encontrado");

      // Calcula 30 dias em UTC
      const baseDate = aluno.data_vencimento ? new Date(aluno.data_vencimento) : new Date();
      const novaData = new Date(Math.max(baseDate.getTime(), Date.now()));
      novaData.setUTCDate(novaData.getUTCDate() + 30);

      await supabase.from('alunos').update({ 
        status_pagamento: 'ativo',
        data_vencimento: novaData.toISOString().split('T')[0]
      }).eq('id', alunoId);

      await supabase.from('pagamentos').insert([{ 
        aluno_id: alunoId,
        valor: paymentData.transaction_amount,
        personal_id: aluno.personal_id,
        data_pagamento: new Date().toISOString()
      }]);

    } else if (ref.startsWith("PERSONAL_")) {
      // AQUI ENTRA A LÓGICA DO SEU WEBHOOK-ADMIN (PERSONAL PAGANDO A AURAFIT)
      const personalId = ref.replace("PERSONAL_", "");
      // Adicione aqui a lógica de renovação do Personal
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Erro no processamento:", error);
    return new Response("Erro", { status: 500 });
  }
});