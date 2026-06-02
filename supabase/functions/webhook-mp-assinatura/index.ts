import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const body = await req.json();
  console.log("Evento recebido:", body.type, "ID:", body.data?.id);

  // 1. Lógica de Assinatura
  if (body.type === "subscription_preapproval") {
    const subId = body.data.id;

    const response = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
      headers: { "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` }
    });

    const subData = await response.json();

    if (subData.status === 'authorized') {
      let personalId = subData.external_reference;

      if (!personalId && subData.payer_email) {
        const { data: personal } = await supabase
          .from('personais')
          .select('id')
          .eq('email', subData.payer_email)
          .single();
        if (personal) personalId = personal.id;
      }

      if (personalId) {
        const novoVencimento = new Date();
        novoVencimento.setDate(novoVencimento.getDate() + 30);

        await supabase
          .from('personais')
          .update({ 
            status_pagamento: 'ativo',
            vencimento_plano: novoVencimento.toISOString() 
          })
          .eq('id', personalId);
        console.log(`Sucesso: Assinatura ${subId} aplicada ao personal ${personalId}`);
      }
    }
  } 
  // 2. Lógica de Pagamentos Únicos (fora do IF anterior)
  else if (body.type === "payment") {
    console.log("Processando pagamento único...");
  }

  return new Response("OK", { status: 200 });
});