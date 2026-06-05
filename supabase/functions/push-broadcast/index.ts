import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import admin from "npm:firebase-admin@11.11.0"

const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
if (serviceAccountKey && !admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountKey)) });
}

serve(async (req) => {
  try {
    const { broadcast_id } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Buscar detalhes da campanha
    const { data: campanha } = await supabase.from('notification_broadcasts').select('*').eq('id', broadcast_id).single();
    if (!campanha) return new Response("Campanha não encontrada", { status: 404 });

    // 2. Buscar todos os tokens ativos
    const { data: tokens } = await supabase.from('push_tokens').select('token').not('token', 'is', null);
    if (!tokens || tokens.length === 0) return new Response("Sem tokens", { status: 200 });

    const tokenList = tokens.map(t => t.token);

    // 3. Disparar em blocos de 500 (Firebase Multicast)
    for (let i = 0; i < tokenList.length; i += 500) {
      const chunk = tokenList.slice(i, i + 500);
      await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        data: { title: campanha.titulo, body: campanha.corpo, url: campanha.cta_link || "/" }
      });
    }

    // 4. Marcar como enviado
    await supabase.from('notification_broadcasts').update({ status: 'enviado' }).eq('id', broadcast_id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})