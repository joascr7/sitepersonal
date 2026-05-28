'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaUpload, FaCheck } from 'react-icons/fa';

export default function LogoUploader({ currentLogo, onUpdate }: { currentLogo: string, onUpdate: (url: string) => void }) {
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
    if (!userId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/logo.${fileExt}`;

    const { error } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
      onUpdate(data.publicUrl);
    } else {
      alert("Erro ao realizar upload: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-6 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
      <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
        {currentLogo ? (
          <img src={currentLogo} className="w-full h-full object-contain p-2" alt="Logo atual" />
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
        <p className="text-[9px] text-gray-400 mt-2 font-medium">PNG ou SVG recomendado.</p>
      </div>
    </div>
  );
}