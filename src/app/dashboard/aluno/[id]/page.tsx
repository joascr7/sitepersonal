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

  
 if (loading) return (
    <main className="min-h-screen bg-black p-6 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-10">
        <div className="w-16 h-4 bg-neutral-900 rounded-full" />
        <div className="w-24 h-8 bg-neutral-900 rounded-xl" />
      </div>

      {/* Título e Barra de Progresso Skeleton */}
      <div className="space-y-4">
        <div className="w-48 h-8 bg-neutral-900 rounded-full" />
        <div className="w-32 h-3 bg-neutral-900 rounded-full" />
        <div className="w-full h-2 bg-neutral-900 rounded-full" />
      </div>

      {/* Cards de Exercícios Skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-8 bg-neutral-900/50 rounded-[2.5rem] border border-white/5 space-y-4">
          <div className="w-full h-40 bg-neutral-900 rounded-2xl" />
          <div className="w-1/2 h-6 bg-neutral-900 rounded-full" />
        </div>
      ))}
    </main>
  );

  
   return (
    <main className="min-h-screen bg-black p-4 md:p-12 transition-colors text-white">
  <div className="max-w-4xl mx-auto">
    {/* Header do Aluno - Ajustado para mobile */}
    <section className="bg-neutral-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-2xl mb-8 flex flex-col items-center text-center gap-4">
      <img src={aluno?.avatar_url || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-[2rem] object-cover shadow-2xl border border-white/10" />
      <div>
        <h1 className="text-3xl font-black tracking-tighter mb-1">{aluno?.nome}</h1>
        <p className="text-blue-500 font-black bg-blue-600/10 px-3 py-1 rounded-full inline-block text-[9px] uppercase tracking-widest border border-blue-600/20">Objetivo: {aluno?.objetivo || 'Não definido'}</p>
      </div>
      <div className="w-full">
         <ControleFinanceiro alunoId={id} initialStatus={aluno?.status_pagamento || 'pendente'} />
      </div>
    </section>

    {/* Abas - Scroll Horizontal para Mobile */}
    <div className="flex gap-6 mb-8 border-b border-white/10 overflow-x-auto scrollbar-hide">
      {[
        { id: 'treinos', label: 'Treinos' },
        { id: 'evolucao', label: 'Evolução' },
        { id: 'feedback', label: 'Feedbacks' },
        { id: 'arquivos', label: 'Documentos' }
      ].map((tab) => (
        <button 
          key={tab.id} 
          onClick={() => { setAbaAtiva(tab.id); router.replace(`?aba=${tab.id}`) }} 
          className={`pb-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${
            abaAtiva === tab.id 
              ? 'border-blue-500 text-white' 
              : 'border-transparent text-neutral-500'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {abaAtiva === 'treinos' && (
      <section className="space-y-4">
        {/* Grid ajustado para 1 coluna no mobile para melhor leitura */}
        <div className="grid grid-cols-1 gap-3">
          {fichas.length > 0 ? (
            fichas.map((f) => (
              <div key={f.id} className="bg-neutral-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest bg-blue-600/10 px-2 py-0.5 rounded-md border border-blue-600/20">Ativo</span>
                    <h3 className="text-md font-black mt-2 text-white">{f.nome_treino}</h3>
                  </div>
                  <button onClick={(e) => excluirFicha(e, f.id)} className="text-neutral-600 p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <button onClick={() => router.push(`/dashboard/aluno/${id}/treino/${f.id}`)} className="mt-4 w-full text-[9px] font-black uppercase tracking-widest text-blue-500 py-2 bg-blue-500/5 rounded-xl">
                  Visualizar Detalhes →
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
              <p className="text-neutral-600 font-black uppercase text-[9px] tracking-widest">Nenhuma ficha criada.</p>
            </div>
          )}
        </div>

        <a href={`/dashboard/aluno/${id}/nova-ficha`} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform">
          + Criar Nova Ficha
        </a>
      </section>
    )}

        {abaAtiva === 'evolucao' && (
  <section className="space-y-6">
    {/* Header da Seção */}
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-black tracking-tighter text-white">Evolução</h2>
        <p className="text-neutral-500 font-black uppercase text-[9px] tracking-widest mt-1">Acompanhamento e métricas.</p>
      </div>
      <button onClick={() => setIsModalAvaliacaoOpen(true)} className="w-full bg-blue-600 text-white py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform">
        + Nova Avaliação
      </button>
    </div>

    {/* Gráfico Otimizado */}
    <div className="bg-neutral-900/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 h-64">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-white text-[10px] uppercase tracking-widest">Peso (kg)</h3>
      </div>
      <ResponsiveContainer width="100%" height="75%">
        <LineChart data={[...historico].filter(a => a.peso).reverse()}>
          <XAxis dataKey="data_avaliacao" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }}
            cursor={{ stroke: '#333', strokeWidth: 1 }}
          />
          <Line type="monotone" dataKey="peso" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Lista de Avaliações - Grid Compacto */}
    <div className="space-y-4">
      {historico.filter(a => !a.tipo).map((av) => (
        <div key={av.id} className="bg-neutral-900/50 p-6 rounded-[2rem] border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <p className="font-black text-lg text-white">
              {new Date(av.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'numeric' })}
            </p>
            <button onClick={() => excluirAvaliacao(av.id)} className="text-neutral-600 hover:text-red-500 text-[9px] font-black uppercase">Excluir</button>
          </div>
          
          {/* Grid de Métricas: 2 colunas no mobile, 4 no tablet */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(av).map(([key, val]: any) => {
              const camposProibidos = ['id', 'aluno_id', 'data_avaliacao', 'observacoes', 'tipo', 'personal_id', 'created_at', 'updated_at'];
              if (camposProibidos.includes(key) || !val) return null;
              
              return (
                <div key={key} className="bg-white/5 p-3 rounded-xl">
                  <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest truncate">{key.replace('_', ' ')}</p>
                  <p className="font-black text-sm text-white">
                    {val}<span className="text-[9px] text-neutral-400 ml-1">{['peso', 'gordura'].includes(key) ? (key === 'peso' ? 'kg' : '%') : 'cm'}</span>
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

{abaAtiva === 'feedback' && (
  <section className="space-y-6">
    {/* Header Compacto */}
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black tracking-tighter text-white">Feedbacks</h2>
        <p className="text-neutral-500 font-black uppercase text-[9px] tracking-widest mt-1">Histórico do aluno.</p>
      </div>
      <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-600/10 px-4 py-2 rounded-full border border-blue-600/20">
        {feedbacks.length}
      </div>
    </div>

    {/* Lista de Feedbacks */}
    <div className="grid gap-4">
      {feedbacks.length > 0 ? (
        feedbacks.map((f) => (
          <div key={f.id} className="bg-neutral-900/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${f.intensidade > 7 ? 'bg-red-600/10 text-red-400' : 'bg-blue-600/10 text-blue-400'}`}>
                  {f.intensidade}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Intensidade</p>
                  <p className="font-black text-white text-xs">Nível {f.intensidade} / 10</p>
                </div>
              </div>
              <button 
                onClick={() => excluirFeedback(f.id)} 
                className="text-neutral-600 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-colors"
              >
                Excluir
              </button>
            </div>

            <div className="text-sm italic font-medium leading-relaxed text-neutral-300 bg-white/5 p-5 rounded-[1.5rem] border-l-2 border-blue-600">
              "{f.observacoes}"
            </div>
            
            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-600 mt-4">
              {new Date(f.data_criacao).toLocaleDateString('pt-BR')}
            </p>
          </div>
        ))
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[2rem]">
          <p className="text-neutral-600 font-black uppercase text-[9px] tracking-widest">Nenhum feedback.</p>
        </div>
      )}
    </div>
  </section>
)}

     {abaAtiva === 'arquivos' && (
  <section className="space-y-6">
    {/* Header da Seção */}
    <div>
      <h2 className="text-2xl font-black tracking-tighter text-white">Documentos</h2>
      <p className="text-neutral-500 font-black uppercase text-[9px] tracking-widest mt-1">Gestão de exames e arquivos.</p>
    </div>

    {/* Área de Upload Otimizada */}
    <div className="bg-neutral-900/50 backdrop-blur-xl p-6 rounded-[2rem] border-2 border-dashed border-white/10 text-center hover:border-blue-500 transition-all">
      <label className="cursor-pointer flex flex-col items-center gap-3">
        <div className="p-3 bg-white/5 rounded-2xl">
           <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
           </svg>
        </div>
        <span className="font-black text-[10px] text-white uppercase tracking-widest">Selecionar novo PDF</span>
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

    {/* Lista de Arquivos - Compacta e Funcional */}
    <div className="space-y-3">
      {arquivos && arquivos.length > 0 ? (
        arquivos.map((arq: any) => (
          <div key={arq.id} className="flex items-center justify-between p-4 bg-neutral-900/50 border border-white/5 rounded-[1.5rem]">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-red-400 text-lg">📄</span>
              <span className="font-black text-[11px] text-white truncate">{arq.nome_arquivo}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  const { data } = supabase.storage.from('documentos-alunos').getPublicUrl(arq.url);
                  window.open(data.publicUrl, '_blank');
                }}
                className="text-[9px] font-black uppercase tracking-widest text-blue-500 p-2 hover:text-blue-400"
              >
                ABRIR
              </button>

              <button 
                onClick={async () => {
                  if (!confirm("Tem certeza que deseja excluir este arquivo?")) return;
                  await supabase.storage.from('documentos-alunos').remove([arq.url]);
                  await supabase.from('documentos').delete().eq('id', arq.id);
                  await fetchArquivos();
                }}
                className="p-2 text-neutral-600 hover:text-red-500 transition-colors"
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
        <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-[2rem]">
          <p className="text-neutral-600 font-black uppercase text-[9px] tracking-widest">Nenhum arquivo enviado.</p>
        </div>
      )}
    </div>
  </section>
)}
        {/* MODAL DE AVALIAÇÃO OTIMIZADO PARA MOBILE */}
{isModalAvaliacaoOpen && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4">
    <div className="bg-neutral-900 w-full h-[90vh] md:h-auto md:max-w-xl rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 shadow-2xl border-t border-white/10 overflow-y-auto">
      
      <div className="mb-6">
        <h3 className="text-2xl font-black tracking-tighter text-white">Nova Avaliação</h3>
        <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-black mt-1">Preencha as métricas do aluno.</p>
      </div>
      
      {/* Grid otimizado para 2 colunas fixas no mobile */}
      <div className="grid grid-cols-2 gap-3">
        {Object.keys(medidas).filter(k => k !== 'observacoes').map((key) => (
          <div key={key} className="space-y-1">
            <label className="text-[9px] font-black uppercase text-neutral-500 tracking-widest pl-1">
              {key.replace('_', ' ')}
            </label>
            <input 
              type="number" 
              className="w-full p-3 bg-white/5 border border-white/5 rounded-xl font-bold text-white text-sm outline-none focus:border-blue-500 transition-all" 
              placeholder="0.0"
              onChange={(e) => setMedidas({...medidas, [key]: e.target.value})} 
            />
          </div>
        ))}
      </div>

      <textarea 
        className="w-full p-4 bg-white/5 border border-white/5 rounded-xl mt-4 outline-none font-medium text-sm h-24 focus:border-blue-500 transition-all text-white placeholder:text-neutral-600" 
        placeholder="Observações..." 
        onChange={(e) => setMedidas({...medidas, observacoes: e.target.value})} 
      />

      <div className="flex gap-3 mt-8 pb-4">
        <button 
          onClick={() => setIsModalAvaliacaoOpen(false)} 
          className="flex-1 py-4 bg-white/5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
        >
          Cancelar
        </button>
        <button 
          onClick={salvarAvaliacaoCompleta} 
          className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
        >
          Salvar
        </button>
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