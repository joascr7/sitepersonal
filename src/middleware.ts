import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. ISENÇÃO TOTAL: Rotas públicas que não exigem login
  const publicRoutes = [
    '/login-personal', '/login-aluno', '/login-admin', '/', 
    '/acesso-personal', '/planos', '/pagamento', 
    '/pagamento-pendente', '/aluno/antecipar', 
    '/api/webhook-admin', '/api/webhook-mp', '/api/webhook-revenuecat'
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

  // 2. VERIFICAÇÃO DE SESSÃO
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch { user = null; }

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/aluno/') || pathname.startsWith('/admin/');
  
  // Se não estiver logado e tentar acessar área protegida, redireciona para o login correspondente
  if (!user && isProtected) {
    const loginPath = pathname.startsWith('/aluno/') ? '/login-aluno' : pathname.startsWith('/admin/') ? '/login-admin' : '/login-personal';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  // 3. LOGICA DE ACESSO E ADMIN
  if (user) {
    request.headers.set('x-user-id', user.id);
    const ADMIN_EMAILS = [''];

    // Se for admin, acesso total liberado
   /* if (ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return response;
    }*/

    // Se tentar acessar área administrativa e NÃO for admin, joga pro dashboard
   // Substitua o seu if pelo código abaixo
if (pathname === '/admin' || pathname === '/admin/') {
  return NextResponse.redirect(new URL('/admin/financeiro?aba=gestao', request.url));
}
    
    // NOTA: A validação de assinatura (is_pro) agora é feita pelo SubscriptionGuard 
    // diretamente nas páginas. Isso remove a dependência de banco de dados no middleware, 
    // tornando o site extremamente rápido e evitando conflitos com a lógica antiga.
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};