'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function DetalheTreino({ params }: { params: Promise<{ id: string; treinoId: string }> }) {
  const resolvedParams = use(params);
  const { id, treinoId } = resolvedParams;
  const router = useRouter();

  const [ficha, setFicha] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [concluidos, setConcluidos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [treinoConcluido, setTreinoConcluido] = useState(false);

  const exercicios = ficha?.descricao ? (typeof ficha.descricao === 'string' ? JSON.parse(ficha.descricao) : ficha.descricao) : [];
  const todosFinalizados = exercicios.length > 0 && concluidos.length === exercicios.length;

  useEffect(() => {
    if (!treinoId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [fichaRes, regRes, concRes] = await Promise.all([
          supabase.from('fichas').select('*').eq('id', treinoId).maybeSingle(),
          supabase.from('registro_series').select('*').eq('treino_id', treinoId),
          supabase.from('conclusoes_treino').select('*').eq('treino_id', treinoId).limit(1)
        ]);

        setFicha(fichaRes.data);
        if (regRes.data) setRegistros(regRes.data);
        if (concRes.data && concRes.data.length > 0) setTreinoConcluido(true);
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

  const finalizarTreino = async () => {
    const { error } = await supabase.from('conclusoes_treino').insert({ aluno_id: id, treino_id: treinoId });
    if (error) alert("Erro ao finalizar: " + error.message);
    else { setTreinoConcluido(true); router.refresh(); }
  };

  const renderizarVideo = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();
    let embedUrl = cleanUrl.includes("shorts/") ? cleanUrl.replace("shorts/", "embed/") : cleanUrl.replace("watch?v=", "embed/");
    const isYoutube = embedUrl.includes("youtube.com") || embedUrl.includes("youtu.be");
    
    return (
      <div className="w-full bg-black rounded-2xl overflow-hidden mb-6 aspect-video">
        {isYoutube ? (
          <iframe className="w-full h-full" src={embedUrl.split('&')[0]} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <video controls playsInline className="w-full h-full" src={cleanUrl} />
        )}
      </div>
    );
  };

  if (loading) return <main className="p-10 text-center">Carregando...</main>;

  return (
    <main className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => router.back()} className="font-bold text-gray-400">← Voltar</button>
        {treinoConcluido ? <span className="text-green-600 font-black text-sm">✅ TREINO CONCLUÍDO!</span> : (
          <button onClick={finalizarTreino} disabled={!todosFinalizados} className={`${todosFinalizados ? 'bg-green-500' : 'bg-gray-300'} text-white px-6 py-2 rounded-xl font-bold transition-all`}>
            Finalizar Treino
          </button>
        )}
      </div>

      <h1 className="text-4xl font-black mb-10 tracking-tighter">{ficha?.nome_treino || "Treino"}</h1>
      
      {exercicios.map((ex: any, exIndex: number) => {
        const estaConcluido = concluidos.includes(exIndex);
        return (
          <div key={exIndex} className={`mb-8 p-6 bg-white border rounded-3xl shadow-sm ${estaConcluido ? 'border-green-200' : 'border-gray-100'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-gray-900">{ex.nome}</h3>
              <button 
                onClick={() => !estaConcluido && setConcluidos([...concluidos, exIndex])}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${estaConcluido ? 'bg-green-100 text-green-700' : 'bg-gray-900 text-white'}`}
              >
                {estaConcluido ? '✅ Finalizado' : 'Finalizar Exercício'}
              </button>
            </div>
            
            {ex.video && renderizarVideo(ex.video)}

            <table className="w-full text-sm text-center">
              <thead className="text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-100">
                <tr><th className="pb-3">Reps</th><th className="pb-3">Carga Recomendada</th><th className="pb-3">Intervalo</th><th className="pb-3">Sua Carga</th></tr>
              </thead>
              <tbody>
                {(ex.series || []).map((s: any, sIndex: number) => {
                  const reg = registros.find(r => r.exercicio_nome === ex.nome && r.serie_index === sIndex);
                  return (
                    <tr key={sIndex} className="border-b border-gray-50">
                      <td className="py-4 font-bold">{s.reps || '-'}</td>
                      <td className="py-4 text-gray-400">{s.carga || 0}kg</td>
                      <td className="py-4 font-black text-blue-600">{s.intervalo || 0}s</td>
                      <td className="py-4">
                        <input 
                          type="number" disabled={estaConcluido} defaultValue={reg?.carga || ''} placeholder="0"
                          className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold"
                          onBlur={(e) => registrarCarga(ex.nome, Number(e.target.value), s.reps, sIndex)}
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
    </main>
  );
}