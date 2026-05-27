'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';

export default function AgendarAula() {
  const { id } = useParams();
  const router = useRouter();
  const [dataHora, setDataHora] = useState('');
  const [loading, setLoading] = useState(false);

  const salvarAgendamento = async () => {
    if (!dataHora) return alert('Selecione uma data e horário.');
    
    setLoading(true);
    const { error } = await supabase.from('agendamentos').insert([
      { aluno_id: id, data_hora: dataHora }
    ]);
    
    if (error) {
      alert('Erro: ' + error.message);
      setLoading(false);
    } else {
      router.push(`/dashboard/aluno/${id}`);
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

        <h1 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Agendar Aula</h1>
        
        <input 
          type="datetime-local" 
          className="w-full p-4 mb-8 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 transition"
          onChange={(e) => setDataHora(e.target.value)} 
        />

        <button 
          onClick={salvarAgendamento} 
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-black text-white p-4 rounded-xl font-bold transition-all active:scale-[0.98] shadow-sm disabled:bg-gray-400"
        >
          {loading ? 'Processando...' : 'Confirmar Agendamento'}
        </button>
      </div>
    </main>
  );
}