import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. ISENÇÃO TOTAL: Rotas públicas, Webhooks e novas rotas de Assinatura
  const publicRoutes = [
    '/login-personal', '/login-aluno', '/login-admin', '/', 
    '/acesso-personal', '/planos', '/pagamento', // <--- ADICIONADAS ROTAS NOVAS
    '/pagamento-pendente', '/aluno/antecipar', 
    '/api/webhook-admin', '/api/webhook-mp'
  ];

  if (publicRoutes.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      request.cookies.getAll().forEach(c => { if (c.name.includes('sb-')) response.cookies.delete(c.name); });
      user = null;
    } else {
      user = data.user;
    }
  } catch { user = null; }

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/aluno/') || pathname.startsWith('/admin/');
  
  if (!user && isProtected) {
    const loginPath = pathname.startsWith('/aluno/') ? '/login-aluno' : pathname.startsWith('/admin/') ? '/login-admin' : '/login-personal';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (user) {
    request.headers.set('x-user-id', user.id);
    const ADMIN_EMAILS = ['contatojoasvieira6@gmail.com', 'admin@aurafit.com'];
    if (ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) return response;

    if (user.user_metadata?.role === 'personal') {
      const { data: personal } = await supabase
        .from('personais')
        .select('status_pagamento, vencimento_plano, data_expiracao_teste')
        .eq('id', user.id)
        .single();

      if (!personal) return NextResponse.redirect(new URL('/acesso-personal', request.url));

      // Lógica do Período de Teste
      const agora = new Date();
      const dataExpiracaoTeste = personal.data_expiracao_teste ? new Date(personal.data_expiracao_teste) : null;
      const estaNoPeriodoTeste = dataExpiracaoTeste ? agora <= dataExpiracaoTeste : false;

      // Validação Paga
      const estaInativo = personal.status_pagamento?.trim().toLowerCase() !== 'ativo';
      
      let estaVencido = false;
      if (personal.vencimento_plano) {
        const [ano, mes, dia] = personal.vencimento_plano.split('-').map(Number);
        const vencimento = new Date(Date.UTC(ano, mes - 1, dia));
        const hojeUTC = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
        estaVencido = vencimento < hojeUTC;
      }

      // Bloqueio estrito: só bloqueia se não estiver pago E não estiver no teste
      // MANTEMOS A LÓGICA QUE VOCÊ JÁ TINHA
      const deveBloquear = (estaInativo || estaVencido) && !estaNoPeriodoTeste;

      // Adicionamos a exceção para as páginas de pagamento para o personal não ficar preso num loop
      const acessandoPagamento = pathname.startsWith('/acesso-personal') || pathname.startsWith('/planos') || pathname.startsWith('/pagamento');

      if (deveBloquear && !acessandoPagamento) {
        return NextResponse.redirect(new URL('/acesso-personal', request.url));
      }
    }
    
    if (pathname.startsWith('/admin/') && !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};