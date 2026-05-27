import { createClient } from '@supabase/supabase-js';

// Usamos valores padrão vazios apenas para permitir que o build do Next.js passe
// em páginas que não dependem do Supabase no lado do servidor (como a not-found)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Só lançamos erro se estivermos em tempo de execução (browser/server side)
// e não em tempo de build estático
export const supabase = createClient(supabaseUrl, supabaseAnonKey);