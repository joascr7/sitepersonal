// lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_KEY não está definida nas variáveis de ambiente da Vercel.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);