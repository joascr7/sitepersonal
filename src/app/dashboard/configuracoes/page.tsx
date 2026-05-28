'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaUpload } from 'react-icons/fa';

interface LogoUploaderProps {
  currentLogo: string;
  onUpdate: (url: string) => void;
}

export default function LogoUploader({ currentLogo, onUpdate }: LogoUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

 const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setLoading(true);
  // Usamos um nome fixo 'logo.png' ou 'logo.jpg' para sempre sobrescrever a mesma imagem
  const fileName = `global-logo.png`; 

  // 1. Upload para o Storage
  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    alert("Erro no upload: " + uploadError.message);
    setLoading(false);
    return;
  }

  // 2. Pegar URL Pública
  const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
  
  // 3. ATUALIZAÇÃO NO BANCO (O código que você perguntou onde colocar)
  const { data: currentRows } = await supabase
    .from('configuracoes')
    .select('id')
    .limit(1);

  if (currentRows && currentRows.length > 0) {
    const { error: dbError } = await supabase
      .from('configuracoes')
      .update({ logo_url: data.publicUrl })
      .eq('id', currentRows[0].id);
      
    if (dbError) {
      alert("Erro ao salvar no banco: " + dbError.message);
    } else {
      alert("Logo atualizada com sucesso!");
      window.location.reload(); // Recarrega para mostrar a nova logo na Navbar
    }
  }
  setLoading(false);
};

  return (
    <div className="flex items-center gap-6 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
      <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
        {currentLogo ? (
          <img src={currentLogo} className="w-full h-full object-contain p-2" alt="Logo" />
        ) : (
          <FaUpload className="text-gray-300" />
        )}
      </div>
      
      <div>
        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2">Logomarca</label>
        <input type="file" id="logo-upload" className="hidden" onChange={handleUpload} accept="image/*" />
        <label htmlFor="logo-upload" className="cursor-pointer bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-xs transition-all active:scale-[0.98]">
          {loading ? "Enviando..." : "Alterar Imagem"}
        </label>
      </div>
    </div>
  );
}