'use client';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { salvarFeedbackNoBanco } from '@/lib/actions';

export default function RegistrarEvolucaoAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
      const { data: aluno } = await supabase
        .from('alunos')
        .select('personal_id')
        .eq('id', id)
        .single();

      const { error } = await salvarFeedbackNoBanco(id, { 
        intensidade: form.intensidade,
        sentimento: form.sentimento,
        observacoes: form.observacoes,
        personal_id: aluno?.personal_id
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
    <main className="min-h-screen bg-black p-6 md:p-12 text-white">
      <div className="max-w-md mx-auto bg-neutral-950/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <h2 className="text-2xl font-black mb-2 tracking-tighter">Feedback do Treino</h2>
        <p className="text-neutral-500 mb-10 text-[10px] uppercase tracking-widest">Como você se sentiu hoje?</p>
        
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Intensidade (1 a 10)</label>
            <div className="grid grid-cols-5 gap-2 mt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button 
                  key={num}
                  onClick={() => setForm({...form, intensidade: num})}
                  className={`h-12 rounded-xl text-xs font-black transition-all duration-300 ${form.intensidade === num ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Como foi seu desempenho?</label>
            <select 
              className="w-full p-4 mt-3 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white"
              onChange={(e) => setForm({...form, sentimento: e.target.value})}
            >
              <option className="bg-neutral-900" value="">Selecione...</option>
              <option className="bg-neutral-900" value="Energizado">Energizado ⚡</option>
              <option className="bg-neutral-900" value="Cansado">Cansado 😴</option>
              <option className="bg-neutral-900" value="Desafiador">Desafiador 🔥</option>
              <option className="bg-neutral-900" value="Normal">Dentro do planejado ✅</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Anotações para o Personal</label>
            <textarea 
              className="w-full p-4 mt-3 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white min-h-[120px]"
              placeholder="Ex: Tive dificuldade no exercício X..."
              onChange={(e) => setForm({...form, observacoes: e.target.value})}
            />
          </div>
        </div>
        
        <button 
          onClick={salvarFeedback} 
          disabled={loading}
          className="w-full mt-10 bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:bg-neutral-800"
        >
          {loading ? "Enviando..." : "Enviar Feedback"}
        </button>
      </div>
    </main>
  );
}