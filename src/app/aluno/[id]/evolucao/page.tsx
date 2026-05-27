'use client';
import { useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RegistrarEvolucao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [peso, setPeso] = useState('');
  const [loading, setLoading] = useState(false);

  const salvarPeso = async () => {
    if (!peso) return;
    setLoading(true);
    
    const { error } = await supabase.from('evolucao').insert([{ 
      aluno_id: id,
      peso: parseFloat(peso),
      data_medicao: new Date().toISOString() 
    }]);
    
    if (error) {
      alert("Erro ao registrar: " + error.message);
      setLoading(false);
    } else {
      alert("Peso registrado com sucesso!");
      router.back();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-sm mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <button 
          onClick={() => router.back()} 
          className="text-sm font-bold text-gray-400 hover:text-gray-900 transition mb-8"
        >
          ← Voltar
        </button>

        <h2 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Registrar evolução</h2>
        
        <input 
          type="number" 
          className="w-full p-4 mb-8 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 transition"
          placeholder="Peso atual (kg)" 
          value={peso}
          onChange={(e) => setPeso(e.target.value)} 
        />
        
        <button 
          onClick={salvarPeso} 
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-black text-white p-4 rounded-xl font-bold transition-all active:scale-[0.98] shadow-sm disabled:bg-gray-400"
        >
          {loading ? "Registrando..." : "Salvar Peso"}
        </button>
      </div>
    </main>
  );
}