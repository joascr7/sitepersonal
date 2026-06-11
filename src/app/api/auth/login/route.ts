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
      // Adicionado status: 303
      return NextResponse.redirect(new URL('/login-aluno?error=empty', requestUrl.origin), { status: 303 });
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
              cookieStore.set({
                name,
                value,
                ...options,
                maxAge: 31536000, 
                expires: new Date(Date.now() + 31536000 * 1000), 
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              });
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      // Adicionado status: 303 AQUI (Onde o Android estava quebrando)
      return NextResponse.redirect(new URL('/login-aluno?error=invalid', requestUrl.origin), { status: 303 });
    }

    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('ativo')
      .eq('id', data.user.id)
      .maybeSingle();

    if (alunoError || !aluno || aluno.ativo === false) {
      await supabase.auth.signOut();
      // Adicionado status: 303
      return NextResponse.redirect(new URL('/login-aluno?error=inactive', requestUrl.origin), { status: 303 });
    }

    // Sucesso já tinha o 303!
    return NextResponse.redirect(new URL(`/aluno/${data.user.id}`, requestUrl.origin), { status: 303 });

  } catch (err) {
    // Adicionado status: 303
    return NextResponse.redirect(new URL('/login-aluno?error=server', requestUrl.origin), { status: 303 });
  }
}