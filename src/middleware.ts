import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. IGNORAR APENAS ARQUIVOS DO SISTEMA E API (Para não sobrecarregar o servidor)
  const isStaticFile = pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.');

  if (isStaticFile) {
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
            const persistentOptions = {
              ...options, 
              maxAge: 31536000, // 1 Ano completo de vida do cookie
              path: '/', 
              sameSite: 'lax' as const, 
              secure: process.env.NODE_ENV === 'production',
            };
            request.cookies.set(name, value);
            response.cookies.set(name, value, persistentOptions);
          });
        },
      },
    }
  );

  // 2. VERIFICAÇÃO DE SESSÃO GLOBAL (Agora roda até na tela inicial!)
  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/aluno/') || pathname.startsWith('/admin/');
  
  // Se não estiver logado e tentar acessar área protegida
  if (!user && isProtected) {
    let loginPath = '/login-personal';
    if (pathname.startsWith('/aluno/')) loginPath = '/login-aluno';
    else if (pathname.startsWith('/admin/')) loginPath = '/login-admin';
    
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  // 3. A MÁGICA DO PWA: AUTO-REDIRECIONAMENTO QUANDO ESTÁ LOGADO
  if (user) {
    request.headers.set('x-user-id', user.id);

    // Redirecionamento direto para Admin
    if (pathname === '/admin' || pathname === '/admin/') {
      return NextResponse.redirect(new URL('/admin/financeiro?aba=gestao', request.url));
    }

    // Se o usuário está LOGADO e abre o app na tela inicial ('/') ou de login, 
    // ele é redirecionado automaticamente para dentro do sistema!
    const isPublicRoute = [
      '/login-personal', '/login-aluno', '/login-admin', '/', '/acesso-personal'
    ].includes(pathname);

    if (isPublicRoute) {
      // Bate no banco rapidinho para saber se é aluno ou personal
      const { data: isAluno } = await supabase
        .from('alunos')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (isAluno) {
        return NextResponse.redirect(new URL(`/aluno/${user.id}`, request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};