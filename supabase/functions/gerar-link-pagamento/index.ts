import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MERCADO_PAGO_API = "https://api.mercadopago.com/checkout/preferences";

serve(async (req) => {
  const { personalId, valor } = await req.json();

  const response = await fetch(MERCADO_PAGO_API, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ title: "Mensalidade Personal", quantity: 1, unit_price: valor }],
      external_reference: personalId, // O ID que o Webhook vai ler depois!
      auto_return: "approved",
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify({ url: data.init_point }), {
    headers: { "Content-Type": "application/json" },
  });
});