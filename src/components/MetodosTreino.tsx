'use client';
import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';

const METODOS_PADRAO = [
  { id: '1', nome: 'Drop-set' },
  { id: '2', nome: 'Rest-Pause' },
  { id: '3', nome: 'Bi-set' },
  { id: '4', nome: 'Tri-set' },
  { id: '5', nome: 'Pirâmide' }
];

export default function MetodosTreino() {
  const [metodos, setMetodos] = useState(METODOS_PADRAO);

  const handleEdit = (id: string, novoNome: string) => {
    setMetodos(metodos.map(m => m.id === id ? { ...m, nome: novoNome } : m));
  };

  const adicionarNovo = () => {
    const novo = { id: Date.now().toString(), nome: 'Novo Método' };
    setMetodos([...metodos, novo]);
  };

  return (
    <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-8">
        Métodos de Treinamento
      </h3>
      
      <div className="space-y-3">
        {metodos.map((metodo) => (
          <input
            key={metodo.id}
            type="text"
            value={metodo.nome}
            onChange={(e) => handleEdit(metodo.id, e.target.value)}
            className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all"
          />
        ))}
      </div>

      <button 
        onClick={adicionarNovo}
        className="mt-8 w-full py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
      >
        <FaPlus className="text-[10px]" /> Adicionar Método
      </button>
    </div>
  );
}