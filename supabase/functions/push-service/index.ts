import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import admin from "npm:firebase-admin@11.11.0"

// Inicialização Firebase (Protegida para não re-inicializar)
const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
if (serviceAccountKey && !admin.apps.length) {
  admin.initializeApp({ 
    credential: admin.credential.cert(JSON.parse(serviceAccountKey)) 
  });
}

serve(async (req) => {
  try {
    const body = await req.json();
    const notificacao = body.record || body;

    if (!notificacao.user_id) {
        return new Response(JSON.stringify({ error: "Missing user_id" }), { status: 400 });
    }

    // Inicialização Supabase com service_role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. VERIFICAÇÃO DE DUPLICIDADE (Idempotência)
    const { data: existente } = await supabase
      .from('user_notifications')
      .select('id')
      .eq('user_id', notificacao.user_id)
      .eq('titulo', notificacao.titulo || "AuraFit")
      .gte('criado_em', new Date(Date.now() - 120000).toISOString())
      .maybeSingle();

    if (existente) {
      console.log(`Duplicada ignorada: ${notificacao.user_id}`);
      return new Response(JSON.stringify({ status: "Ignored" }), { status: 200 });
    }

    // 2. SALVA NO BANCO (USANDO UPSERT PARA EVITAR ERROS DE CONFLITO)
    const { error: insertError } = await supabase.from('user_notifications').insert({
      user_id: notificacao.user_id,
      titulo: notificacao.titulo || "AuraFit",
      corpo: notificacao.corpo || "Nova notificação",
      lida: false
    });

    if (insertError) {
      console.error("ERRO AO SALVAR:", insertError);
      throw new Error(`DB Insert Error: ${insertError.message}`);
    }
    
    // 3. BUSCA TOKEN
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', notificacao.user_id)
      .order('atualizado_em', { ascending: false }) 
      .limit(1);

    if (tokenError) console.error("Erro ao buscar token:", tokenError);

    if (tokens && tokens.length > 0) {
      // 4. DISPARA PUSH
      try {
        await admin.messaging().send({
          data: {
            title: notificacao.titulo || "AuraFit",
            body: notificacao.corpo || "Tem uma nova mensagem.",
            url: notificacao.cta_link || "/"
          },
          token: tokens[0].token
        });
        console.log("Push enviado!");
      } catch (pushErr) {
        console.error("Erro Firebase:", pushErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    });

  } catch (err: any) {
    console.error("ERRO FINAL:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})