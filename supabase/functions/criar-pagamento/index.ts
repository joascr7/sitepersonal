import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Lida com preflight requests do navegador
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Recebe os dados enviados pelo seu front-end (PagamentoAntecipar)
    const body = await req.json();
    const { alunoId, valor, personalId } = body;

    // Log para depuração (verifique no painel do Supabase)
    console.log("Processando criação de pagamento para:", { alunoId, personalId });

    // 1. Busca o token do Personal no banco
    const { data: personal, error: personalError } = await supabase
      .from('personais')
      .select('mp_access_token')
      .eq('id', personalId)
      .single();

    if (personalError || !personal?.mp_access_token) {
      return new Response(JSON.stringify({ error: "Token não configurado" }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
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
        // O external_reference é crucial para o webhook funcionar
        external_reference: String(alunoId), 
        back_urls: { 
          success: `https://aurafit.usoprime.com/aluno/${alunoId}`,
          failure: `https://aurafit.usoprime.com/aluno/antecipar`
        },
        auto_return: "approved"
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro na API do Mercado Pago:", data);
      return new Response(JSON.stringify({ error: "Erro ao criar preferência", details: data }), { 
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ init_point: data.init_point }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (err) {
    console.error("Erro fatal no servidor:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});