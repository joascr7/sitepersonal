'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaDumbbell, FaClipboardList, FaChartLine, FaFileInvoice, FaFolderOpen, FaUserCircle, FaExclamationTriangle, FaCommentMedical } from 'react-icons/fa';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
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
    const { data: alunoData } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
    if (alunoData) {
      setAluno(alunoData);
      if (alunoData.personal_id) {
        const { data: pData } = await supabase.from('personais').select('*').eq('id', alunoData.personal_id).maybeSingle();
        if (pData) setPersonal(pData);
      }
    }

    const { data: conclusoes } = await supabase
      .from('conclusoes_treino')
      .select('created_at')
      .eq('aluno_id', id)
      .gte('created_at', startOfWeek(new Date()).toISOString());
    
    if (conclusoes) setDiasTreino(conclusoes.map(d => parseISO(d.created_at)));
    setLoading(false);
  };

  const abrirAvaliacoes = async () => {
    const { data } = await supabase.from('avaliacoes_fisicas').select('*').eq('aluno_id', id).order('data_avaliacao', { ascending: false });
    if (data && data.length > 0) {
      setAvaliacoes(data);
      setModalAberta(true);
    } else alert("Nenhum registro encontrado.");
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
  onClick={() => router.push('/aluno/pagamento-pendente?motivo=renovacao')}
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
      {eachDayOfInterval({ start: startOfWeek(new Date(), { weekStartsOn: 0 }), end: endOfWeek(new Date(), { weekStartsOn: 0 }) }).map((dia, index) => {
        const treinou = diasTreino.some(d => isSameDay(d, dia));
        const hoje = isSameDay(dia, new Date());
        return (
          <div key={index} className="flex flex-col items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${treinou ? 'bg-gray-900 text-white' : hoje ? 'border-2 border-gray-900 text-gray-900' : 'bg-gray-50 text-gray-300'}`}>
              {treinou ? '✓' : hoje ? '●' : ''}
            </div>
            <span className="text-[9px] font-bold text-gray-400 uppercase">{format(dia, 'EEEEE')}</span>
          </div>
        );
      })}
    </div>
  </div>
</section>

<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  <BotaoMenu icon={<FaDumbbell />} label="Treinos" onClick={() => router.push(`/aluno/${id}/treinos`)} />
  <BotaoMenu icon={<FaClipboardList />} label="Avaliações" onClick={abrirAvaliacoes} />
  <BotaoMenu icon={<FaChartLine />} label="Progresso" onClick={() => router.push(`/aluno/${id}/progresso`)} />
  <BotaoMenu icon={<FaCommentMedical />} label="Feedback" onClick={() => router.push(`/aluno/${id}/feedback`)} />
  <BotaoMenu icon={<FaFileInvoice />} label="Faturas" />
  <BotaoMenu icon={<FaFolderOpen />} label="Arquivos" />
</div>

{/* Renderização do Modal */}
        {modalAberta && (
          <ModalAvaliacao 
            isOpen={modalAberta} 
            onClose={() => setModalAberta(false)} 
            avaliacao={avaliacoes[0]} 
            historico={avaliacoes.map(a => ({ 
              data: new Date(a.data_avaliacao).toLocaleDateString(), 
              peso: a.peso 
            })).reverse()} 
          />
        )}
      </div>
    </main>
  );
}

// --- Funções fora da export default ---

function ModalAvaliacao({ isOpen, onClose, avaliacao, historico }: any) {
  if (!isOpen || !avaliacao) return null;

  const medidasList = [
    { label: 'Torax', value: avaliacao.torax },
    { label: 'Ombros', value: avaliacao.ombros },
    { label: 'Abdomen', value: avaliacao.abdomen },
    { label: 'Cintura', value: avaliacao.cintura },
    { label: 'Quadril', value: avaliacao.quadril },
    { label: 'Braço Dir.', value: avaliacao.braco_direito },
    { label: 'Braço Esq.', value: avaliacao.braco_esquerdo },
  ];
  
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-gray-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Evolução</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors text-xl">&times;</button>
        </div>

        <div className="h-32 w-full mb-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historico} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Line type="monotone" dataKey="peso" stroke="#000" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-gray-50 p-5 rounded-2xl">
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Peso Atual</p>
            <p className="font-black text-2xl tracking-tighter">{avaliacao.peso || 0}<span className="text-sm text-gray-400 ml-1">kg</span></p>
          </div>
          <div className="bg-gray-50 p-5 rounded-2xl">
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Gordura</p>
            <p className="font-black text-2xl tracking-tighter">{avaliacao.gordura || 0}<span className="text-sm text-gray-400 ml-1">%</span></p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest border-b border-gray-100 pb-2">Medidas Detalhadas</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
            {medidasList.map((m) => (
              <div key={m.label}>
                <p className="text-gray-400 text-[9px] uppercase font-bold tracking-widest">{m.label}</p>
                <p className="font-black text-gray-900 text-sm">{m.value || 0} <span className="text-[10px] text-gray-400 font-medium">cm</span></p>
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