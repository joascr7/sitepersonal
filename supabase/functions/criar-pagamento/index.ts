import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { alunoId, valor, personalId } = await req.json();

  // 1. Busca o token do Personal no banco
  const { data: personal } = await supabase
    .from('personais')
    .select('mp_access_token')
    .eq('id', personalId)
    .single();

  if (!personal?.mp_access_token) {
    return new Response(JSON.stringify({ error: "Token não configurado" }), { 
      status: 400, headers: { ...corsHeaders } 
    });
  }

  // 2. Chama a API do Mercado Pago
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${personal.mp_access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ 
        title: "Mensalidade AuraFit", 
        quantity: 1, 
        unit_price: Number(valor) 
      }],
      // A mágica acontece aqui:
      // O external_reference liga esse pagamento ao ID do seu aluno no Supabase
      external_reference: alunoId, 
      back_urls: { 
        success: `https://aurafit.usoprime.com/aluno/${alunoId}`,
        failure: `https://aurafit.usoprime.com/pagamento-pendente`
      },
      auto_return: "approved"
    }),
  });

  const data = await response.json();

  return new Response(JSON.stringify({ init_point: data.init_point }), { 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
});