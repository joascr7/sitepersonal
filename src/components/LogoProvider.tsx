'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface LogoData {
  logo: string | null;
  nome: string;
}

const LogoContext = createContext<LogoData>({ logo: null, nome: 'AURAFIT' });

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<LogoData>({ logo: null, nome: 'AURAFIT' });

  useEffect(() => {
   async function loadGlobalConfig() {
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('nome_empresa, logo_url')
      .limit(1);

    if (error || !data || data.length === 0) return;

    // AQUI ESTÁ A CORREÇÃO:
    // Forçamos o logo a ser null, ignorando o que vem do banco
    setData({ 
      logo: null, // <--- Isso impede que qualquer imagem seja carregada
      nome: data[0].nome_empresa 
    });
    
  } catch (err) {
    console.error("ERRO:", err);
  }
}
    
    loadGlobalConfig();
  }, []);

  return <LogoContext.Provider value={data}>{children}</LogoContext.Provider>;
}

export const useLogo = () => useContext(LogoContext);