import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Criação do objeto de resposta inicial
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name, value, options) { response.cookies.set({ name, value, ...options }); },
        remove(name, options) { response.cookies.delete(name); },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const pathname = request.nextUrl.pathname;

  // 1. Otimização: Ignorar rotas de sistema, arquivos estáticos e imagens
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') // Ignora arquivos com extensão (ex: .png, .css)
  ) {
    return response;
  }

  // 2. Extração da Role (Padrão de segurança: se não tiver role, não assume nada)
  const userRole = session?.user.user_metadata?.role;

  // 3. Definição de rotas
  const isAuthPage = pathname === '/login' || pathname === '/';
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isAlunoPage = pathname.startsWith('/aluno-area');

  // 4. BLOQUEIO: Usuário não logado tentando acessar área restrita
  if (!session && (isDashboardPage || isAlunoPage)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. CONTROLE DE ACESSO: Usuário logado
  if (session) {
    // Se logado e na página de login, redireciona para a home correta baseada na role
    if (isAuthPage) {
      const destination = userRole === 'personal' ? '/dashboard' : '/aluno-area';
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // Proteção de rotas (evita acesso cruzado entre perfis)
    if (userRole === 'personal' && isAlunoPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    if (userRole === 'aluno' && isDashboardPage) {
      return NextResponse.redirect(new URL('/aluno-area', request.url));
    }
  }

  return response;
}

// Configuração otimizada para o matcher
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};