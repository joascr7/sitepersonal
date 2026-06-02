'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ModalSelecaoAlunos({ isOpen, onClose, onSelect }: any) {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchAlunos = async () => {
        const { data } = await supabase.from('alunos').select('id, nome').order('nome');
        setAlunos(data || []);
      };
      fetchAlunos();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
      <div className="bg-neutral-950/90 rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 border border-white/10">
        <h2 className="text-xl font-black text-white mb-6 tracking-tighter">Copiar para qual aluno?</h2>
        
        <input 
          autoFocus
          className="w-full p-4 mb-6 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-blue-500 transition-all placeholder:text-neutral-600"
          placeholder="Buscar aluno..."
          onChange={(e) => setBusca(e.target.value)}
        />
        
        <div className="max-h-60 overflow-y-auto pr-2 space-y-1">
          {alunos
            .filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))
            .map(aluno => (
              <button 
                key={aluno.id}
                onClick={() => onSelect(aluno.id)}
                className="w-full text-left p-4 rounded-xl hover:bg-white/5 text-neutral-300 font-bold text-sm transition-all active:scale-[0.98]"
              >
                {aluno.nome}
              </button>
            ))
          }
        </div>
        
        <button 
          onClick={onClose} 
          className="w-full mt-8 text-neutral-600 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}