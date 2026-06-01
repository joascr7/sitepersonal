import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Tratamento de requisições OPTIONS (CORS)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const { personalId, valor } = body;

    // Validação básica
    if (!personalId || !valor) {
      return new Response(JSON.stringify({ error: "Dados incompletos (personalId ou valor ausente)" }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 1. Busca o token no banco
    const { data: config, error: dbError } = await supabase
      .from('configuracoes_pagamento')
      .select('mp_access_token')
      .limit(1)
      .single();

    if (dbError || !config?.mp_access_token) {
      console.error("Erro ao buscar token:", dbError);
      return new Response(JSON.stringify({ error: "Token de Admin não encontrado ou erro no banco" }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 2. Chama o Mercado Pago
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.mp_access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ 
          title: "Mensalidade Plataforma - AuraFit", 
          quantity: 1, 
          unit_price: Number(valor) 
        }],
        external_reference: String(personalId), 
        back_urls: { 
          success: `https://aurafit.usoprime.com/admin/financeiro?status=success`,
          failure: `https://aurafit.usoprime.com/admin/financeiro`,
          pending: `https://aurafit.usoprime.com/admin/financeiro`
        },
        auto_return: "approved"
      }),
    });

    const data = await response.json();

    // Verificação de erro vindo do Mercado Pago
    if (!response.ok) {
      console.error("Erro do Mercado Pago:", data);
      return new Response(JSON.stringify({ error: data.message || "Erro ao conectar com Mercado Pago" }), { 
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ init_point: data.init_point }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (err: any) {
    console.error("Erro interno da Edge Function:", err.message);
    return new Response(JSON.stringify({ error: "Erro interno no servidor: " + err.message }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});