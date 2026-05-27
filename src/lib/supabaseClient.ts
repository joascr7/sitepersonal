import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ADICIONE ESTAS LINHAS DE DEBUG:
console.log("--- DEBUG DO SUPABASE ---");
console.log("URL carregada:", supabaseUrl);
console.log("Chave carregada (início):", supabaseAnonKey?.substring(0, 10) + "...");
console.log("-------------------------");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
