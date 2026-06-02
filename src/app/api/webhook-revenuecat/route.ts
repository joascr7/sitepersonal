import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer'; // Importe a chave mestra

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== '@Joas0000') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const event = body.event;
    const userId = event.app_user_id;
    const type = body.event_type;

    if (!userId) return NextResponse.json({ error: 'User ID ausente' }, { status: 400 });

    // Status ativo se não for cancelado ou expirado
    const isAtivo = type !== 'CANCELLATION' && type !== 'EXPIRED';

    // Atualiza usando a chave mestra
    const { error } = await supabaseAdmin
      .from('personais')
      .update({ is_pro: isAtivo })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Erro no Webhook:", err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}