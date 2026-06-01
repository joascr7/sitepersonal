import { createBrowserClient } from '@supabase/ssr';

// Esta instância é EXCLUSIVA para o lado do cliente (Componentes 'use client')
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);