'use client';
import { useEffect, useState, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function DetalheAlunoContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [aluno, setAluno] = useState<any>(null);
  const [fichas, setFichas] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState(searchParams.get('aba') || 'treinos');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isModalAvaliacaoOpen, setIsModalAvaliacaoOpen] = useState(false);
  const [medidas, setMedidas] = useState({
    peso: '', gordura: '', torax: '', ombros: '', abdomen: '', 
    cintura: '', quadril: '', braco_direito: '', braco_esquerdo: '', observacoes: ''
  });

  useEffect(() => {
    if (!id) return;
    const carregarDados = async () => {
      setLoading(true);
      await Promise.all([fetchDadosAluno(), fetchHistorico(), fetchFichas(), fetchFeedbacks()]);
      setLoading(false);
    };
    carregarDados();
  }, [id]);

const fetchFeedbacks = async () => {
  // 1. Quem é o personal logado?
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 2. Queremos buscar feedbacks onde:
  // - O personal_id da tabela seja o ID do personal logado
  // - O aluno_id da tabela seja o ID da página (const { id } = use(params))
  
  const { data, error } = await supabase
    .from('feedbacks_treino')
    .select('*')
    .eq('aluno_id', id) // <--- O id vem dos params (ID do aluno da página)
    // .eq('personal_id', user.id) // <--- Remova este filtro temporariamente para testar
    .order('data_criacao', { ascending: false });

  if (error) {
    console.error("ERRO:", error);
  } else {
    console.log("Feedbacks encontrados:", data);
    setFeedbacks(data || []);
  }
};

  const fetchDadosAluno = async () => {
    const { data } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
    if (data) setAluno(data);
  };

  const fetchHistorico = async () => {
    const { data, error } = await supabase
      .from('avaliacoes_fisicas')
      .select('*')
      .eq('aluno_id', id)
      .order('data_avaliacao', { ascending: false });
    if (!error) setHistorico(data || []);
  };

  const fetchFichas = async () => {
    const { data } = await supabase.from('fichas').select('*').eq('aluno_id', id);
    if (data) {
      const processadas = data.map(f => ({
        ...f,
        exercicios: typeof f.exercicios === 'string' ? JSON.parse(f.exercicios || '[]') : (f.exercicios || [])
      }));
      setFichas(processadas);
    }
  };

  const excluirFeedback = async (id: string) => {
  if (!confirm("Tem certeza que deseja excluir este feedback?")) return;

  const { error } = await supabase
    .from('feedbacks_treino')
    .delete()
    .eq('id', id);

  if (error) {
    alert("Erro ao excluir: " + error.message);
  } else {
    // Recarrega os dados para o usuário ver a lista atualizada
    fetchFeedbacks(); 
  }
};

  const excluirFicha = async (e: React.MouseEvent, fichaId: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta ficha? Esta ação é irreversível.")) return;
    const { error } = await supabase.from('fichas').delete().eq('id', fichaId);
    if (!error) fetchFichas();
    else alert("Erro ao excluir: " + error.message);
  };

  const excluirAvaliacao = async (avaliacaoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    const { error } = await supabase.from('avaliacoes_fisicas').delete().eq('id', avaliacaoId);
    if (!error) fetchHistorico();
    else alert("Erro ao excluir: " + error.message);
  };

  const salvarAvaliacaoCompleta = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('avaliacoes_fisicas').insert({
      aluno_id: id,
      personal_id: user?.id,
      data_avaliacao: new Date().toISOString(),
      ...medidas
    });
    if (!error) {
      setIsModalAvaliacaoOpen(false);
      setMedidas({ peso: '', gordura: '', torax: '', ombros: '', abdomen: '', cintura: '', quadril: '', braco_direito: '', braco_esquerdo: '', observacoes: '' });
      fetchHistorico();
      alert("Registro salvo com sucesso!");
    } else alert("Erro ao salvar: " + error.message);
  };

  if (loading) return <main className="p-10 text-center text-gray-500">Carregando...</main>;

  return (
    <main className="p-10 bg-gray-50 min-h-screen">
      <section className="bg-white p-8 rounded-3xl shadow-sm mb-8 flex items-center gap-8 border border-gray-100">
        <img src={aluno?.avatar_url || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-full object-cover border-4 border-blue-50" />
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{aluno?.nome}</h1>
          <p className="text-gray-500 font-medium">Objetivo: {aluno?.objetivo || 'Nenhum definido'}</p>
        </div>
      </section>

      <div className="flex gap-6 mb-8 border-b border-gray-200">
        <button onClick={() => { setAbaAtiva('treinos'); router.replace(`?aba=treinos`) }} className={`pb-3 font-black text-sm uppercase tracking-widest ${abaAtiva === 'treinos' ? 'border-b-2 border-black text-black' : 'text-gray-400'}`}>Fichas</button>
        <button onClick={() => { setAbaAtiva('evolucao'); router.replace(`?aba=evolucao`) }} className={`pb-3 font-black text-sm uppercase tracking-widest ${abaAtiva === 'evolucao' ? 'border-b-2 border-black text-black' : 'text-gray-400'}`}>Evolução</button>
        <button onClick={() => { setAbaAtiva('feedback'); router.replace(`?aba=feedback`) }} className={`pb-3 font-black text-sm uppercase tracking-widest ${abaAtiva === 'feedback' ? 'border-b-2 border-black text-black' : 'text-gray-400'}`}>Feedback</button>
      </div>

      {abaAtiva === 'treinos' ? (
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          {fichas.map((f) => (
            <div key={f.id} className="border-b border-gray-50 py-6 flex justify-between items-center group">
              <button onClick={() => router.push(`/dashboard/aluno/${id}/treino/${f.id}`)} className="font-bold text-gray-900 text-lg hover:text-blue-600 transition">
                {f.nome_treino}
              </button>
              <button onClick={(e) => excluirFicha(e, f.id)} className="text-red-400 hover:text-red-600 font-bold text-xs uppercase opacity-0 group-hover:opacity-100 transition">Excluir</button>
            </div>
          ))}
          <a href={`/dashboard/aluno/${id}/nova-ficha`} className="mt-8 block w-full text-center bg-black text-white p-4 rounded-2xl font-black hover:bg-gray-800 transition">+ Criar Nova Ficha</a>
        </section>
      ) : abaAtiva === 'evolucao' ? (
        <section className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black tracking-tighter">Histórico de Medidas</h2>
            <button onClick={() => setIsModalAvaliacaoOpen(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition">+ Nova Avaliação</button>
          </div>
          <div className="h-72 w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...historico].filter(a => a.peso && !a.tipo).reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f9f9f9" />
                <XAxis dataKey="data_avaliacao" tickFormatter={(d) => new Date(d).toLocaleDateString()} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="peso" stroke="#2563eb" strokeWidth={4} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-6">
            {historico.filter(a => !a.tipo).map((av) => (
              <div key={av.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative">
                <button onClick={() => excluirAvaliacao(av.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 font-bold text-xs uppercase">Excluir</button>
                <p className="font-black text-xl mb-6">{new Date(av.data_avaliacao).toLocaleDateString()}</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(av).map(([key, val]: any) => {
                    if (['id', 'aluno_id', 'data_avaliacao', 'observacoes', 'tipo'].includes(key) || !val) return null;
                    return (
                      <div key={key} className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{key.replace('_', ' ')}</p>
                        <p className="font-black text-md">{val} {['peso', 'gordura'].includes(key) ? 'kg/%' : 'cm'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <h2 className="text-2xl font-black">Feedbacks Registrados</h2>
          {feedbacks.map((f) => (
            <div key={f.id} className="bg-black p-8 rounded-3xl text-white relative mb-4">
              <button onClick={async () => { if (confirm("Excluir feedback?")) { await supabase.from('feedbacks_treino').delete().eq('id', f.id); fetchFeedbacks(); } }} className="absolute top-4 right-4 text-red-400 font-bold text-[10px] uppercase">Excluir</button>
              <p className="text-xs text-gray-400 mb-2">{new Date(f.data_criacao).toLocaleDateString()}</p>
              <p className="font-bold text-sm">Intensidade: {f.intensidade}/10 - {f.sentimento}</p>
              <p className="text-lg italic mt-2 leading-relaxed">"{f.observacoes}"</p>
            </div>
          ))}
        </section>
      )}

      {isModalAvaliacaoOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black mb-6">Registrar Medidas</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(medidas).filter(k => k !== 'observacoes').map((key) => (
                <div key={key}>
                  <label className="text-[10px] font-bold uppercase text-gray-400">{key.replace('_', ' ')}</label>
                  <input type="number" className="w-full p-4 border rounded-2xl mt-1 font-bold" onChange={(e) => setMedidas({...medidas, [key]: e.target.value})} />
                </div>
              ))}
            </div>
            <textarea className="w-full p-4 border rounded-2xl mt-4" placeholder="Observações" onChange={(e) => setMedidas({...medidas, observacoes: e.target.value})} />
            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsModalAvaliacaoOpen(false)} className="flex-1 p-4 bg-gray-100 rounded-2xl font-bold">Cancelar</button>
              <button onClick={salvarAvaliacaoCompleta} className="flex-1 p-4 bg-black text-white rounded-2xl font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function DetalheAluno({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense><DetalheAlunoContent params={params} /></Suspense>;
}