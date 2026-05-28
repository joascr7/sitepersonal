'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const LogoContext = createContext({ logo: null, nome: 'AURAFIT' });

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState({ logo: null, nome: 'AURAFIT' });

  useEffect(() => {
    async function loadConfig() {
      // Busca a configuração global (ex: a primeira registrada ou a do admin)
      const { data } = await supabase.from('configuracoes').select('nome_empresa, logo_url').limit(1).maybeSingle();
      if (data) setData({ logo: data.logo_url, nome: data.nome_empresa });
    }
    loadConfig();
  }, []);

  return <LogoContext.Provider value={data}>{children}</LogoContext.Provider>;
}

export const useLogo = () => useContext(LogoContext);