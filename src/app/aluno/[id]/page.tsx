'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ptBR } from 'date-fns/locale';
import { FaDumbbell, FaClipboardList, FaChartLine, FaFileInvoice, FaFolderOpen, FaUserCircle, FaExclamationTriangle, FaCommentMedical } from 'react-icons/fa';
import { LineChart, Line, Tooltip, YAxis, XAxis, Area, ResponsiveContainer } from 'recharts';
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const checkStatus = async () => {
      const { data: alunoData } = await supabase.from('alunos').select('status_pagamento, data_vencimento').eq('id', id).single();
      if (alunoData) {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const [ano, mes, dia] = alunoData.data_vencimento.split('-').map(Number);
        const vencimento = new Date(ano, mes - 1, dia);
        const dataLimite = new Date(vencimento); dataLimite.setDate(dataLimite.getDate() + 2);
        if (alunoData.status_pagamento === 'bloqueado' || hoje > dataLimite) { router.push('/pagamento-pendente?motivo=vencido'); return; }
      }
      fetchData();
    };
    checkStatus();
  }, [id, router]);

  const fetchData = async () => {
    setLoading(true);
    const { data: alunoData } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
    if (alunoData) {
      setAluno(alunoData);
      if (alunoData.personal_id) {
        const { data: pData } = await supabase.from('personais').select('*').eq('id', alunoData.personal_id).maybeSingle();
        if (pData) setPersonal(pData);
      }
    }
    const { data: conclusoes } = await supabase.from('conclusoes_treino').select('data_conclusao').eq('aluno_id', id).gte('data_conclusao', startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString());
    if (conclusoes) setDiasTreino(conclusoes.map(d => { const date = parseISO(d.data_conclusao); date.setHours(0,0,0,0); return date; }));
    setLoading(false);
  };

  if (loading) return <main className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black">CARREGANDO...</main>;

  return (
    <main className="min-h-screen bg-black p-6 md:p-12 text-white">
      <div className="max-w-3xl mx-auto">
        <header className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 rounded-full bg-neutral-900 border border-white/10 p-1 mb-6">
             {personal?.avatar_url ? <img src={personal.avatar_url} className="w-full h-full object-cover rounded-full" /> : <FaUserCircle className="w-full h-full text-neutral-700" />}
          </div>
          <h1 className="font-black text-xl tracking-tighter">{personal?.nome || 'Personal Trainer'}</h1>
          <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.25em] mt-1">CREF: {personal?.cref || 'N/A'}</p>
        </header>

        {aluno && (
          <div className="mb-10 max-w-sm mx-auto space-y-4">
            <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${aluno.status_pagamento === 'bloqueado' ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{aluno.status_pagamento === 'bloqueado' ? 'Restrito' : 'Assinatura Ativa'}</span>
                </div>
                <p className="text-xl font-black">{aluno.status_pagamento === 'bloqueado' ? 'Conta Bloqueada' : 'Plano Premium'}</p>
              </div>
              <div className="w-full h-px bg-white/5" />
              <div className="w-full flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                <span>Vencimento</span>
                <span className="text-white">{aluno.data_vencimento ? new Date(aluno.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        <section className="mb-10">
          <h2 className="text-3xl font-black tracking-tighter mb-8">Olá, {aluno?.nome.split(' ')[0]}.</h2>
          <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5">
            <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-6">Sua semana de treinos</h2>
            <div className="flex justify-between items-center">
              {eachDayOfInterval({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }).map((dia, i) => {
                const treinou = diasTreino.some(d => isSameDay(d, dia));
                const hoje = isSameDay(dia, new Date());
                const falha = dia < new Date() && !treinou && !hoje;
                return (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${treinou ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : falha ? 'bg-red-500/10 text-red-500' : hoje ? 'border border-white text-white' : 'bg-white/5 text-neutral-600'}`}>
                      {treinou ? '✓' : falha ? '✕' : hoje ? '●' : ''}
                    </div>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase">{format(dia, 'EEEEE', { locale: ptBR })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
    <button onClick={onClick} className="bg-neutral-950/80 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 transition-all active:scale-95">
      <div className="text-lg text-white">{icon}</div>
      <span className="font-black text-[10px] uppercase tracking-widest text-neutral-500">{label}</span>
    </button>
  );
}

function ModalAvaliacao({ isOpen, onClose, avaliacao, historico }: any) {
  if (!isOpen || !avaliacao) return null;

  // Calcula a variação (Delta) entre a última e a penúltima medição
  const delta = historico && historico.length > 1 
    ? historico[historico.length - 1].peso - historico[historico.length - 2].peso 
    : 0;
  
  const ehPositivo = delta > 0;

  const medidasList = [
    { label: 'Tórax', value: avaliacao.torax },
    { label: 'Ombros', value: avaliacao.ombros },
    { label: 'Abdômen', value: avaliacao.abdomen },
    { label: 'Cintura', value: avaliacao.cintura },
    { label: 'Quadril', value: avaliacao.quadril },
    { label: 'Braço Dir.', value: avaliacao.braco_direito },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Análise Corporal</h2>
            <p className="text-xl font-black text-white tracking-tighter">Sua Evolução</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition">
            &times;
          </button>
        </div>

        {/* Gráfico */}
        <div className="h-40 w-full mb-8 bg-white/5 rounded-[2rem] p-5 border border-white/5 flex flex-col justify-center">
          {historico && historico.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico}>
                <XAxis dataKey="data" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-xl">
                        {payload[0].value} kg
                      </div>
                    );
                  }
                  return null;
                }} />
                <Line type="monotone" dataKey="peso" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[10px] text-neutral-600 uppercase tracking-widest">Dados insuficientes</p>
          )}
        </div>

        {/* KPIs em destaque */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-blue-600 p-5 rounded-2xl text-white">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mb-1">Peso Atual</p>
            <div className="flex items-end gap-2">
              <p className="font-black text-2xl tracking-tighter">{avaliacao.peso || 0}<span className="text-sm opacity-70 ml-1">kg</span></p>
              {delta !== 0 && (
                <span className={`text-[10px] font-bold mb-1 ${ehPositivo ? 'text-red-300' : 'text-emerald-300'}`}>
                  {ehPositivo ? '+' : ''}{delta.toFixed(1)}kg
                </span>
              )}
            </div>
          </div>
          <div className="bg-white/5 p-5 rounded-2xl">
            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Gordura Corp.</p>
            <p className="font-black text-2xl tracking-tighter text-white">{avaliacao.gordura || 0}<span className="text-sm text-neutral-600 ml-1">%</span></p>
          </div>
        </div>

        {/* Grade de Medidas */}
        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase text-neutral-500 tracking-widest mb-2">Medidas Detalhadas (cm)</p>
          <div className="grid grid-cols-2 gap-3">
            {medidasList.map((m) => (
              <div key={m.label} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">{m.label}</span>
                <span className="font-black text-white text-xs">{m.value || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}