'use client';
import { useEffect, useState, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ControleFinanceiro from '@/components/ControleFinanceiro'; // Importação do novo componente

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
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [isModalAvaliacaoOpen, setIsModalAvaliacaoOpen] = useState(false);
  const [medidas, setMedidas] = useState({
    peso: '', gordura: '', torax: '', ombros: '', abdomen: '', 
    cintura: '', quadril: '', braco_direito: '', braco_esquerdo: '', observacoes: ''
  });

  useEffect(() => {
  if (!id) return;
  const carregarDados = async () => {
    setLoading(true);
    // Adicione fetchArquivos aqui no Promise.all
    await Promise.all([fetchDadosAluno(), fetchHistorico(), fetchFichas(), fetchFeedbacks(), fetchArquivos()]);
    setLoading(false);
  };
  carregarDados();
}, [id]);

const fetchArquivos = async () => {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('aluno_id', id);
    
    if (!error && data) setArquivos(data);
  };

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
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-10 flex flex-col md:flex-row items-center gap-8">
          <img src={aluno?.avatar_url || 'https://via.placeholder.com/150'} className="w-28 h-28 rounded-3xl object-cover shadow-lg border border-gray-100" />
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{aluno?.nome}</h1>
            <p className="text-blue-600 font-bold bg-blue-50 px-4 py-1 rounded-full inline-block text-sm">Objetivo: {aluno?.objetivo || 'Não definido'}</p>
          </div>
          {/* Integração do controle financeiro ao lado do perfil */}
          <div className="w-full md:w-auto">
             <ControleFinanceiro alunoId={id} initialStatus={aluno?.status_pagamento || 'pendente'} />
          </div>
        </section>

        <div className="flex gap-8 mb-10 border-b border-gray-200">
  {[
  { id: 'treinos', label: 'Programação de Treino' },
  { id: 'evolucao', label: 'Evolução Corporal' },
  { id: 'feedback', label: 'Feedbacks do Aluno' },
  { id: 'arquivos', label: 'Documentos/Exames' } // <--- Nova aba
].map((tab) => (
    <button 
      key={tab.id} 
      onClick={() => { setAbaAtiva(tab.id); router.replace(`?aba=${tab.id}`) }} 
      className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${
        abaAtiva === tab.id 
          ? 'border-gray-900 text-gray-900' 
          : 'border-transparent text-gray-400 hover:text-gray-600'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>

        {abaAtiva === 'treinos' && (
  <section className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fichas.length > 0 ? (
        fichas.map((f) => (
          <div 
            key={f.id} 
            className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">
                  Treino Ativo
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-2 tracking-tight">
                  {f.nome_treino}
                </h3>
                <p className="text-gray-400 text-xs mt-1">Criado em {new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <button 
                onClick={(e) => excluirFicha(e, f.id)} 
                className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                title="Remover ficha"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
              <button 
                onClick={() => router.push(`/dashboard/aluno/${id}/treino/${f.id}`)} 
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-900 hover:text-blue-600 transition-colors"
              >
                Visualizar Detalhes →
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
          <p className="text-gray-400 font-medium">Nenhuma ficha criada ainda.</p>
        </div>
      )}
    </div>

    {/* Botão de Nova Ficha com destaque */}
    <a 
      href={`/dashboard/aluno/${id}/nova-ficha`} 
      className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white p-6 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-black hover:shadow-lg transition-all active:scale-[0.99]"
    >
      <span className="text-xl">+</span> Criar Nova Ficha de Treino
    </a>
  </section>
)}

  {abaAtiva === 'evolucao' && (
  <section className="space-y-8">
    {/* Header com destaque */}
    <div className="flex justify-between items-end">
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-gray-900">Evolução Corporal</h2>
        <p className="text-gray-500 font-medium">Acompanhamento de metas e métricas.</p>
      </div>
      <button 
        onClick={() => setIsModalAvaliacaoOpen(true)} 
        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98]"
      >
        + Nova Avaliação
      </button>
    </div>

    {/* Gráfico Premium */}
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-96">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-black text-gray-900 tracking-tight">Progressão de Peso (kg)</h3>
        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Histórico de Peso</span>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={[...historico].filter(a => a.peso).reverse()}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="data_avaliacao" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
            cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="peso" 
            stroke="#2563eb" 
            strokeWidth={5} 
            dot={{ fill: '#2563eb', strokeWidth: 2, r: 6, stroke: '#fff' }} 
            activeDot={{ r: 8, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Lista de Avaliações */}
    <div className="space-y-6">
      {historico.filter(a => !a.tipo).map((av) => (
        <div key={av.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-black text-2xl text-gray-900">
                {new Date(av.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mt-1">Registro de Avaliação</p>
            </div>
            <button 
              onClick={() => excluirAvaliacao(av.id)} 
              className="text-gray-300 hover:text-red-500 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Excluir
            </button>
          </div>
          
          {/* Grid de Métricas Organizado com Filtro de Segurança */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(av).map(([key, val]: any) => {
              // Filtro de campos técnicos e valores vazios
              const camposProibidos = ['id', 'aluno_id', 'data_avaliacao', 'observacoes', 'tipo', 'personal_id', 'created_at', 'updated_at'];
              if (camposProibidos.includes(key) || val === null || val === undefined || val === '') return null;
              
              const isCorpo = ['peitoral', 'braco', 'cintura', 'quadril', 'coxa', 'ombros', 'torax', 'abdomen'].includes(key);
              
              return (
                <div key={key} className={`p-5 rounded-2xl ${isCorpo ? 'bg-indigo-50/50' : 'bg-gray-50'}`}>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">
                    {key.replace('_', ' ')}
                  </p>
                  <p className="font-black text-xl text-gray-900">
                    {val}
                    <span className="text-[10px] text-gray-400 ml-1 font-bold">
                      {['peso', 'gordura'].includes(key) ? (key === 'peso' ? 'kg' : '%') : 'cm'}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </section>
)}

{/* SEÇÃO DE FEEDBACKS */}
        {abaAtiva === 'feedback' && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-gray-900">Feedbacks de Treino</h2>
                <p className="text-gray-500 font-medium">O que o aluno está sentindo sobre a evolução.</p>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-4 py-2 rounded-full">
                {feedbacks.length} Registros
              </div>
            </div>

            <div className="grid gap-6">
              {feedbacks.length > 0 ? (
                feedbacks.map((f) => (
                  <div key={f.id} className="group relative bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${f.intensidade > 7 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          {f.intensidade}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Intensidade Percibida</p>
                          <p className="font-bold text-gray-900">Nível {f.intensidade} de 10</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => excluirFeedback(f.id)} 
                        className="text-gray-300 hover:text-red-500 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Excluir
                      </button>
                    </div>

                    <blockquote className="text-xl italic font-medium leading-relaxed text-gray-700 bg-gray-50 p-6 rounded-2xl border-l-4 border-gray-900">
                      "{f.observacoes}"
                    </blockquote>
                    
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-6">
                      Registrado em {new Date(f.data_criacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
                  <p className="text-gray-400 font-medium">Nenhum feedback disponível no momento.</p>
                </div>
              )}
            </div>
          </section>
        )}


      {abaAtiva === 'arquivos' && (
  <section className="space-y-8 animate-in fade-in duration-500">
    <div>
      <h2 className="text-3xl font-black tracking-tighter text-gray-900">Documentos e Exames</h2>
      <p className="text-gray-500 font-medium">Upload e gestão de arquivos do aluno.</p>
    </div>

    {/* Área de Upload */}
    <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 text-center">
      <label className="cursor-pointer flex flex-col items-center gap-4">
        <div className="p-4 bg-gray-50 rounded-2xl">
           <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        </div>
        <span className="font-black text-sm text-gray-900">Clique para enviar novo PDF</span>
        <input 
          type="file" 
          accept="application/pdf" 
          className="hidden" 
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const filePath = `${id}/${Date.now()}-${file.name}`;
            
            // 1. Upload
            const { error: uploadError } = await supabase.storage
              .from('documentos-alunos')
              .upload(filePath, file);

            if (uploadError) return alert("Erro ao subir arquivo.");

            // 2. Registro no banco
            await supabase.from('documentos').insert({ 
              aluno_id: id, 
              url: filePath, 
              nome_arquivo: file.name 
            });

            alert("Arquivo enviado com sucesso!"); 
            await fetchArquivos(); 
          }}
        />
      </label>
    </div>

    {/* Lista de Arquivos */}
    <div className="space-y-3">
      {arquivos && arquivos.length > 0 ? (
        arquivos.map((arq: any) => (
          <div key={arq.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-red-500 text-xl">📄</span>
              <span className="font-bold text-sm text-gray-700 truncate max-w-[200px]">{arq.nome_arquivo}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const { data } = supabase.storage.from('documentos-alunos').getPublicUrl(arq.url);
                  window.open(data.publicUrl, '_blank');
                }}
                className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors px-3"
              >
                Abrir
              </button>

              {/* Botão Excluir Premium */}
              <button 
                onClick={async () => {
                  if (!confirm("Tem certeza que deseja excluir este arquivo?")) return;
                  await supabase.storage.from('documentos-alunos').remove([arq.url]);
                  await supabase.from('documentos').delete().eq('id', arq.id);
                  await fetchArquivos();
                }}
                className="relative p-2 rounded-xl text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all duration-300"
                title="Remover arquivo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-400 font-medium py-10">Nenhum arquivo enviado ainda.</p>
      )}
    </div>
  </section>
)}
        {/* MODAL DE AVALIAÇÃO OTIMIZADO */}
        {isModalAvaliacaoOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-[2rem] w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="mb-8">
                <h3 className="text-3xl font-black tracking-tighter">Nova Avaliação</h3>
                <p className="text-gray-400 font-medium mt-1">Preencha as métricas corporais do aluno.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.keys(medidas).filter(k => k !== 'observacoes').map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">
                      {key.replace('_', ' ')}
                    </label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all" 
                      placeholder="0.0"
                      onChange={(e) => setMedidas({...medidas, [key]: e.target.value})} 
                    />
                  </div>
                ))}
              </div>

              <textarea 
                className="w-full p-5 bg-gray-50 border border-transparent rounded-2xl mt-6 outline-none font-medium h-32 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all" 
                placeholder="Adicione observações sobre a evolução do aluno..." 
                onChange={(e) => setMedidas({...medidas, observacoes: e.target.value})} 
              />

              <div className="flex gap-4 mt-10">
                <button onClick={() => setIsModalAvaliacaoOpen(false)} className="flex-1 p-4 bg-gray-100 rounded-2xl font-black hover:bg-gray-200 transition-all">Cancelar</button>
                <button onClick={salvarAvaliacaoCompleta} className="flex-1 p-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black hover:shadow-lg transition-all">Salvar Avaliação</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function DetalheAluno({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="flex items-center justify-center min-h-screen text-gray-400">Carregando...</main>}>
      <DetalheAlunoContent params={params} />
    </Suspense>
  );
}