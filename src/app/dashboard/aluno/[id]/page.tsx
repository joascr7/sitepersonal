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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data, error } = await supabase
      .from('feedbacks_treino')
      .select('*')
      .eq('aluno_id', id)
      .order('data_criacao', { ascending: false });

    if (!error) setFeedbacks(data || []);
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
    const { error } = await supabase.from('feedbacks_treino').delete().eq('id', id);
    if (!error) fetchFeedbacks();
    else alert("Erro ao excluir: " + error.message);
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
    } else alert("Erro ao salvar: " + error.message);
  };

  if (loading) return <main className="flex items-center justify-center min-h-screen text-gray-400 font-bold">Carregando dados...</main>;

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header de Perfil Premium */}
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-10 flex flex-col md:flex-row items-center gap-8">
          <img src={aluno?.avatar_url || 'https://via.placeholder.com/150'} className="w-28 h-28 rounded-3xl object-cover shadow-lg border border-gray-100" />
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{aluno?.nome}</h1>
            <p className="text-blue-600 font-bold bg-blue-50 px-4 py-1 rounded-full inline-block text-sm">Objetivo: {aluno?.objetivo || 'Não definido'}</p>
          </div>
        </section>

        {/* Abas Premium */}
        <div className="flex gap-8 mb-10 border-b border-gray-200">
          {['treinos', 'evolucao', 'feedback'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => { setAbaAtiva(tab); router.replace(`?aba=${tab}`) }} 
              className={`pb-4 font-black text-xs uppercase tracking-[0.2em] transition-all border-b-2 ${abaAtiva === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Conteúdo Treinos */}
        {abaAtiva === 'treinos' && (
          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            {fichas.map((f) => (
              <div key={f.id} className="border-b border-gray-50 py-6 flex justify-between items-center group transition-all">
                <button onClick={() => router.push(`/dashboard/aluno/${id}/treino/${f.id}`)} className="font-bold text-gray-900 text-lg hover:text-blue-600 transition-colors">
                  {f.nome_treino}
                </button>
                <button onClick={(e) => excluirFicha(e, f.id)} className="text-gray-300 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Excluir</button>
              </div>
            ))}
            <a href={`/dashboard/aluno/${id}/nova-ficha`} className="mt-10 block w-full text-center bg-gray-900 text-white p-5 rounded-2xl font-black hover:bg-black transition-all active:scale-[0.98]">
              + Criar Nova Ficha
            </a>
          </section>
        )}

        {/* Conteúdo Evolução */}
        {abaAtiva === 'evolucao' && (
          <section className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black tracking-tighter">Progresso de Medidas</h2>
              <button onClick={() => setIsModalAvaliacaoOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">+ Nova Avaliação</button>
            </div>
            
            <div className="h-72 w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...historico].filter(a => a.peso && !a.tipo).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="data_avaliacao" hide />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="peso" stroke="#2563eb" strokeWidth={4} dot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-6">
              {historico.filter(a => !a.tipo).map((av) => (
                <div key={av.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative group">
                  <button onClick={() => excluirAvaliacao(av.id)} className="absolute top-8 right-8 text-gray-300 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Excluir</button>
                  <p className="font-black text-xl mb-6 text-gray-900">{new Date(av.data_avaliacao).toLocaleDateString()}</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(av).map(([key, val]: any) => {
                      if (['id', 'aluno_id', 'data_avaliacao', 'observacoes', 'tipo'].includes(key) || !val) return null;
                      return (
                        <div key={key} className="bg-gray-50 p-5 rounded-2xl">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{key.replace('_', ' ')}</p>
                          <p className="font-black text-lg text-gray-900">{val}<span className="text-[10px] text-gray-400 ml-1">{['peso', 'gordura'].includes(key) ? 'kg/%' : 'cm'}</span></p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Conteúdo Feedback */}
        {abaAtiva === 'feedback' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-black tracking-tighter">Feedbacks</h2>
            {feedbacks.map((f) => (
              <div key={f.id} className="bg-gray-900 p-8 rounded-3xl text-white relative shadow-xl">
                <button onClick={() => excluirFeedback(f.id)} className="absolute top-8 right-8 text-gray-500 hover:text-red-400 font-bold text-[10px] uppercase tracking-widest">Excluir</button>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">{new Date(f.data_criacao).toLocaleDateString()}</p>
                <p className="font-bold text-sm mb-4 bg-white/10 inline-block px-3 py-1 rounded-full">Intensidade: {f.intensidade}/10</p>
                <p className="text-xl italic font-medium leading-relaxed text-gray-100">"{f.observacoes}"</p>
              </div>
            ))}
          </section>
        )}

        {/* Modal Avaliação Premium */}
        {isModalAvaliacaoOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-3xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-black mb-8">Nova Avaliação</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(medidas).filter(k => k !== 'observacoes').map((key) => (
                  <div key={key}>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{key.replace('_', ' ')}</label>
                    <input type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl mt-1 font-bold outline-none focus:ring-2 focus:ring-gray-200 transition-all" onChange={(e) => setMedidas({...medidas, [key]: e.target.value})} />
                  </div>
                ))}
              </div>
              <textarea className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl mt-4 outline-none font-medium h-24" placeholder="Observações..." onChange={(e) => setMedidas({...medidas, observacoes: e.target.value})} />
              <div className="flex gap-4 mt-10">
                <button onClick={() => setIsModalAvaliacaoOpen(false)} className="flex-1 p-4 bg-gray-100 rounded-2xl font-bold hover:bg-gray-200 transition-all">Cancelar</button>
                <button onClick={salvarAvaliacaoCompleta} className="flex-1 p-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all">Salvar Medidas</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function DetalheAluno({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="flex items-center justify-center min-h-screen text-gray-400">Carregando...</main>}><DetalheAlunoContent params={params} /></Suspense>;
}