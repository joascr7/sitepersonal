'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ModalSelecaoAlunos from '@/components/ModalSelecaoAlunos';

export default function DetalheTreino({ params }: { params: Promise<{ id: string; treinoId: string }> }) {
  const resolvedParams = use(params);
  const { id, treinoId } = resolvedParams;
  const router = useRouter();

  const [ficha, setFicha] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPersonal, setIsPersonal] = useState(false);
  const [treinoConcluido, setTreinoConcluido] = useState(false);

  // Variável para saber se o aluno já registrou algo
  const temRegistros = registros.length > 0;

  useEffect(() => {
    if (!treinoId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: fichaData, error: fichaError } = await supabase
          .from('fichas')
          .select('*')
          .eq('id', treinoId)
          .maybeSingle();

        if (fichaError) throw new Error(fichaError.message);
        setFicha(fichaData);

        const { data: regData } = await supabase
          .from('registro_series')
          .select('*')
          .eq('treino_id', treinoId);
        
        if (regData) setRegistros(regData);

        const { data: { user } } = await supabase.auth.getUser();
        const ehDono = !!(user && fichaData && String(fichaData.personal_id) === String(user.id));
        setIsPersonal(ehDono);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [treinoId]);

  useEffect(() => {
    const checkStatus = async () => {
      const { data } = await supabase
        .from('conclusoes_treino')
        .select('*')
        .eq('treino_id', treinoId)
        .order('data_conclusao', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) setTreinoConcluido(true);
    };
    checkStatus();
  }, [treinoId]);

  const finalizarTreino = async () => {
    if (!temRegistros) {
      alert("Você precisa registrar pelo menos uma carga para finalizar o treino.");
      return;
    }
    await supabase.from('conclusoes_treino').insert({ aluno_id: id, treino_id: treinoId });
    setTreinoConcluido(true);
  };

  const refazerTreino = async () => {
    await supabase.from('conclusoes_treino').delete().eq('treino_id', treinoId);
    setTreinoConcluido(false);
  };

  const registrarCarga = async (nomeExercicio: string, carga: number, reps: number) => {
    if (!carga || carga <= 0) return;
    const { data, error } = await supabase.from('registro_series').insert({
      aluno_id: id,
      treino_id: treinoId,
      exercicio_nome: nomeExercicio,
      carga: carga,
      repeticoes: reps
    }).select();
    
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else if (data) {
      setRegistros(prev => [...prev, ...data]);
    }
  };

  const renderizarExercicios = () => {
    if (!ficha?.descricao) return <p className="text-gray-500 text-center p-10">Treino vazio.</p>;
    try {
      const exercicios = typeof ficha.descricao === 'string' ? JSON.parse(ficha.descricao) : ficha.descricao;
      return exercicios.map((ex: any, index: number) => (
        <div key={index} className="mb-8 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-6">{ex.nome}</h3>
          
          <table className="w-full text-sm text-center">
            <thead className="text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-100">
              <tr><th className="pb-3">Séries</th><th className="pb-3">Carga Planejada</th><th className="pb-3">Executado (kg)</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(ex.series || []).map((s: any, sIndex: number) => (
                <tr key={sIndex}>
                  <td className="py-4 font-bold text-gray-900">{s.reps || '-'}</td>
                  <td className="py-4 text-gray-600">{s.carga || '0'} kg</td>
                  <td className="py-4">
                    <input 
                      type="number" 
                      placeholder="kg"
                      className="w-20 p-2 bg-gray-50 border border-gray-200 rounded-lg text-center"
                      onBlur={(e) => registrarCarga(ex.nome, Number(e.target.value), s.reps)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ));
    } catch (e) {
      return <p className="text-red-500 p-4 text-center">Erro ao processar dados.</p>;
    }
  };

  if (loading) return <main className="p-10 text-center text-gray-500">Carregando...</main>;

  return (
    <main className="max-w-4xl mx-auto p-6 md:p-10 bg-gray-50 min-h-screen">
      <ModalSelecaoAlunos isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={() => {}} />

      <div className="flex justify-between items-center mb-10">
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-400 hover:text-gray-900">← Voltar</button>
        
        {/* Botão Inteligente */}
        {treinoConcluido ? (
          <div className="flex items-center gap-4">
            <span className="text-green-600 font-black text-sm">✅ TREINO CONCLUÍDO!</span>
            <button onClick={refazerTreino} className="text-xs underline text-gray-500">Refazer</button>
          </div>
        ) : (
          <button 
            onClick={finalizarTreino} 
            disabled={!temRegistros}
            className={`${temRegistros ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'} text-white px-6 py-2 rounded-xl font-bold transition-all`}
          >
            {temRegistros ? "Finalizar Treino" : "Registre uma carga"}
          </button>
        )}
      </div>

      <h1 className="text-4xl font-black text-gray-900 mb-10 tracking-tighter">{ficha?.nome_treino || "Treino"}</h1>
      {renderizarExercicios()}
    </main>
  );
}