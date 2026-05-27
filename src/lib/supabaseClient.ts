import { createClient } from '@supabase/supabase-js';

// Usamos as variáveis de ambiente, mas se não existirem (build), 
// atribuímos uma string vazia para não interromper o processo.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A inicialização agora é segura para o build
export const supabase = createClient(supabaseUrl, supabaseAnonKey);