'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ptBR } from 'date-fns/locale';
import { 
  FaDumbbell, 
  FaClipboardList, 
  FaChartLine, 
  FaFileInvoice, 
  FaFolderOpen, 
  FaUserCircle, 
  FaCommentMedical, 
  FaChevronLeft, 
  FaChevronRight 
} from 'react-icons/fa';
import { LineChart, Line, Tooltip, ResponsiveContainer, YAxis, XAxis } from 'recharts';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns';


export default function AreaDoAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [aluno, setAluno] = useState<any>(null);
  const [personal, setPersonal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [modalAberta, setModalAberta] = useState(false);
  const [diasTreino, setDiasTreino] = useState<Date[]>([]);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [treinoDoDia, setTreinoDoDia] = useState<any>(null);
  

  // Memoiza processamento de dias para evitar lentidão
  const diasSemana = useMemo(() => 
    eachDayOfInterval({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }), 
  []);

useEffect(() => {
    if (!id) return;
    
    async function init() {
      // 1. Busca dados do aluno
      const { data: alunoData } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
      if (!alunoData) return;
      setAluno(alunoData);

      // 2. Busca dados do personal
      if (alunoData.personal_id) {
        const { data: pData } = await supabase.from('personais').select('*').eq('id', alunoData.personal_id).maybeSingle();
        setPersonal(pData);
      }

      // 3. Busca todo o histórico para o calendário e para definir o último treino
      const { data: conclusoes } = await supabase
        .from('conclusoes_treino')
        .select('data_conclusao, treino_id')
        .eq('aluno_id', id);
      
      if (conclusoes) {
        const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
        const treinosSemana = conclusoes.filter(c => c.data_conclusao >= inicioSemana);
        setDiasTreino(treinosSemana.map(d => parseISO(d.data_conclusao)));
      }

      // 4. Lógica de Avanço Sequencial (Corrigida)
      // Identifica o último treino concluído pelo aluno
      let ordemUltimoTreino = 0;
      if (conclusoes && conclusoes.length > 0) {
        // Ordena pelo mais recente e pega o ID do treino
        const ultimaConclusao = conclusoes.sort((a, b) => 
          new Date(b.data_conclusao).getTime() - new Date(a.data_conclusao).getTime()
        )[0];

        // Busca qual era a ordem desse treino
        const { data: fichaAnterior } = await supabase
          .from('fichas')
          .select('ordem')
          .eq('id', ultimaConclusao.treino_id)
          .single();
        
        ordemUltimoTreino = fichaAnterior?.ordem || 0;
      }

      // Busca o próximo treino (ordem maior que a última feita)
      let { data: treinoSugerido } = await supabase
        .from('fichas')
        .select('*')
        .eq('aluno_id', id)
        .gt('ordem', ordemUltimoTreino) // Pega apenas os treinos com ordem superior
        .order('ordem', { ascending: true })
        .limit(1)
        .maybeSingle();

      // FALLBACK: Se chegou ao fim ou nunca treinou, volta para o primeiro (reinicia o ciclo)
      if (!treinoSugerido) {
        const { data: fallback } = await supabase
          .from('fichas')
          .select('*')
          .eq('aluno_id', id)
          .order('ordem', { ascending: true })
          .limit(1)
          .maybeSingle();
        treinoSugerido = fallback;
      }

      console.log("Treino sugerido (seguinte na ordem):", treinoSugerido);
      setTreinoDoDia(treinoSugerido);
      
      setLoading(false);
    }
    
    init();
  }, [id]);

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
    // PT-20 compensa a Navbar superior fixa. 
    // O padding-bottom extra no container interno (pb-32) dá o espaço necessário para a navbar inferior.
    <main className="w-full bg-black text-white pt-20 px-4">
      <div className="max-w-md mx-auto flex flex-col space-y-2 pb-32">

        {/* Header Ultra Compacto */}
        <header className="px-2 pt-4 pb-0">
          <h1 className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em]">
            {nome}
          </h1>
        </header>

        {/* Perfil */}
        <header className="flex flex-col items-center pt-0">
          <div className="w-16 h-16 rounded-full bg-neutral-900 border-2 border-blue-600/30 p-1 shadow-lg">
             {personal?.avatar_url ? <img src={personal.avatar_url} className="w-full h-full object-cover rounded-full" /> : <FaUserCircle className="w-full h-full text-neutral-600" />}
          </div>
          <h1 className="font-black text-lg mt-1 tracking-tighter">{personal?.nome || 'Personal'}</h1>
          <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.2em]">CREF: {personal?.cref || 'N/A'}</p>
        </header>

        {aluno && (
          <div className="bg-neutral-900/50 p-3 rounded-2xl border border-white/5 flex justify-between items-center">
            <div>
              <p className="text-[8px] font-black uppercase text-neutral-500 tracking-widest">Status</p>
              <p className="font-black text-[11px]">{aluno.status_pagamento === 'bloqueado' ? 'Bloqueado' : 'Assinatura Ativa'}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase text-neutral-500 tracking-widest">Vencimento</p>
              <p className="font-black text-[11px]">{aluno.data_vencimento ? new Date(aluno.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}</p>
            </div>
          </div>
        )}

        {treinoDoDia ? (
          <section className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] shadow-2xl mb-8 border border-white/10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Treino do dia</p>
                <h2 className="text-2xl font-black tracking-tighter text-white">{treinoDoDia.nome_treino}</h2>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <FaDumbbell className="text-white text-xl" />
              </div>
            </div>
            <button 
              onClick={() => router.push(`/aluno/${id}/treino/${treinoDoDia.id}`)}
              className="w-full py-5 bg-white text-blue-700 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-transform active:scale-95"
            >
              Iniciar Agora
            </button>
          </section>
        ) : (
          <div className="p-8 text-center bg-neutral-900/50 rounded-[2.5rem] border border-dashed border-white/10">
            <p className="text-neutral-500 text-xs font-bold">Nenhum treino pendente para hoje.</p>
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

        <button 
          onClick={() => setCalendarioAberto(true)}
          className="w-full py-4 bg-neutral-900/50 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-all"
        >
          Ver Histórico Completo
        </button>

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
        
        {/* ESPAÇADOR DE SEGURANÇA (Adicionado para garantir o scroll final) */}
        <div className="h-40 w-full shrink-0" aria-hidden="true" />
      </div>

      {calendarioAberto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-neutral-900 w-full max-w-sm p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Histórico de Treinos</h2>
              <button onClick={() => setCalendarioAberto(false)} className="text-white text-xl">&times;</button>
            </div>
            <CalendarioTreino diasTreinados={diasTreino} />
          </div>
        </div>
      )}
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


function CalendarioTreino({ diasTreinados }: { diasTreinados: Date[] }) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const diasDoMes = useMemo(() => 
    eachDayOfInterval({ start: startOfMonth(dataAtual), end: endOfMonth(dataAtual) }), 
  [dataAtual]);

  return (
    <div className="bg-neutral-900 p-6 rounded-[2rem] border border-white/5">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setDataAtual(subMonths(dataAtual, 1))} className="text-neutral-500"><FaChevronLeft /></button>
        <h3 className="font-black text-sm uppercase tracking-widest">{format(dataAtual, 'MMMM yyyy', { locale: ptBR })}</h3>
        <button onClick={() => setDataAtual(addMonths(dataAtual, 1))} className="text-neutral-500"><FaChevronRight /></button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
  <div key={i} className="text-[8px] font-black text-neutral-600 uppercase">
    {d}
  </div>
))}
        {diasDoMes.map((dia, i) => {
          const treinou = diasTreinados.some(d => isSameDay(d, dia));
          return (
            <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all relative ${treinou ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-neutral-600'} ${!isSameMonth(dia, dataAtual) ? 'opacity-20' : ''}`}>
              {format(dia, 'd')}
            </div>
          );
        })}
      </div>
    </div>
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