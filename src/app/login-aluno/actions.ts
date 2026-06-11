'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function loginAlunoAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Preencha todos os campos.' }
  }

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              // AQUI ESTÁ A IMORTALIDADE DO PWA! 1 ANO DE VALIDADE FORÇADA
              // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              cookieStore.set({
                name,
                value,
                ...options,
                maxAge: 31536000, 
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              })
            })
          } catch (error) {
            // O Catch é ignorado no Next.js ao chamar de Server Actions
          }
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: 'Credenciais inválidas.' }
  }

  // Verifica se a conta está ativa
  const { data: aluno, error: alunoError } = await supabase
    .from('alunos')
    .select('ativo')
    .eq('id', data.user.id)
    .maybeSingle()

  if (alunoError || !aluno || aluno.ativo === false) {
    await supabase.auth.signOut()
    return { error: 'Conta inativa.' }
  }

  // Devolve o ID do utilizador para redirecionamento do lado do cliente
  return { success: true, userId: data.user.id }
}
