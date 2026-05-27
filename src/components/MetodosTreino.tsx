'use client';
import { useState } from 'react';

const METODOS_PADRAO = [
  { id: '1', nome: 'Drop-set' },
  { id: '2', nome: 'Rest-Pause' },
  { id: '3', nome: 'Bi-set' },
  { id: '4', nome: 'Tri-set' },
  { id: '5', nome: 'Pirâmide' }
];

export default function MetodosTreino() {
  const [metodos, setMetodos] = useState(METODOS_PADRAO);

  // Função para editar um método específico
  const handleEdit = (id: string, novoNome: string) => {
    setMetodos(metodos.map(m => m.id === id ? { ...m, nome: novoNome } : m));
  };

  // Função para adicionar um novo método
  const adicionarNovo = () => {
    const novo = { id: Date.now().toString(), nome: 'Novo Método' };
    setMetodos([...metodos, novo]);
  };

  return (
    <div className="p-4 border rounded shadow-sm bg-white">
      <h3 className="font-bold mb-4">Métodos de Treinamento</h3>
      
      <div className="space-y-2">
        {metodos.map((metodo) => (
          <input
            key={metodo.id}
            type="text"
            value={metodo.nome}
            onChange={(e) => handleEdit(metodo.id, e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none"
          />
        ))}
      </div>

      <button 
        onClick={adicionarNovo}
        className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        + Adicionar Método
      </button>
    </div>
  );
}