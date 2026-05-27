'use client';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { salvarFeedbackNoBanco } from '@/lib/actions';

export default function RegistrarEvolucaoAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // Este é o aluno_id
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    sentimento: '',
    intensidade: 0,
    observacoes: ''
  });

  const salvarFeedback = async () => {
    if (form.intensidade === 0) {
      alert("Por favor, selecione a intensidade do treino.");
      return;
    }

    setLoading(true);

    try {
      // 1. Busca o personal_id desse aluno para salvar junto
      const { data: aluno } = await supabase
        .from('alunos')
        .select('personal_id')
        .eq('id', id)
        .single();

      // 2. Envia os dados, incluindo o personal_id agora
      const { error } = await salvarFeedbackNoBanco(id, { 
        intensidade: form.intensidade,
        sentimento: form.sentimento,
        observacoes: form.observacoes,
        personal_id: aluno?.personal_id // <--- GARANTIA QUE O FEEDBACK APAREÇA NO PAINEL DO PERSONAL
      });
      
      if (error) throw error;

      router.back();
    } catch (err: any) {
      alert("Erro ao registrar feedback: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-md mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tighter">Feedback do Treino</h2>
        <p className="text-gray-500 mb-8 text-sm">Como você se sentiu hoje? Seu registro ajuda seu Personal a ajustar seu treino.</p>
        
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Intensidade (1 a 10)</label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button 
                  key={num}
                  onClick={() => setForm({...form, intensidade: num})}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition ${form.intensidade === num ? 'bg-black text-white' : 'bg-gray-100'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Como foi seu desempenho?</label>
            <select 
              className="w-full p-4 mt-1 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none bg-white"
              onChange={(e) => setForm({...form, sentimento: e.target.value})}
            >
              <option value="">Selecione...</option>
              <option value="Energizado">Energizado ⚡</option>
              <option value="Cansado">Cansado 😴</option>
              <option value="Desafiador">Desafiador 🔥</option>
              <option value="Normal">Dentro do planejado ✅</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Anotações para o Personal</label>
            <textarea 
              className="w-full p-4 mt-1 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none min-h-[120px]"
              placeholder="Ex: Tive dificuldade no exercício X, mas o Y foi ótimo."
              onChange={(e) => setForm({...form, observacoes: e.target.value})}
            />
          </div>
        </div>
        
        <button 
          onClick={salvarFeedback} 
          disabled={loading}
          className="w-full mt-8 bg-black text-white p-4 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-200"
        >
          {loading ? "Enviando..." : "Enviar Feedback"}
        </button>
      </div>
    </main>
  );
}