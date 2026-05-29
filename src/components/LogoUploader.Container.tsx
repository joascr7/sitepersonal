'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
// AQUI ESTÁ A CORREÇÃO: Usar ./ para importar do mesmo diretório
import LogoUploader from './LogoUploader.Container';

export default function LogoUploaderContainer() {
  const [logo, setLogo] = useState('');

  useEffect(() => {
    supabase
      .from('configuracoes')
      .select('logo_url')
      .single()
      .then(({ data }) => {
        if (data) setLogo(data.logo_url);
      });
  }, []);

  
}