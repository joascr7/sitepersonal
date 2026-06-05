import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import admin from "npm:firebase-admin@11.11.0"

// Inicialização Firebase
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Busca o token mais recente
    const { data: tokens, error: dbError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', notificacao.user_id)
      .order('atualizado_em', { ascending: false }) 
      .limit(1);

    if (dbError) throw new Error(`Erro no banco: ${dbError.message}`);
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ status: "No token found" }), { status: 200 });
    }

    const message = {
      notification: {
        title: notificacao.titulo || "AuraFit",
        body: notificacao.corpo || "Tem uma nova mensagem."
      },
      token: tokens[0].token
    };

    // Tenta enviar
    const response = await admin.messaging().send(message);
    
    return new Response(JSON.stringify({ success: true, fcm_id: response }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (err: any) {
    console.error("ERRO DETALHADO:", err);

    // Se o token for inválido, retornamos 400 (Bad Request) em vez de 500
    // Isso evita "quebrar" o fluxo da aplicação
    const isInvalidToken = err.code === 'messaging/invalid-registration-token' || 
                           err.code === 'messaging/registration-token-not-registered';

    return new Response(JSON.stringify({ 
      error: err.message,
      code: err.code || "unknown_error" 
    }), { status: isInvalidToken ? 400 : 500 });
  }
})