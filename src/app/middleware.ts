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

  // Rotas públicas e exclusões de middleware
  if (pathname.startsWith('/_next') || pathname.includes('.') || pathname === '/login' || pathname === '/') {
    return response;
  }

  // Permite acesso à página de pagamento sem bloqueios de loop
  if (pathname === '/pagamento-pendente') {
    return response;
  }

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/aluno/');
  if (!session && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session) {
    request.headers.set('x-user-id', session.user.id);
    
    const userRole = session.user.user_metadata?.role;
    const isAlunoRoute = pathname.startsWith('/aluno/');
    const isDashboardRoute = pathname.startsWith('/dashboard');

    if (userRole === 'personal' && isAlunoRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    if (userRole === 'aluno' && isDashboardRoute) {
      return NextResponse.redirect(new URL(`/aluno/${session.user.id}`, request.url));
    }

    // Lógica de bloqueio para Alunos
    if (userRole === 'aluno' && isAlunoRoute) {
      const { data: aluno } = await supabase
        .from('alunos')
        .select('status_pagamento, data_vencimento')
        .eq('id', session.user.id)
        .single();

      if (aluno) {
        const hoje = new Date();
        const vencimento = new Date(aluno.data_vencimento);
        const dataLimite = new Date(vencimento);
        dataLimite.setDate(dataLimite.getDate() + 2);

        // Bloqueia apenas se estiver explicitamente 'bloqueado' OU se estiver vencido E não estiver ativo
        // Adicionamos a checagem '!pathname.startsWith' para evitar loop
        const estaVencido = hoje.getTime() > dataLimite.getTime();
        
        if (
          (aluno.status_pagamento === 'bloqueado' || (estaVencido && aluno.status_pagamento !== 'ativo')) &&
          !pathname.startsWith('/pagamento-pendente')
        ) {
          return NextResponse.redirect(new URL('/pagamento-pendente?motivo=vencido', request.url));
        }
      }
    }
  }

  return response;
}