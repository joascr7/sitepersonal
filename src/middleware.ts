import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. ISENÇÃO TOTAL: Rotas públicas
  const publicRoutes = [
    '/login-personal', '/login-aluno', '/login-admin', '/', 
    '/acesso-personal', '/planos', '/pagamento', 
    '/pagamento-pendente', '/aluno/antecipar'
  ];

  // Identifica se é rota pública ou arquivo estático/api
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  const isStaticFile = pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.');

  if (isPublicRoute || isStaticFile) {
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
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // A MÁGICA DO PWA AQUI: Injetamos validade de 1 ano à força
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            const persistentOptions = {
              ...options,
              maxAge: 31536000, // 1 Ano de vida forçado (impede o iOS de limpar)
              sameSite: 'lax' as const, // Protege contra as regras estritas da Apple (ITP)
            };

            // Atualiza o request atual para que a sessão seja lida na hora
            request.cookies.set(name, value);
            // Salva no navegador do usuário com as regras blindadas
            response.cookies.set({ name, value, ...persistentOptions });
          });
        },
      },
    }
  );

  // 2. VERIFICAÇÃO DE SESSÃO
  // O .getUser() é obrigatório aqui pois ele quem dispara o refresh token chamando o setAll acima
  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/aluno/') || pathname.startsWith('/admin/');
  
  // Se não estiver logado e tentar acessar área protegida
  if (!user && isProtected) {
    let loginPath = '/login-personal';
    if (pathname.startsWith('/aluno/')) loginPath = '/login-aluno';
    else if (pathname.startsWith('/admin/')) loginPath = '/login-admin';
    
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  // 3. LÓGICA DE ADMIN E ROTAS PROTEGIDAS
  if (user) {
    request.headers.set('x-user-id', user.id);

    // Redirecionamento direto para Admin
    if (pathname === '/admin' || pathname === '/admin/') {
      return NextResponse.redirect(new URL('/admin/financeiro?aba=gestao', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
