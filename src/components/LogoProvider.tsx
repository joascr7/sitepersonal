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
    // Tenta buscar qualquer registro da tabela
    const { data, error } = await supabase
      .from('configuracoes') // Certifique-se que o nome aqui é igual ao do painel
      .select('nome_empresa, logo_url')
      .limit(1);

    if (error) {
      console.error("ERRO DE CONEXÃO COM O BANCO:", error);
      return;
    }

    if (!data || data.length === 0) {
      console.warn("A tabela está vazia. Adicione pelo menos uma linha nela!");
      return;
    }

    console.log("DADOS RECEBIDOS:", data[0]);
    setData({ logo: data[0].logo_url, nome: data[0].nome_empresa });
    
  } catch (err) {
    console.error("ERRO INESPERADO:", err);
  }
}
    
    loadGlobalConfig();
  }, []);

  return <LogoContext.Provider value={data}>{children}</LogoContext.Provider>;
}

export const useLogo = () => useContext(LogoContext);