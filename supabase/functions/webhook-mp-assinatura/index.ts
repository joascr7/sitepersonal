import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function liberarAcesso(personalId: string) {
  const novoVencimento = new Date();
  novoVencimento.setDate(novoVencimento.getDate() + 30);

  const { error } = await supabase
    .from('personais')
    .update({ 
      status_pagamento: 'ativo',
      vencimento_plano: novoVencimento.toISOString() 
    })
    .eq('id', personalId);
  
  if (error) throw error;
  console.log("SUCESSO: Acesso liberado no banco para:", personalId);
}

serve(async (req) => {
  const body = await req.json();
  const action = body.action;
  const objectId = body.data?.id;

  console.log("--- EVENTO RECEBIDO --- Action:", action, "ID:", objectId);

  if (action === "payment.created") {
    console.log("Processando pagamento:", objectId);
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${objectId}`, {
      headers: { "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` }
    });
    const payData = await response.json();

    console.log("Status do pagamento no MP:", payData.status);
    console.log("External reference:", payData.external_reference);

    // O status precisa ser 'approved'
    if (payData.status === 'approved') {
      const personalId = payData.external_reference;
      if (personalId) {
        await liberarAcesso(personalId);
      } else {
        console.warn("ALERTA: Pagamento aprovado, mas sem personalId.");
      }
    } else {
      console.log("Pagamento ainda não foi aprovado. Status atual:", payData.status);
    }
  }

  return new Response("OK", { status: 200 });
});