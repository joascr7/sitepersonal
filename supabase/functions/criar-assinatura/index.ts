import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, content-type' } 
    });
  }

  try {
    // Adicionamos 'cpf' e 'nome' para enviar ao MP
    const { token, email, personalId, nome, cpf } = await req.json();
    
    console.log("Processando pagamento seguro para:", email);

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        preapproval_plan_id: "a0a7aa35113046a6a7d7054adab9dfd7",
        payer_email: email,
        card_token_id: token,
        external_reference: personalId,
        // Adicionando dados de segurança para subir sua pontuação no painel
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 22.90,
          currency_id: "BRL"
        },
        payer: {
          email: email,
          identification: {
            type: "CPF",
            number: cpf
          }
        },
        // O Mercado Pago valoriza a descrição do que está sendo vendido
        reason: "Assinatura Mensal Premium AuraFit" 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("ERRO DO MERCADO PAGO:", JSON.stringify(data));
      return new Response(JSON.stringify({ success: false, error: data }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err: any) {
    console.error("ERRO NO CATCH:", err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});