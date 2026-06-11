// src/app/api/auth/login/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return NextResponse.redirect(new URL('/login-aluno?error=empty', requestUrl.origin));
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              // BLINDAGEM TOTAL: Força expiração física de 1 ano no cabeçalho nativo
              // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              cookieStore.set({
                name,
                value,
                ...options,
                maxAge: 31536000, // 1 ano em segundos
                expires: new Date(Date.now() + 31536000 * 1000), // Data física de 1 ano
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              });
            });
          },
        },
      }
    );

    // Executa a autenticação no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      return NextResponse.redirect(new URL('/login-aluno?error=invalid', requestUrl.origin));
    }

    // Verifica se o aluno está ativo no banco
    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('ativo')
      .eq('id', data.user.id)
      .maybeSingle();

    if (alunoError || !aluno || aluno.ativo === false) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/login-aluno?error=inactive', requestUrl.origin));
    }

    // REDIRECIONAMENTO NATIVO: Sela o cookie de forma persistente no telemóvel
    return NextResponse.redirect(new URL(`/aluno/${data.user.id}`, requestUrl.origin), {
      status: 303, // Força o redirecionamento limpo de método POST para GET
    });

  } catch (err) {
    return NextResponse.redirect(new URL('/login-aluno?error=server', requestUrl.origin));
  }
}