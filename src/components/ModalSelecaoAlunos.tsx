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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6 z-50 transition-opacity">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 border border-gray-100">
        <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Copiar para qual aluno?</h2>
        
        <input 
          autoFocus
          className="w-full p-4 mb-6 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition"
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
                className="w-full text-left p-4 rounded-xl hover:bg-gray-50 text-gray-800 font-medium transition-all active:scale-[0.98]"
              >
                {aluno.nome}
              </button>
            ))
          }
        </div>
        
        <button 
          onClick={onClose} 
          className="w-full mt-8 text-gray-400 font-bold text-sm hover:text-gray-900 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}