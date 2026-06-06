import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import admin from "npm:firebase-admin@11.11.0"

const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
if (serviceAccountKey && !admin.apps.length) {
  admin.initializeApp({ 
    credential: admin.credential.cert(JSON.parse(serviceAccountKey)) 
  });
}

// Cabeçalhos OBRIGATÓRIOS para o navegador não bloquear o envio
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // A MÁGICA ESTÁ AQUI: Se for o "pedido fantasma" (OPTIONS), responde com OK e os cabeçalhos CORS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Agora é seguro ler o JSON, porque o pedido fantasma já foi filtrado acima.
    const { broadcast_id } = await req.json();
    if (!broadcast_id) throw new Error("ID da campanha não fornecido");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Buscar detalhes da campanha
    const { data: campanha, error: campError } = await supabase
      .from('notification_broadcasts')
      .select('*')
      .eq('id', broadcast_id)
      .single();

    if (campError || !campanha) throw new Error("Campanha não encontrada");

    // 2. Buscar TODOS os utilizadores com tokens válidos
    const { data: records, error: tokenError } = await supabase
      .from('push_tokens')
      .select('user_id, token')
      .not('token', 'is', null);

    if (tokenError) throw tokenError;
    if (!records || records.length === 0) {
      return new Response(JSON.stringify({ status: "No users to notify" }), { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } // CORS aqui também
      });
    }

    // 3. Inserir no histórico (Sininho) para todos
    for (let i = 0; i < records.length; i += 100) {
      const chunk = records.slice(i, i + 100);
      const notifications = chunk.map(r => ({
        user_id: r.user_id,
        titulo: campanha.titulo,
        corpo: campanha.corpo,
        lida: false
      }));
      
      const { error: insertError } = await supabase.from('user_notifications').insert(notifications);
      if (insertError) console.error("Erro ao inserir lote:", insertError);
    }

    // 4. Disparar Push (Lotes de 500 para Firebase)
    const tokens = records.map(r => r.token).filter(t => t !== null);
    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      try {
        await admin.messaging().sendEachForMulticast({
          tokens: chunk,
          data: { 
            title: campanha.titulo, 
            body: campanha.corpo, 
            url: campanha.cta_link || "/" 
          }
        });
      } catch (fErr) {
        console.error("Erro parcial no Firebase:", fErr);
      }
    }

    // 5. Atualizar status da campanha
    await supabase.from('notification_broadcasts')
      .update({ status: 'enviado' })
      .eq('id', broadcast_id);

    return new Response(JSON.stringify({ success: true, count: records.length }), { 
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" } // CORS na resposta final
    });

  } catch (err: any) {
    console.error("ERRO NO BROADCAST:", err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" } // CORS no erro
    });
  }
})