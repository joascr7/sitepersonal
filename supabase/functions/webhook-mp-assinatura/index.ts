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

    const response = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
      headers: { "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` }
    });

    const subData = await response.json();

    if (subData.status === 'authorized') {
      let personalId = subData.external_reference;

      // 1. TENTA BUSCAR PELA TABELA DE PENDÊNCIAS (A MAIS SEGURA)
      const { data: pendencia } = await supabase
        .from('pendencias_pagamento')
        .select('user_id')
        .eq('checkout_id', personalId)
        .single();

      if (pendencia) {
        personalId = pendencia.user_id;
        console.log("ID recuperado via tabela de pendências:", personalId);
      } else {
        // 2. BACKUP: Validação de UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(personalId);
        if (!isUuid) personalId = null;

        // 3. BACKUP: Tenta por e-mail
        if (!personalId && subData.payer?.email) {
          const { data: personal } = await supabase
            .from('personais')
            .select('id')
            .eq('email', subData.payer.email)
            .single();
          if (personal) personalId = personal.id;
        }
      }

      // Finaliza o Update no banco
      if (personalId) {
        const novoVencimento = new Date();
        novoVencimento.setDate(novoVencimento.getDate() + 30);

        const { error } = await supabase
          .from('personais')
          .update({ 
            status_pagamento: 'ativo',
            vencimento_plano: novoVencimento.toISOString() 
          })
          .eq('id', personalId.trim());

        if (error) {
          console.error(`Erro ao atualizar personal ${personalId}:`, error);
        } else {
          console.log(`Sucesso: Assinatura ${subId} aplicada ao personal ${personalId}`);
        }
      } else {
        console.warn(`Falha: Nenhum ID encontrado para ${subId}`);
      }
    }
  }

  return new Response("OK", { status: 200 });
});