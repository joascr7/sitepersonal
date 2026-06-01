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
    const { token, email, personalId } = await req.json();
    
    // Log para confirmar que recebemos os dados
    console.log("Processando:", { email, personalId, hasToken: !!token });

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
        external_reference: personalId
      })
    });

    const data = await response.json();

    // Se o MP retornar erro (ex: 400, 401, 403), vamos capturar aqui
    if (!response.ok) {
      console.error("ERRO DO MERCADO PAGO:", JSON.stringify(data));
      return new Response(JSON.stringify({ success: false, error: data }), {
        status: 200,
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