'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LogoUploaderContainer() {
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('configuracoes')
      .select('logo_url')
      .single()
      .then(({ data }) => {
        if (data) setLogo(data.logo_url);
        setLoading(false);
      });
  }, []);

  // SE NÃO TIVER LOGO, RETORNAMOS NULL OU UMA MENSAGEM
  if (loading) return <div>Carregando logo...</div>;
  if (!logo) return <div>Nenhuma logo encontrada.</div>;

  // AQUI É O RETORNO QUE FALTAVA
  return (
    <div className="logo-container">
      <img src={logo} alt="Logo do Sistema" className="max-w-[200px] h-auto" />
      {/* Aqui você pode adicionar o seu componente de upload depois */}
    </div>
  );
}