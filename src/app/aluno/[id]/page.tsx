'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaDumbbell, FaClipboardList, FaChartLine, FaFileInvoice, FaFolderOpen, FaUserCircle, FaCommentMedical } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AreaDoAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [aluno, setAluno] = useState<any>(null);
  const [personal, setPersonal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [modalAberta, setModalAberta] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    // Busca dados do aluno e dados do personal associado
    const { data: alunoData } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
    
    if (alunoData) {
      setAluno(alunoData);
      if (alunoData.personal_id) {
        const { data: pData } = await supabase.from('personais').select('*').eq('id', alunoData.personal_id).maybeSingle();
        if (pData) setPersonal(pData);
      }
    }
    setLoading(false);
  };

  const abrirAvaliacoes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('avaliacoes_fisicas') 
      .select('*')
      .eq('aluno_id', id)
      .order('data_avaliacao', { ascending: false });

    setLoading(false);
    if (!error && data && data.length > 0) {
      setAvaliacoes(data);
      setModalAberta(true);
    } else {
      alert("Nenhum registro encontrado.");
    }
  };

  if (loading) return <main className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Carregando...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="flex flex-col items-center mb-12 mt-6">
        <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden border-2 border-white shadow-sm">
          {personal?.avatar_url ? <img src={personal.avatar_url} className="w-full h-full object-cover" /> : <FaUserCircle className="w-full h-full text-gray-400" />}
        </div>
        <h1 className="font-black text-gray-900 text-lg tracking-tight">{personal?.nome || 'Personal Trainer'}</h1>
        {/* Renderização segura do CREF */}
        {personal && (
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            CREF: {personal.cref || 'N/A'}
          </p>
        )}
      </div>

      <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tighter">Olá, {aluno?.nome}.</h2>

      <div className="grid grid-cols-2 gap-4">
        <BotaoMenu icon={<FaDumbbell />} label="Treinos" onClick={() => router.push(`/aluno/${id}/treinos`)} />
        <BotaoMenu icon={<FaClipboardList />} label="Avaliações" onClick={abrirAvaliacoes} />
        <BotaoMenu icon={<FaChartLine />} label="Meu Progresso" onClick={() => router.push(`/aluno/${id}/evolucao`)} />
        <BotaoMenu icon={<FaCommentMedical />} label="Feedback Treino" onClick={() => router.push(`/aluno/${id}/feedback`)} />
        <BotaoMenu icon={<FaFileInvoice />} label="Faturas" />
        <BotaoMenu icon={<FaFolderOpen />} label="Arquivos" />
      </div>

      {modalAberta && avaliacoes.length > 0 && (
        <ModalAvaliacao 
          isOpen={modalAberta} 
          onClose={() => setModalAberta(false)} 
          avaliacao={avaliacoes[0]}
          historico={avaliacoes.map(a => ({ data: new Date(a.data_avaliacao).toLocaleDateString(), peso: a.peso })).reverse()}
        />
      )}
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
    { label: 'Braço Direito', value: avaliacao.braco_direito },
    { label: 'Braço Esquerdo', value: avaliacao.braco_esquerdo },
  ];
  
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-gray-900">Evolução Física</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-2xl transition">&times;</button>
        </div>

        <div className="h-48 w-full mb-8 bg-gray-50 rounded-2xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historico}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="data" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip contentStyle={{backgroundColor: '#000', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px'}} />
              <Line type="monotone" dataKey="peso" stroke="#000" strokeWidth={3} dot={{ r: 4, fill: '#000' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 p-6 rounded-2xl">
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">Peso Atual</p>
            <p className="text-2xl font-black">{avaliacao.peso || 0} kg</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">Gordura</p>
            <p className="text-2xl font-black">{avaliacao.gordura || 0}%</p>
          </div>
        </div>

        <div>
          <h3 className="text-gray-900 font-black uppercase text-[10px] tracking-widest mb-6 border-b border-gray-100 pb-2">Medidas Detalhadas</h3>
          <div className="grid grid-cols-2 gap-4">
            {medidasList.map((m) => (
              <div key={m.label} className="flex flex-col">
                <span className="text-gray-500 font-medium text-[10px] uppercase">{m.label}</span>
                <span className="font-black text-gray-900 text-sm">{m.value || 0} cm</span>
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
    <button onClick={onClick} className="bg-white border border-gray-100 p-6 rounded-3xl flex flex-col items-center justify-center h-32 hover:border-gray-200 transition-all shadow-sm active:scale-[0.98]">
      <div className="text-xl mb-3 text-gray-900">{icon}</div>
      <span className="font-bold text-[11px] uppercase tracking-wider text-gray-600">{label}</span>
    </button>
  );
}