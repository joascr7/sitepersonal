import { createClient } from '@supabase/supabase-js';

// Usamos as variáveis, mas garantimos uma string vazia caso não estejam presentes no build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A inicialização agora nunca irá falhar, permitindo o build passar
export const supabase = createClient(supabaseUrl, supabaseAnonKey);