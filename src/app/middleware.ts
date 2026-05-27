import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }); },
        remove(name: string, options: CookieOptions) { response.cookies.delete(name); },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const pathname = request.nextUrl.pathname;

  // 1. Definição de rotas
  const isAuthPage = pathname.startsWith('/login') || pathname === '/';
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isAlunoPage = pathname.startsWith('/aluno-area'); // Crie uma rota separada para o aluno

  // 2. Bloqueio: Se não logado e tentando acessar área protegida
  if (!session && (isDashboardPage || isAlunoPage)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Controle de Acesso: Verificar a "role" do usuário
  if (session) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = userProfile?.role; // 'personal' ou 'aluno'

    // Se personal tentando acessar área de aluno ou vice-versa
    if (role === 'personal' && isAlunoPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    if (role === 'aluno' && isDashboardPage) {
      return NextResponse.redirect(new URL('/aluno-area', request.url));
    }

    // Se estiver logado e na página de login, manda para o dashboard correto
    if (isAuthPage) {
      return NextResponse.redirect(new URL(role === 'personal' ? '/dashboard' : '/aluno-area', request.url));
    }
  }

  return response;
}