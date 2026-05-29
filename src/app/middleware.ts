import { createServerClient } from '@supabase/ssr';
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
        set(name, value, options) { response.cookies.set({ name, value, ...options }); },
        remove(name, options) { response.cookies.delete(name); },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const pathname = request.nextUrl.pathname;

  // Ignora arquivos estáticos e assets para performance
  if (pathname.startsWith('/_next') || pathname.includes('.')) return response;

  const userRole = session?.user.user_metadata?.role;
  const isAuthPage = pathname === '/login' || pathname === '/';
  
  // 1. Permite acesso livre ao Login/Home
  if (isAuthPage) return response;

  // 2. Proteção de rotas principais
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/aluno/') || pathname === '/pagamento-pendente';
  if (!session && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Controle de Acesso para Logados
  if (session) {
    const isAlunoRoute = pathname.startsWith('/aluno/');
    const isDashboardRoute = pathname.startsWith('/dashboard');

    // Impede Personais de acessar áreas de aluno
    if (userRole === 'personal' && (isAlunoRoute || pathname === '/pagamento-pendente')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Impede Alunos de acessar o dashboard do personal
    if (userRole === 'aluno' && isDashboardRoute) {
      return NextResponse.redirect(new URL(`/aluno/${session.user.id}`, request.url));
    }

    // 4. Bloqueio Financeiro (Regra de Ouro)
    // Se for aluno tentando acessar área de treino, valida status
    if (userRole === 'aluno' && isAlunoRoute && pathname !== '/pagamento-pendente') {
      const { data: aluno } = await supabase
        .from('alunos')
        .select('status_pagamento, data_vencimento')
        .eq('id', session.user.id)
        .single();

      if (aluno) {
        const hoje = new Date();
        const vencimento = aluno.data_vencimento ? new Date(aluno.data_vencimento) : null;
        const estaBloqueado = aluno.status_pagamento === 'bloqueado' || (vencimento && vencimento < hoje);

        // Se bloqueado, o redirecionamento é OBRIGATÓRIO, exceto se já estiver na página de pagamento
        if (estaBloqueado && pathname !== '/pagamento-pendente') {
          return NextResponse.redirect(new URL('/pagamento-pendente?motivo=vencido', request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};