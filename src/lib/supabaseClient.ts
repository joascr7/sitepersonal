import { createClient } from '@supabase/supabase-js';

// Usamos valores padrão vazios para permitir que o build passe 
// e garantimos que o Supabase não trave o processo de pré-renderização.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);