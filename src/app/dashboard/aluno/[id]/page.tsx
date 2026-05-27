'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DetalheAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [aluno, setAluno] = useState<any>(null);
  const [fichas, setFichas] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('treinos');

  useEffect(() => {
    if (!id) return;
    
    const carregarDados = async () => {
      setLoading(true);
      await Promise.all([
        fetchDadosAluno(),
        fetchHistorico(),
        fetchFichas()
      ]);
      setLoading(false);
    };

    carregarDados();
  }, [id]);

  const fetchDadosAluno = async () => {
    const { data, error } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
    if (data) setAluno(data);
    else console.error("Erro ao buscar aluno:", error);
  };

  const fetchHistorico = async () => {
    const { data } = await supabase
      .from('evolucao')
      .select('*')
      .eq('aluno_id', id)
      .order('data_medicao', { ascending: true });
    if (data) setHistorico(data);
  };

  const fetchFichas = async () => {
    const { data } = await supabase
      .from('fichas')
      .select('*')
      .eq('aluno_id', id);
    
    if (data) {
      // Processa a coluna de exercícios garantindo que seja um array
      const processadas = data.map(f => ({
        ...f,
        exercicios: typeof f.exercicios === 'string' ? JSON.parse(f.exercicios || '[]') : (f.exercicios || [])
      }));
      setFichas(processadas);
    }
  };

  const salvarVideo = async (fichaId: string, exercicioIndex: number, url: string) => {
    const ficha = fichas.find(f => f.id === fichaId);
    if (!ficha) return;

    const novosExercicios = [...ficha.exercicios];
    novosExercicios[exercicioIndex].video_url = url;
    
    const { error } = await supabase
      .from('fichas')
      .update({ exercicios: novosExercicios })
      .eq('id', fichaId);
      
    if (!error) {
      alert("Vídeo salvo com sucesso!");
      fetchFichas();
    } else {
      console.error("Erro ao salvar vídeo:", error);
    }
  };

  const uploadFotoEvolucao = async (event: any, tipo: 'antes' | 'depois', evolucaoId: string) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileName = `${id}-${tipo}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
    
    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('evolucao')
        .update({ [`foto_${tipo}`]: data.publicUrl })
        .eq('id', evolucaoId);
        
      if (!updateError) {
        fetchHistorico();
      }
    }
  };

  const handleVerTreino = (treinoId: string) => {
    const isDashboard = window.location.pathname.includes('/dashboard');
    const path = isDashboard 
      ? `/dashboard/aluno/${id}/treino/${treinoId}` 
      : `/aluno/${id}/treino/${treinoId}`;
    router.push(path);
  };

  if (loading) return <main className="p-10 text-center">Carregando...</main>;
  
  if (!aluno) return (
    <main className="p-10 text-center">
      <h1 className="text-xl text-red-500 font-bold">Aluno não encontrado</h1>
      <button onClick={() => router.back()} className="mt-4 text-blue-600 underline">Voltar</button>
    </main>
  );

  return (
    <main className="p-10 bg-gray-50 min-h-screen">
      <section className="bg-white p-8 rounded-xl shadow-md mb-8 flex flex-col md:flex-row items-center gap-8">
        <img src={aluno.avatar_url || 'https://via.placeholder.com/150'} alt="Foto" className="w-32 h-32 rounded-full object-cover border-4 border-blue-100" />
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">{aluno.nome}</h1>
          <p className="text-gray-600">{aluno.telefone || 'Sem telefone'}</p>
          <p className="text-gray-600 italic">Objetivo: {aluno.objetivo || 'Nenhum'}</p>
        </div>
      </section>

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button onClick={() => setAbaAtiva('treinos')} className={`pb-2 font-bold ${abaAtiva === 'treinos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Fichas</button>
        <button onClick={() => setAbaAtiva('evolucao')} className={`pb-2 font-bold ${abaAtiva === 'evolucao' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Evolução</button>
      </div>

      {abaAtiva === 'treinos' ? (
        <section className="bg-white p-6 rounded-xl shadow-md">
          {fichas.map((f) => (
            <div key={f.id} className="border-b py-4">
              <button onClick={() => handleVerTreino(f.id)} className="font-bold text-blue-600 hover:underline">
                {f.nome_treino}
              </button>
              
              <div className="mt-2">
                {f.exercicios && f.exercicios.map((ex: any, index: number) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm my-1">
                    <span>{ex.nome}</span>
                    {ex.video_url ? (
                      <a href={ex.video_url} target="_blank" className="text-blue-500 underline font-bold">Ver Vídeo</a>
                    ) : (
                      <input 
                        placeholder="Link vídeo..." 
                        onBlur={(e) => salvarVideo(f.id, index, e.target.value)} 
                        className="border p-1 w-24 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {window.location.pathname.includes('/dashboard') && (
            <a href={`/dashboard/aluno/${id}/nova-ficha`} className="mt-6 block w-full text-center bg-gray-800 text-white p-3 rounded font-bold hover:bg-black transition">+ Criar Nova Ficha</a>
          )}
        </section>
      ) : (
        <section className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Gráfico e Fotos de Evolução</h2>
            <button 
              onClick={async () => {
                const { error } = await supabase.from('evolucao').insert({ 
                  aluno_id: id, 
                  data_medicao: new Date().toISOString().split('T')[0],
                  peso: 0 
                });
                if (!error) fetchHistorico();
              }}
              className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 text-sm"
            >
              + Nova Medição
            </button>
          </div>

          {historico.length > 0 ? (
            <>
              <div className="h-64 w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data_medicao" hide />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="peso" stroke="#16a34a" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid gap-4">
                {historico.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Antes</p>
                      {h.foto_antes ? <img src={h.foto_antes} className="w-20 h-20 object-cover rounded-md border" /> : <input type="file" onChange={(e) => uploadFotoEvolucao(e, 'antes', h.id)} className="w-20 text-[10px]" />}
                    </div>
                    <div className="text-center font-bold text-gray-700">
                      <p className="text-sm">{h.data_medicao}</p>
                      <p>{h.peso}kg</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Depois</p>
                      {h.foto_antes ? (h.foto_depois ? <img src={h.foto_depois} className="w-20 h-20 object-cover rounded-md border" /> : <input type="file" onChange={(e) => uploadFotoEvolucao(e, 'depois', h.id)} className="w-20 text-[10px]" />) : <span className="text-[10px] text-gray-400 w-20 text-center italic">Envie o "Antes" primeiro</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic text-center py-10">Nenhuma evolução registrada.</p>
          )}
        </section>
      )}
    </main>
  );
}