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
  const [avaliacaoAtual, setAvaliacaoAtual] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    
    // Verificação de segurança: checa o status financeiro antes de carregar o conteúdo
    const checkStatus = async () => {
  const { data: alunoData } = await supabase
    .from('alunos')
    .select('status_pagamento, data_vencimento')
    .eq('id', id)
    .single();

  if (alunoData) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Converte a data do banco para data local (evita fuso horário)
    const [ano, mes, dia] = alunoData.data_vencimento.split('-').map(Number);
    const vencimento = new Date(ano, mes - 1, dia);

    // Calcula limite de 2 dias
    const dataLimite = new Date(vencimento);
    dataLimite.setDate(dataLimite.getDate() + 2);
    dataLimite.setHours(0, 0, 0, 0);

    // Bloqueia APENAS se estiver bloqueado manualmente OU se passou dos 2 dias
    const estaBloqueado = alunoData.status_pagamento === 'bloqueado' || hoje > dataLimite;

    if (estaBloqueado) {
      router.push('/pagamento-pendente?motivo=vencido');
      return;
    }
  }
  fetchData();
};

    checkStatus();
  }, [id, router]);


  // Exemplo dentro da página do aluno
useEffect(() => {
  const checkStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: aluno } = await supabase
      .from('alunos')
      .select('ativo')
      .eq('id', session.user.id)
      .single();

    // Se o aluno estiver inativo, expulsa ele
    if (aluno && !aluno.ativo) {
      await supabase.auth.signOut();
      router.push('/login-aluno');
      alert("Sua conta está inativa. Entre em contato com seu treinador.");
    }
  };
  checkStatus();
}, []);

const fetchData = async () => {
  setLoading(true);
  console.log("--- INICIANDO BUSCA DE DADOS ---");
  console.log("ID do Aluno alvo:", id);

  // 1. Busca dados do Aluno e Personal
  const { data: alunoData, error: alunoError } = await supabase
    .from('alunos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (alunoError) console.error("Erro ao buscar Aluno:", alunoError);
  if (alunoData) {
    setAluno(alunoData);
    console.log("Aluno encontrado:", alunoData.nome);
    
    if (alunoData.personal_id) {
      const { data: pData } = await supabase
        .from('personais')
        .select('*')
        .eq('id', alunoData.personal_id)
        .maybeSingle();
      if (pData) setPersonal(pData);
    }
  }

  // 2. BUSCA CORRETA: Tabela 'conclusoes_treino'
  // Usando a coluna 'data_conclusao' conforme visto no seu banco de dados
  const inicioDaSemana = startOfWeek(new Date(), { weekStartsOn: 1 });
  console.log("Buscando conclusões desde:", inicioDaSemana.toISOString());

  const { data: conclusoes, error: erroTreino } = await supabase
    .from('conclusoes_treino') 
    .select('data_conclusao') 
    .eq('aluno_id', id)
    .gte('data_conclusao', inicioDaSemana.toISOString());
  
  if (erroTreino) {
    console.error("ERRO AO BUSCAR CONCLUSÕES:", erroTreino);
  } else if (conclusoes) {
    console.log("Conclusões encontradas no banco:", conclusoes);
    
    // Normaliza as datas para o fuso local ignorando horas
    const datas = conclusoes.map(d => {
      const date = parseISO(d.data_conclusao);
      date.setHours(0, 0, 0, 0);
      return date;
    });
    
    setDiasTreino(datas);
    console.log("Datas mapeadas para o estado:", datas);
  } else {
    console.log("Nenhuma conclusão encontrada para este aluno.");
    setDiasTreino([]);
  }

  setLoading(false);
  console.log("--- BUSCA FINALIZADA ---");
};

  const abrirAvaliacoes = async () => {
  setIsLoading(true); // Feedback visual imediato

  try {
    const { data, error } = await supabase
      .from('avaliacoes_fisicas')
      .select('*')
      .eq('aluno_id', id)
      .order('data_avaliacao', { ascending: true }); // Crucial para o gráfico

    if (error) throw error;

    if (data && data.length > 0) {
      // 1. O gráfico recebe todo o histórico ordenado
      setAvaliacoes(data);
      
      // 2. O Modal exibe a última avaliação (a mais recente) automaticamente
      const ultimaAvaliacao = data[data.length - 1];
      setAvaliacaoAtual(ultimaAvaliacao); 
      
      setModalAberta(true);
    } else {
      // Feedback amigável ao invés de um alert bloqueante
      alert("Nenhum histórico de avaliação encontrado para este aluno.");
    }
  } catch (err) {
    console.error("Erro ao carregar avaliações:", err);
    alert("Não foi possível carregar os dados. Tente novamente mais tarde.");
  } finally {
    setIsLoading(false); // Remove o estado de carregamento
  }
};

  if (loading) return <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-gray-400 font-bold">Carregando...</main>;

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        {/* Header Perfil */}
        <header className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 rounded-full bg-white shadow-lg overflow-hidden border border-gray-100 mb-6 p-1">
             {personal?.avatar_url ? <img src={personal.avatar_url} className="w-full h-full object-cover rounded-full" /> : <FaUserCircle className="w-full h-full text-gray-200" />}
          </div>
          <h1 className="font-black text-gray-950 text-xl tracking-tighter">{personal?.nome || 'Personal Trainer'}</h1>
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.25em] mt-1">CREF: {personal?.cref || 'N/A'}</p>
        </header>


 {aluno && (
  <div className="mb-10 max-w-sm mx-auto space-y-4">
    {/* Banner de Aviso (Lógica isolada) */}
    {(() => {
      const hoje = new Date().getTime();
      const vencimento = aluno.data_vencimento ? new Date(aluno.data_vencimento).getTime() : 0;
      const diasRestantes = (vencimento - hoje) / (1000 * 3600 * 24);
      const estaBloqueado = aluno.status_pagamento === 'bloqueado';
      
      if (!estaBloqueado && diasRestantes > 3) return null;

      return (
      <div className={`group flex items-center justify-between gap-4 px-5 py-4 rounded-3xl border transition-all duration-500 ${
      estaBloqueado ? 'bg-red-500/5 border-red-500/10 text-red-600' : 'bg-amber-500/5 border-amber-500/10 text-amber-600'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${estaBloqueado ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
          <FaExclamationTriangle className="text-sm" />
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest">
            {estaBloqueado ? "Acesso Restrito" : "Aviso de Renovação"}
          </h4>
          <p className="text-[10px] opacity-70 mt-0.5">
            {estaBloqueado ? "Sua assinatura está pendente. Regularize para continuar." : "Seu plano expira em breve. Evite interrupções."}
          </p>
        </div>
      </div>
      <button 
  onClick={() => router.push('/aluno/antecipar?motivo=renovacao')}
  className="text-[10px] font-black uppercase opacity-50 underline decoration-2 underline-offset-4 decoration-current cursor-pointer hover:opacity-100"
>
  Antecipar Pagamento
</button>
    </div>
  );
})()}

    {/* Card de Status */}
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${aluno.status_pagamento === 'bloqueado' ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            {aluno.status_pagamento === 'bloqueado' ? 'Restrito' : 'Assinatura Ativa'}
          </span>
        </div>
        <p className="text-xl font-black text-gray-950">
          {aluno.status_pagamento === 'bloqueado' ? 'Conta Bloqueada' : 'Plano Premium'}
        </p>
      </div>
      <div className="w-full h-px bg-gray-50" />
      <div className="w-full flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-gray-400">
        <span>Vencimento</span>
        <span className="text-gray-900">
          {aluno.data_vencimento ? new Date(aluno.data_vencimento).toLocaleDateString('pt-BR') : 'Data não definida'}
        </span>
      </div>
    </div>
  </div>
)}

<section className="mb-10">
  <h2 className="text-3xl font-black text-gray-950 tracking-tighter mb-8">Olá, {aluno?.nome.split(' ')[0]}.</h2>
  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Sua semana de treinos</h2>
    <div className="flex justify-between items-center">
      {/* 1. Ajuste: weekStartsOn: 1 (Segunda-feira é o primeiro dia) */}
     {eachDayOfInterval({ 
  start: startOfWeek(new Date(), { weekStartsOn: 1 }), 
  end: endOfWeek(new Date(), { weekStartsOn: 1 }) 
}).map((dia, index) => {
  const treinou = diasTreino.some(d => isSameDay(d, dia));
  const hoje = isSameDay(dia, new Date());
  const diaPassadoSemTreino = dia < new Date() && !treinou && !hoje; // Verifica dias perdidos
  
  return (
    <div key={index} className="flex flex-col items-center gap-3">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all 
        ${treinou 
          ? 'bg-emerald-500 text-white' 
          : diaPassadoSemTreino 
            ? 'bg-red-50 text-red-400' // Estilo para dia não treinado
            : hoje 
              ? 'border-2 border-gray-900 text-gray-900' 
              : 'bg-gray-50 text-gray-300'
        }`}
      >
        {treinou ? '✓' : diaPassadoSemTreino ? '✕' : hoje ? '●' : ''}
      </div>
      <span className="text-[9px] font-bold text-gray-400 uppercase">
        {format(dia, 'EEEEE', { locale: ptBR })}
      </span>
    </div>
  );
})}
    </div>
  </div>
</section>

<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  <BotaoMenu 
    icon={<FaDumbbell />} 
    label="Treinos" 
    onClick={() => router.push(`/aluno/${id}/treinos`)} 
  />
  <BotaoMenu 
    icon={<FaClipboardList />} 
    label="Avaliações" 
    onClick={abrirAvaliacoes} 
  />
  <BotaoMenu 
    icon={<FaChartLine />} 
    label="Progresso" 
    onClick={() => router.push(`/aluno/${id}/progresso`)} 
  />
  <BotaoMenu 
    icon={<FaCommentMedical />} 
    label="Feedback" 
    onClick={() => router.push(`/aluno/${id}/feedback`)} 
  />
  <BotaoMenu 
    icon={<FaFileInvoice />} 
    label="Faturas" 
    onClick={() => router.push(`/aluno/${id}/faturas`)} 
  />
  <BotaoMenu 
    icon={<FaFolderOpen />} 
    label="Arquivos" 
    onClick={() => router.push(`/aluno/${id}/arquivos`)} 
  />
</div>

{/* Renderização do Modal */}
       {/* Renderização do Modal */}
{modalAberta && (
  <ModalAvaliacao 
    isOpen={modalAberta} 
    onClose={() => setModalAberta(false)} 
    // Avaliação mais recente (último item do array)
    avaliacao={avaliacoes[avaliacoes.length - 1]} 
    
    // Gráfico cronológico: do mais antigo para o mais novo
    historico={avaliacoes.map(a => ({ 
      data: new Date(a.data_avaliacao).toLocaleDateString(), 
      peso: a.peso 
    }))} 
  />
)}
      </div>
    </main>
  );
}

// --- Funções fora da export default ---

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
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto border border-slate-100 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Análise Corporal</h2>
            <p className="text-xl font-black text-slate-950 tracking-tighter">Sua Evolução</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-600"
          >
            &times;
          </button>
        </div>

        {/* Gráfico de Evolução de Peso */}
        <div className="h-40 w-full mb-8 bg-slate-50/50 rounded-[2rem] p-5 border border-slate-100 flex flex-col justify-center">
          {historico && historico.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientPeso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="data" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                        {payload[0].value} kg
                      </div>
                    );
                  }
                  return null;
                }} />
                <Area type="monotone" dataKey="peso" stroke="none" fill="url(#gradientPeso)" />
                <Line 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="#0f172a" 
                  strokeWidth={4} 
                  connectNulls={true}
                  dot={{ fill: '#fff', stroke: '#0f172a', strokeWidth: 3, r: 6 }} 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#0f172a' }} 
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-center h-full">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-slate-500 text-lg">⚖️</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dados insuficientes</p>
            </div>
          )}
        </div>

        {/* KPIs em destaque com Delta */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-slate-900 p-5 rounded-2xl text-white relative">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Peso Atual</p>
            <div className="flex items-end gap-2">
              <p className="font-black text-2xl tracking-tighter">{avaliacao.peso || 0}<span className="text-sm text-slate-500 ml-1">kg</span></p>
              {delta !== 0 && (
                <span className={`text-[10px] font-bold mb-1.5 ${ehPositivo ? 'text-red-400' : 'text-emerald-400'}`}>
                  {ehPositivo ? '+' : ''}{delta.toFixed(1)}kg
                </span>
              )}
            </div>
          </div>
          <div className="bg-slate-100 p-5 rounded-2xl">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Gordura Corp.</p>
            <p className="font-black text-2xl tracking-tighter text-slate-950">{avaliacao.gordura || 0}<span className="text-sm text-slate-400 ml-1">%</span></p>
          </div>
        </div>

        {/* Grade de Medidas */}
        <div className="space-y-4">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Medidas (cm)</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            {medidasList.map((m) => (
              <div key={m.label} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{m.label}</span>
                <span className="font-black text-slate-950 text-xs">{m.value || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function BotaoMenu({ icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="bg-white border border-gray-100 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-gray-200 hover:shadow-lg transition-all active:scale-[0.98]">
      <div className="text-lg text-gray-900">{icon}</div>
      <span className="font-black text-[10px] uppercase tracking-widest text-gray-400">{label}</span>
    </button>
  );
}