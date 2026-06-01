import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const body = await req.json();
    const paymentId = body.data?.id;
    const type = body.type;

    if (type !== "payment" || !paymentId) return new Response("OK", { status: 200 });

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` }
    });
    
    const paymentData = await response.json();
    if (paymentData.status !== 'approved') return new Response("OK - Não aprovado", { status: 200 });

    const ref = paymentData.external_reference || "";

    // FILTRO DE SEGURANÇA: Só processa se for para o Admin
    if (ref.startsWith("PERSONAL_")) {
      const personalId = ref.replace("PERSONAL_", "");
      
      const dataVencimento = new Date();
      dataVencimento.setUTCDate(dataVencimento.getUTCDate() + 30);
      
      // 1. Atualiza status do Personal
      const { error: updateError } = await supabase
        .from('personais')
        .update({ 
          status_pagamento: 'ativo',
          vencimento_plano: dataVencimento.toISOString().split('T')[0] // Formato YYYY-MM-DD
        })
        .eq('id', personalId);

      if (updateError) throw updateError;

      // 2. Registra no financeiro
      await supabase.from('financeiro').insert([{ 
        personal_id: personalId,
        valor: paymentData.transaction_amount,
        data_pagamento: new Date().toISOString()
      }]);

      console.log(`SUCESSO: Personal ${personalId} renovado via webhook.`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Erro no Webhook Admin:", error);
    return new Response("Erro", { status: 500 });
  }
});