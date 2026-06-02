import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const body = await req.json();
  console.log("Evento recebido:", body.type, "ID:", body.data?.id);

  if (body.type === "subscription_preapproval") {
    const subId = body.data.id;

    // Busca detalhes da assinatura no Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
      headers: { "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` }
    });
    const subData = await response.json();

    console.log("JSON recebido do MP:", JSON.stringify(subData));

    if (subData.status === 'authorized') {
      let userIdReal = null;

      // 1. TENTA RECUPERAR PELO EXTERNAL_REFERENCE (checkout_id)
      if (subData.external_reference) {
        const { data: pendencia } = await supabase
          .from('pendencias_pagamento')
          .select('user_id')
          .eq('checkout_id', subData.external_reference)
          .single();
        if (pendencia) userIdReal = pendencia.user_id;
      }

      // 2. TENTA BUSCAR PELO E-MAIL DO COMPRADOR
      if (!userIdReal && subData.payer?.email) {
        const { data: personal } = await supabase
          .from('personais')
          .select('id')
          .eq('email', subData.payer.email)
          .single();
        if (personal) userIdReal = personal.id;
      }
      
      // 3. NOVO: SE AINDA FALHAR, TENTA PELO PAGADOR ID (Muitas vezes o ID do MP é único)
      if (!userIdReal && subData.payer?.id) {
         // Opcional: Se você tiver uma tabela que armazena o payer_id do MP
         console.log("Payer ID encontrado:", subData.payer.id);
      }

      // 4. ATUALIZA O BANCO
      if (userIdReal) {
        const vencimento = new Date();
        vencimento.setDate(vencimento.getDate() + 30);

        const { error } = await supabase
          .from('personais')
          .update({ 
            status_pagamento: 'ativo',
            vencimento_plano: vencimento.toISOString() 
          })
          .eq('id', userIdReal);
          
        if (error) {
          console.error("Erro ao atualizar banco:", error);
        } else {
          console.log(`Sucesso: Assinatura vinculada ao usuário ${userIdReal}`);
        }
      } else {
        console.error("Falha fatal: Não foi possível identificar o usuário. Verifique se o e-mail no Supabase é idêntico ao do pagamento.");
      }
    }
  }

  return new Response("OK", { status: 200 });
});