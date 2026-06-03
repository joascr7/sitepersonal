'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ptBR } from 'date-fns/locale';
import { FaDumbbell, FaClipboardList, FaChartLine, FaFileInvoice, FaFolderOpen, FaUserCircle, FaCommentMedical } from 'react-icons/fa';
import { LineChart, Line, Tooltip, ResponsiveContainer, YAxis, XAxis } from 'recharts';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO } from 'date-fns';

export default function AreaDoAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [aluno, setAluno] = useState<any>(null);
  const [personal, setPersonal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [modalAberta, setModalAberta] = useState(false);
  const [diasTreino, setDiasTreino] = useState<Date[]>([]);

  // Memoiza processamento de dias para evitar lentidão
  const diasSemana = useMemo(() => 
    eachDayOfInterval({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }), 
  []);

  useEffect(() => {
    if (!id) return;
    async function init() {
      const { data: alunoData } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
      if (!alunoData) return;
      setAluno(alunoData);

      if (alunoData.personal_id) {
        const { data: pData } = await supabase.from('personais').select('*').eq('id', alunoData.personal_id).maybeSingle();
        setPersonal(pData);
      }

      const { data: conclusoes } = await supabase.from('conclusoes_treino').select('data_conclusao').eq('aluno_id', id).gte('data_conclusao', startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString());
      if (conclusoes) setDiasTreino(conclusoes.map(d => parseISO(d.data_conclusao)));
      
      setLoading(false);
    }
    init();
  }, [id]);

  if (loading) return <main className="min-h-screen bg-black flex items-center justify-center text-blue-600 font-black animate-pulse">CARREGANDO...</main>;

  return (
    <main className="min-h-screen bg-black p-4 text-white pb-10">
      <div className="max-w-md mx-auto space-y-8">
        
        <header className="flex flex-col items-center pt-8">
          <div className="w-28 h-28 rounded-full bg-neutral-900 border-2 border-blue-600/30 p-1 mb-4 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
             {personal?.avatar_url ? <img src={personal.avatar_url} className="w-full h-full object-cover rounded-full" /> : <FaUserCircle className="w-full h-full text-neutral-600" />}
          </div>
          <h1 className="font-black text-2xl tracking-tighter">{personal?.nome || 'Personal Trainer'}</h1>
          <p className="text-blue-500 text-[11px] font-black uppercase tracking-[0.2em] mt-1">CREF: {personal?.cref || 'N/A'}</p>
        </header>

        {aluno && (
            <div className="bg-neutral-900/50 p-6 rounded-[2rem] border border-white/10 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Status</p>
                    <p className="font-black text-sm">{aluno.status_pagamento === 'bloqueado' ? 'Bloqueado' : 'Assinatura Ativa'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Vencimento</p>
                    <p className="font-black text-sm">{aluno.data_vencimento ? new Date(aluno.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}</p>
                </div>
            </div>
        )}

        <section className="bg-neutral-900/50 p-6 rounded-[2rem] border border-white/10">
            <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-6">Sua semana de treinos</h2>
            <div className="flex justify-between items-center">
              {diasSemana.map((dia, i) => {
                const treinou = diasTreino.some(d => isSameDay(d, dia));
                const hoje = isSameDay(dia, new Date());
                return (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base ${treinou ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : hoje ? 'border-2 border-blue-500 text-blue-500' : 'bg-neutral-800 text-neutral-600'}`}>
                      {treinou ? '✓' : hoje ? '●' : ''}
                    </div>
                    <span className="text-[10px] font-black text-neutral-500 uppercase">{format(dia, 'EEEEE', { locale: ptBR })}</span>
                  </div>
                );
              })}
            </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <BotaoMenu icon={<FaDumbbell />} label="Treinos" onClick={() => router.push(`/aluno/${id}/treinos`)} />
          <BotaoMenu icon={<FaClipboardList />} label="Avaliações" onClick={async () => { 
            const { data } = await supabase.from('avaliacoes_fisicas').select('*').eq('aluno_id', id); 
            if(data) { setAvaliacoes(data); setModalAberta(true); } 
          }} />
          <BotaoMenu icon={<FaChartLine />} label="Progresso" onClick={() => router.push(`/aluno/${id}/progresso`)} />
          <BotaoMenu icon={<FaCommentMedical />} label="Feedback" onClick={() => router.push(`/aluno/${id}/feedback`)} />
          <BotaoMenu icon={<FaFileInvoice />} label="Faturas" onClick={() => router.push(`/aluno/${id}/faturas`)} />
          <BotaoMenu icon={<FaFolderOpen />} label="Arquivos" onClick={() => router.push(`/aluno/${id}/arquivos`)} />
        </div>

        {modalAberta && (
          <ModalAvaliacao isOpen={modalAberta} onClose={() => setModalAberta(false)} avaliacao={avaliacoes[avaliacoes.length - 1]} historico={avaliacoes.map(a => ({ data: new Date(a.data_avaliacao).toLocaleDateString(), peso: a.peso }))} />
        )}
      </div>
    </main>
  );
}

function BotaoMenu({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="bg-neutral-900/50 border border-white/10 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 active:scale-[0.98] transition-all">
      <div className="text-2xl text-blue-500">{icon}</div>
      <span className="font-black text-[11px] uppercase tracking-widest text-white">{label}</span>
    </button>
  );
}

function ModalAvaliacao({ isOpen, onClose, avaliacao, historico }: any) {
  if (!isOpen || !avaliacao) return null;

  // Lista completa conforme o seu código original
  const medidasList = [
    { label: 'Tórax', value: avaliacao.torax },
    { label: 'Ombros', value: avaliacao.ombros },
    { label: 'Abdômen', value: avaliacao.abdomen },
    { label: 'Cintura', value: avaliacao.cintura },
    { label: 'Quadril', value: avaliacao.quadril },
    { label: 'Braço Dir.', value: avaliacao.braco_direito },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-neutral-900 w-full max-w-sm rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 max-h-[90vh] flex flex-col shadow-2xl border-t border-white/10">
        
        {/* Header Fixo */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Análise Corporal</h2>
            <p className="text-xl font-black text-white tracking-tighter">Sua Evolução</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white text-xl">
            &times;
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          
          {/* Gráfico */}
          <div className="h-40 w-full mb-8 bg-neutral-950 rounded-[2rem] p-5 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico}>
                <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-600 p-6 rounded-[2rem]">
              <p className="text-[9px] font-bold uppercase opacity-80 mb-1">Peso Atual</p>
              <p className="font-black text-3xl text-white">{avaliacao.peso || 0}<span className="text-sm opacity-70 ml-1">kg</span></p>
            </div>
            <div className="bg-neutral-800 p-6 rounded-[2rem]">
              <p className="text-[9px] font-bold uppercase opacity-60 mb-1">Gordura Corp.</p>
              <p className="font-black text-3xl text-white">{avaliacao.gordura || 0}<span className="text-sm opacity-50 ml-1">%</span></p>
            </div>
          </div>

          {/* Grade de Medidas Detalhadas */}
          <div className="space-y-4">
            <p className="text-[9px] font-black uppercase text-neutral-500 tracking-widest mb-2">Medidas Detalhadas (cm)</p>
            <div className="grid grid-cols-2 gap-3">
              {medidasList.map((m) => (
                <div key={m.label} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{m.label}</span>
                  <span className="font-black text-white text-sm">{m.value || 0}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Espaço extra para não ficar colado no final */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}