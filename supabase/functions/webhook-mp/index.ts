import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const url = new URL(req.url);
  const paymentId = url.searchParams.get("data.id");
  const topic = url.searchParams.get("topic");

  if (topic === "payment" && paymentId) {
    // 1. Busca os dados do pagamento no Mercado Pago
    // Nota: Como não temos o token do personal aqui, o ideal é usar uma conta global ou buscar
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN_GLOBAL')}` }
    });
    
    const payment = await response.json();

    // 2. Se aprovado, libera o aluno usando o external_reference
    if (payment.status === 'approved') {
      await supabase
        .from('alunos')
        .update({ status_pagamento: 'ativo' })
        .eq('id', payment.external_reference); // Esse é o alunoId que enviamos antes
    }
  }

  return new Response("OK", { status: 200 });
});