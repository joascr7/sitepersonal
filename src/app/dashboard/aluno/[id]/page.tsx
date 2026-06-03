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
    <main className="min-h-screen bg-black p-6 md:p-12 transition-colors text-white">
      <div className="max-w-4xl mx-auto">
        <section className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl mb-10 flex flex-col md:flex-row items-center gap-8">
          <img src={aluno?.avatar_url || 'https://via.placeholder.com/150'} className="w-28 h-28 rounded-[2rem] object-cover shadow-2xl border border-white/10" />
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-black tracking-tighter mb-1">{aluno?.nome}</h1>
            <p className="text-blue-500 font-black bg-blue-600/10 px-4 py-1.5 rounded-full inline-block text-[10px] uppercase tracking-widest border border-blue-600/20">Objetivo: {aluno?.objetivo || 'Não definido'}</p>
          </div>
          <div className="w-full md:w-auto">
             <ControleFinanceiro alunoId={id} initialStatus={aluno?.status_pagamento || 'pendente'} />
          </div>
        </section>

        <div className="flex gap-8 mb-10 border-b border-white/10">
          {[
            { id: 'treinos', label: 'Treinos' },
            { id: 'evolucao', label: 'Evolução' },
            { id: 'feedback', label: 'Feedbacks' },
            { id: 'arquivos', label: 'Documentos' }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => { setAbaAtiva(tab.id); router.replace(`?aba=${tab.id}`) }} 
              className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                abaAtiva === tab.id 
                  ? 'border-blue-500 text-white' 
                  : 'border-transparent text-neutral-600 hover:text-neutral-300'
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
                  <div key={f.id} className="group relative bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-600/10 px-3 py-1 rounded-full border border-blue-600/20">Treino Ativo</span>
                        <h3 className="text-lg font-black mt-4 tracking-tight text-white">{f.nome_treino}</h3>
                        <p className="text-neutral-500 text-xs mt-1">Criado em {new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <button onClick={(e) => excluirFicha(e, f.id)} className="text-neutral-600 hover:text-red-500 p-2 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                      <button onClick={() => router.push(`/dashboard/aluno/${id}/treino/${f.id}`)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors">
                        Visualizar Detalhes →
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-[2.5rem]">
                  <p className="text-neutral-500 font-black uppercase text-[10px] tracking-widest">Nenhuma ficha criada ainda.</p>
                </div>
              )}
            </div>

            <a href={`/dashboard/aluno/${id}/nova-ficha`} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white p-6 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-[0.98]">
              <span className="text-xl">+</span> Criar Nova Ficha de Treino
            </a>
          </section>
        )}

        {abaAtiva === 'evolucao' && (
          <section className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-white">Evolução Corporal</h2>
                <p className="text-neutral-500 font-black uppercase text-[10px] tracking-widest mt-1">Acompanhamento de metas e métricas.</p>
              </div>
              <button onClick={() => setIsModalAvaliacaoOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-blue-500 transition-all active:scale-[0.98]">
                + Nova Avaliação
              </button>
            </div>

            <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl h-96">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-white tracking-tight text-sm">Progressão de Peso (kg)</h3>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-600/10 px-4 py-1 rounded-full border border-blue-600/20">Histórico de Peso</span>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={[...historico].filter(a => a.peso).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis dataKey="data_avaliacao" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '16px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    cursor={{ stroke: '#404040', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#2563eb" 
                    strokeWidth={4} 
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 6, stroke: '#000' }} 
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

    {/* Lista de Avaliações */}
    <div className="space-y-6">
      {historico.filter(a => !a.tipo).map((av) => (
        <div key={av.id} className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-white/10 transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-black text-2xl text-white">
                {new Date(av.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-neutral-500 text-[9px] uppercase tracking-[0.2em] font-black mt-1">Registro de Avaliação</p>
            </div>
            <button 
              onClick={() => excluirAvaliacao(av.id)} 
              className="text-neutral-600 hover:text-red-500 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Excluir
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(av).map(([key, val]: any) => {
              const camposProibidos = ['id', 'aluno_id', 'data_avaliacao', 'observacoes', 'tipo', 'personal_id', 'created_at', 'updated_at'];
              if (camposProibidos.includes(key) || val === null || val === undefined || val === '') return null;
              
              const isCorpo = ['peitoral', 'braco', 'cintura', 'quadril', 'coxa', 'ombros', 'torax', 'abdomen'].includes(key);
              
              return (
                <div key={key} className={`p-5 rounded-2xl ${isCorpo ? 'bg-blue-600/10 border border-blue-600/20' : 'bg-white/5'}`}>
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1 truncate">
                    {key.replace('_', ' ')}
                  </p>
                  <p className="font-black text-xl text-white">
                    {val}
                    <span className="text-[10px] text-neutral-400 ml-1 font-black">
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
        <h2 className="text-3xl font-black tracking-tighter text-white">Feedbacks de Treino</h2>
        <p className="text-neutral-500 font-black uppercase text-[9px] tracking-widest mt-1">O que o aluno está sentindo sobre a evolução.</p>
      </div>
      <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-600/10 px-6 py-3 rounded-full border border-blue-600/20">
        {feedbacks.length} Registros
      </div>
    </div>

    <div className="grid gap-6">
      {feedbacks.length > 0 ? (
        feedbacks.map((f) => (
          <div key={f.id} className="group relative bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-lg ${f.intensidade > 7 ? 'bg-red-600/10 text-red-400' : 'bg-blue-600/10 text-blue-400'}`}>
                  {f.intensidade}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Intensidade Percibida</p>
                  <p className="font-black text-white">Nível {f.intensidade} de 10</p>
                </div>
              </div>
              <button 
                onClick={() => excluirFeedback(f.id)} 
                className="text-neutral-600 hover:text-red-500 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Excluir
              </button>
            </div>

            <blockquote className="text-xl italic font-medium leading-relaxed text-neutral-300 bg-white/5 p-8 rounded-[2rem] border-l-4 border-blue-600">
              "{f.observacoes}"
            </blockquote>
            
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600 mt-6">
              Registrado em {new Date(f.data_criacao).toLocaleDateString('pt-BR')}
            </p>
          </div>
        ))
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
          <p className="text-neutral-600 font-black uppercase text-[10px] tracking-widest">Nenhum feedback disponível no momento.</p>
        </div>
      )}
    </div>
  </section>
)}


      {abaAtiva === 'arquivos' && (
  <section className="space-y-8 animate-in fade-in duration-500">
    <div>
      <h2 className="text-3xl font-black tracking-tighter text-white">Documentos e Exames</h2>
      <p className="text-neutral-500 font-black uppercase text-[9px] tracking-widest mt-1">Upload e gestão de arquivos do aluno.</p>
    </div>

    {/* Área de Upload */}
    <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-dashed border-white/10 text-center hover:border-blue-500/50 transition-all">
      <label className="cursor-pointer flex flex-col items-center gap-4">
        <div className="p-4 bg-white/5 rounded-3xl">
           <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        </div>
        <span className="font-black text-sm text-white uppercase tracking-widest">Clique para enviar novo PDF</span>
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
          <div key={arq.id} className="flex items-center justify-between p-6 bg-neutral-950/80 backdrop-blur-xl border border-white/5 rounded-[2rem] hover:border-white/10 transition-all">
            <div className="flex items-center gap-4">
              <span className="text-red-500 text-xl">📄</span>
              <span className="font-black text-sm text-white truncate max-w-[200px]">{arq.nome_arquivo}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const { data } = supabase.storage.from('documentos-alunos').getPublicUrl(arq.url);
                  window.open(data.publicUrl, '_blank');
                }}
                className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors px-4"
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
                className="p-3 rounded-2xl text-neutral-600 hover:bg-red-600/10 hover:text-red-500 transition-all duration-300"
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
        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
          <p className="text-neutral-600 font-black uppercase text-[10px] tracking-widest">Nenhum arquivo enviado ainda.</p>
        </div>
      )}
    </div>
  </section>
)}
        {/* MODAL DE AVALIAÇÃO OTIMIZADO */}
        {isModalAvaliacaoOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-950/90 p-10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-300">
              <div className="mb-8">
                <h3 className="text-3xl font-black tracking-tighter text-white">Nova Avaliação</h3>
                <p className="text-neutral-500 font-medium mt-1">Preencha as métricas corporais do aluno.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.keys(medidas).filter(k => k !== 'observacoes').map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest pl-1">
                      {key.replace('_', ' ')}
                    </label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl font-bold text-white outline-none focus:border-blue-500 transition-all" 
                      placeholder="0.0"
                      onChange={(e) => setMedidas({...medidas, [key]: e.target.value})} 
                    />
                  </div>
                ))}
              </div>

              <textarea 
                className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl mt-6 outline-none font-medium h-32 focus:border-blue-500 transition-all text-white placeholder:text-neutral-600" 
                placeholder="Adicione observações sobre a evolução do aluno..." 
                onChange={(e) => setMedidas({...medidas, observacoes: e.target.value})} 
              />

              <div className="flex gap-4 mt-10">
                <button onClick={() => setIsModalAvaliacaoOpen(false)} className="flex-1 p-4 bg-white/5 text-white rounded-2xl font-black hover:bg-white/10 transition-all">Cancelar</button>
                <button onClick={salvarAvaliacaoCompleta} className="flex-1 p-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-500 transition-all">Salvar Avaliação</button>
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
    <Suspense fallback={<main className="flex items-center justify-center min-h-screen bg-black text-blue-500 font-black">CARREGANDO...</main>}>
      <DetalheAlunoContent params={params} />
    </Suspense>
  );
}