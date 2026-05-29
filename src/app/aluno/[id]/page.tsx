'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaDumbbell, FaClipboardList, FaChartLine, FaFileInvoice, FaFolderOpen, FaUserCircle, FaCommentMedical } from 'react-icons/fa';
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
        const vencimento = alunoData.data_vencimento ? new Date(alunoData.data_vencimento) : null;
        
        if (alunoData.status_pagamento === 'bloqueado' || (vencimento && vencimento < hoje)) {
          router.push('/pagamento-pendente?motivo=vencido');
          return;
        }
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


        {/* Status de Pagamento (Premium UI) */}
{aluno && (
  <div className="mb-10 max-w-sm mx-auto">
    <div className={`p-6 rounded-3xl border ${
      aluno.status_pagamento === 'bloqueado' 
        ? 'bg-red-50 border-red-100' 
        : 'bg-white border-gray-100 shadow-sm'
    }`}>
      <div className="flex flex-col gap-1 text-center">
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
          Status do Plano
        </span>
        <span className={`text-sm font-black tracking-tighter ${
          aluno.status_pagamento === 'bloqueado' ? 'text-red-600' : 'text-gray-900'
        }`}>
          {aluno.status_pagamento === 'bloqueado' ? 'Acesso Restrito' : 'Plano Ativo'}
        </span>
        <span className="text-[10px] font-medium text-gray-500 mt-1">
          Vencimento: {aluno.data_vencimento ? new Date(aluno.data_vencimento).toLocaleDateString('pt-BR') : 'Não definido'}
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
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all
                      ${treinou ? 'bg-gray-900 text-white' : hoje ? 'border-2 border-gray-900 text-gray-900' : 'bg-gray-50 text-gray-300'}`}>
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

        {modalAberta && (
          <ModalAvaliacao isOpen={modalAberta} onClose={() => setModalAberta(false)} avaliacao={avaliacoes[0]} historico={avaliacoes.map(a => ({ data: new Date(a.data_avaliacao).toLocaleDateString(), peso: a.peso })).reverse()} />
        )}
      </div>
    </main>
  );
}

function ModalAvaliacao({ isOpen, onClose, avaliacao, historico }: any) {
  if (!isOpen) return null;

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
        
        {/* Header Minimalista */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Evolução</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-900 transition-colors text-xl"
          >
            &times;
          </button>
        </div>

        {/* Gráfico de Tendência (Premium) */}
        <div className="h-32 w-full mb-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historico} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="peso" 
                stroke="#000" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Métricas Principais (Bento Cards) */}
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

        {/* Medidas Detalhadas (Clean List) */}
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