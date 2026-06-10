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
            // Configuração refinada de persistência forçada para o ecossistema PWA
            const persistentOptions = {
              ...options,
              maxAge: 31536000, // 1 Ano completo de vida do cookie (Impede o deslogar automático)
              path: '/', // Garante acesso global em todas as subrotas
              sameSite: 'lax' as const, // Compatibilidade máxima com as diretivas estritas do iOS (ITP)
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true // Proteção adicional de segurança
            };

            // Atualiza a árvore de pedidos atual (Request Headers)
            request.cookies.set(name, value);
            
            // CORREÇÃO CRUCIAL: Passagem explícita dos parâmetros para evitar falhas de mutação no Next.js
            response.cookies.set(name, value, persistentOptions);
          });
        },
      },
    }
  );

  // 2. VERIFICAÇÃO DE SESSÃO REAL E SEGURA NO BANCO
  // O getUser obriga o Supabase a validar o JWT. Se o token expirou, ele chama o setAll acima e renova-o.
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
