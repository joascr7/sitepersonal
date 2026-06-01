import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const body = await req.json();
  
  // 1. Log para debug no painel do Supabase
  console.log("Evento recebido:", body.type, "ID:", body.data?.id);

  // 2. Lógica de Assinatura (Renovação ou Criação)
  if (body.type === "subscription_preapproval") {
    const subId = body.data.id;

    // Busca os detalhes da assinatura no Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
      headers: { 
        "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` 
      }
    });

    const subData = await response.json();

    // Se o status for 'authorized', o pagamento foi processado com sucesso
    if (subData.status === 'authorized') {
      const personalId = subData.external_reference; // Certifique-se de enviar isso na criação

      // Atualiza o vencimento do plano para +30 dias a partir de hoje
      const novoVencimento = new Date();
      novoVencimento.setDate(novoVencimento.getDate() + 30);

      await supabase
        .from('personais')
        .update({ 
          status_pagamento: 'ativo',
          vencimento_plano: novoVencimento.toISOString() 
        })
        .eq('id', personalId);
        
      console.log(`Assinatura ${subId} renovada para o personal ${personalId}`);
    }
  }

  // 3. (Opcional) Lógica de Pagamentos Únicos
  else if (body.type === "payment") {
    // Aqui entra o código que você já usa para os seus pagamentos únicos
  }

  return new Response("OK", { status: 200 });
});