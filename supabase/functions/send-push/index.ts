import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import admin from "https://esm.sh/firebase-admin@11.11.0"

// 1. Inicializa o Firebase com a Chave Secreta
const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
if (serviceAccountKey && !admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    console.error("Erro ao ler chave do Firebase:", err);
  }
}

serve(async (req) => {
  try {
    // 2. Lê a "carta" que o Webhook entregou
    const payload = await req.json();
    console.log("🔔 WEBHOOK RECEBIDO! Pacote:", payload);

    // Se não for uma notificação nova (INSERT), ignoramos
    if (payload.type !== 'INSERT' || !payload.record) {
      return new Response(JSON.stringify({ msg: "Ignorado, não é INSERT" }), { status: 200 });
    }

    const notificacao = payload.record;
    console.log("A procurar token do utilizador ID:", notificacao.user_id);

    // 3. Liga-se ao Supabase para ir buscar o Token do telemóvel
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', notificacao.user_id)
      .limit(1);

    if (!tokens || tokens.length === 0) {
      console.log("❌ Utilizador não tem token registado.");
      return new Response(JSON.stringify({ error: "Sem token" }), { status: 200 });
    }

    const tokenDestino = tokens[0].token;
    console.log("✅ Token encontrado! A enviar para o Firebase...");

    // 4. Manda a ordem de disparo para o Firebase
    const mensagem = {
      notification: {
        title: notificacao.titulo || "AuraFit",
        body: notificacao.corpo || "Tem uma nova mensagem."
      },
      token: tokenDestino 
    };

    const respostaFirebase = await admin.messaging().send(mensagem);
    console.log("🚀 SUCESSO! Firebase respondeu:", respostaFirebase);

    return new Response(JSON.stringify({ success: true, fcm_id: respostaFirebase }), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    console.error("⚠️ ERRO FATAL:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});