import { createBrowserClient } from '@supabase/ssr';

// Esta instância é EXCLUSIVA para o lado do cliente (Componentes 'use client')
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookieOptions: {
      maxAge: 31536000, // Força a validade para 1 ano (31.536.000 segundos)
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', // true em produção, false em localhost
    }
  }
);