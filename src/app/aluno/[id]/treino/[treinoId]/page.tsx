'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ToastSucesso from '@/components/ui/ToastSucesso';

export default function DetalheTreino({ params }: { params: Promise<{ id: string; treinoId: string }> }) {
  const resolvedParams = use(params);
  const { id, treinoId } = resolvedParams;
  const router = useRouter();

  const [ficha, setFicha] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [concluidos, setConcluidos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessoesContador, setSessoesContador] = useState(0);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const exercicios = ficha?.descricao ? (typeof ficha.descricao === 'string' ? JSON.parse(ficha.descricao) : ficha.descricao) : [];
  const totalExercicios = exercicios.length;
  const progresso = totalExercicios > 0 ? Math.round((concluidos.length / totalExercicios) * 100) : 0;
  const todosFinalizados = totalExercicios > 0 && concluidos.length === totalExercicios;

  useEffect(() => {
    if (!treinoId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [fichaRes, regRes, concRes] = await Promise.all([
          supabase.from('fichas').select('*').eq('id', treinoId).maybeSingle(),
          supabase.from('registro_series').select('*').eq('treino_id', treinoId),
          supabase.from('conclusoes_treino').select('id', { count: 'exact' }).eq('treino_id', treinoId)
        ]);

        setFicha(fichaRes.data);
        if (regRes.data) {
          setRegistros(regRes.data);
          const initialInputs: Record<string, string> = {};
          regRes.data.forEach((r: any) => {
            initialInputs[`${r.exercicio_nome}-${r.serie_index}`] = r.carga.toString();
          });
          setInputValues(initialInputs);
        }
        setSessoesContador(concRes.count || 0);
      } catch (err) {
        console.error("Erro ao carregar:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [treinoId]);

  const registrarCarga = async (nomeExercicio: string, carga: number, reps: number, serieIndex: number) => {
    if (!carga || carga <= 0) return;

    const registroExistente = registros.find(r => r.exercicio_nome === nomeExercicio && r.serie_index === serieIndex);
    const payload = { aluno_id: id, treino_id: treinoId, exercicio_nome: nomeExercicio, carga, repeticoes: reps, serie_index: serieIndex };
    const registroParaSalvar = registroExistente ? { ...payload, id: registroExistente.id } : payload;

    const { data, error } = await supabase.from('registro_series').upsert(registroParaSalvar as any).select();
    
    if (!error && data) {
      setRegistros(prev => [...prev.filter(r => r.id !== data[0].id), ...data]);
    }
  };

  const finalizarSessao = async () => {
  setLoading(true);
  try {
    // 1. Prepara os registros mapeando as cargas dos inputs com os dados originais
    const registrosParaSalvar = Object.entries(inputValues).map(([key, carga]) => {
      const [exercicio_nome, serie_index] = key.split('-');
      
      const serieOriginal = registros.find(r => 
        r.exercicio_nome === exercicio_nome && r.serie_index === Number(serie_index)
      );

      return {
        ...(serieOriginal?.id ? { id: serieOriginal.id } : {}),
        aluno_id: id,
        treino_id: treinoId,
        exercicio_nome,
        serie_index: Number(serie_index),
        carga: Number(carga) || 0,
        repeticoes: serieOriginal?.repeticoes || 12, 
        data_execucao: new Date().toISOString()
      };
    });

    // 2. Salva em lote no Supabase com Upsert
    const { error: errorSeries } = await supabase
      .from('registro_series')
      .upsert(registrosParaSalvar);

    if (errorSeries) throw new Error("Erro ao salvar séries: " + errorSeries.message);

    // 3. Grava conclusão e histórico simultaneamente
    const [conclusaoRes, historicoRes] = await Promise.all([
      supabase.from('conclusoes_treino').insert({ aluno_id: id, treino_id: treinoId }),
      supabase.from('historico_treinos').insert({ aluno_id: id, data_treino: new Date().toISOString() })
    ]);

    if (conclusaoRes.error || historicoRes.error) {
      throw new Error("Erro ao registrar conclusão da sessão.");
    }

    // 4. Feedback Profissional (Toast em vez de alert)
    // Certifique-se de ter definido: const [showToast, setShowToast] = useState(false);
    setShowToast(true); 
    
  } catch (err) {
    console.error("Erro no processo de finalização:", err);
    // Aqui você também poderia ter um Toast de Erro se desejar
    alert("Não foi possível finalizar o treino. Verifique sua conexão.");
  } finally {
    setLoading(false);
  }
};

  const renderizarVideo = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();
    let embedUrl = cleanUrl.includes("shorts/") ? cleanUrl.replace("shorts/", "embed/") : cleanUrl.replace("watch?v=", "embed/");
    const isYoutube = embedUrl.includes("youtube.com") || embedUrl.includes("youtu.be");
    
    return (
      <div className="w-full bg-black rounded-3xl overflow-hidden mb-6 aspect-video shadow-lg">
        {isYoutube ? (
          <iframe className="w-full h-full" src={embedUrl.split('&')[0]} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <video controls playsInline className="w-full h-full" src={cleanUrl} />
        )}
      </div>
    );
  };

  if (loading) return <main className="p-10 text-center font-bold">CARREGANDO DADOS...</main>;

  return (
    <main className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="font-bold text-gray-400 uppercase text-xs">Voltar</button>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-gray-500">Progresso: {progresso}%</p>
          <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-black transition-all" style={{ width: `${progresso}%` }}></div>
          </div>
        </div>
      </div>

      <header className="mb-10">
        <h1 className="text-4xl font-black mb-2 tracking-tighter">{ficha?.nome_treino || "Treino"}</h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Sessões totais realizadas: {sessoesContador}</p>
      </header>
      
      {exercicios.map((ex: any, exIndex: number) => {
        const estaConcluido = concluidos.includes(exIndex);
        return (
          <div key={exIndex} className={`mb-8 p-6 bg-white border rounded-3xl shadow-sm ${estaConcluido ? 'border-black' : 'border-gray-100'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900">{ex.nome}</h3>
              <button 
                onClick={() => !estaConcluido && setConcluidos([...concluidos, exIndex])}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${estaConcluido ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {estaConcluido ? 'Finalizado' : 'Marcar Exercício'}
              </button>
            </div>
            
            {ex.video && renderizarVideo(ex.video)}

            <table className="w-full text-sm text-center">
              <thead className="text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-100">
                <tr><th className="pb-3">Reps</th><th className="pb-3">Carga Recomendada</th><th className="pb-3">Intervalo</th><th className="pb-3">Sua Carga</th></tr>
              </thead>
              <tbody>
                {(ex.series || []).map((s: any, sIndex: number) => {
                  const key = `${ex.nome}-${sIndex}`;
                  return (
                    <tr key={sIndex} className="border-b border-gray-50">
                      <td className="py-4 font-bold">{s.reps || '-'}</td>
                      <td className="py-4 text-gray-400">{s.carga || 0}kg</td>
                      <td className="py-4 font-black">{s.intervalo || 0}s</td>
                      <td className="py-4">
                        <input 
                          type="number" 
                          value={inputValues[key] || ''}
                          onChange={(e) => setInputValues(prev => ({ ...prev, [key]: e.target.value }))}
                          onBlur={(e) => registrarCarga(ex.nome, Number(e.target.value), s.reps, sIndex)}
                          placeholder="0"
                          className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      <button 
        onClick={finalizarSessao} 
        disabled={!todosFinalizados} 
        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${todosFinalizados ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
      >
        {todosFinalizados ? 'Finalizar Sessão de Treino' : 'Conclua todos os exercícios para finalizar'}
      </button>

      {/* Modal de sucesso ao concluir treino */}
      {showToast && (
  <ToastSucesso 
    mensagem="Treino registrado com sucesso. Dados de progresso consolidados." 
    onClose={() => router.push(`/aluno/${id}`)} 
  />
)}
    </main>
  );
}