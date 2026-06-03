'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ToastSucesso from '@/components/ui/ToastSucesso';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFilePdf, FaCheck, FaInfoCircle, FaPlay } from "react-icons/fa";

export default function DetalheTreino({ params }: { params: Promise<{ id: string; treinoId: string }> }) {
  const resolvedParams = use(params);
  const { id, treinoId } = resolvedParams;
  const router = useRouter();

  const [ficha, setFicha] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [concluidos, setConcluidos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessoesContador, setSessoesContador] = useState(0);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  
  const exercicios = ficha?.descricao ? (typeof ficha.descricao === 'string' ? JSON.parse(ficha.descricao) : ficha.descricao) : [];
  const totalExercicios = exercicios.length;
  const progresso = totalExercicios > 0 ? Math.round((concluidos.length / totalExercicios) * 100) : 0;
  const todosFinalizados = totalExercicios > 0 && concluidos.length === totalExercicios;

  // Função restaurada para renderizar o vídeo corretamente
  const renderizarVideo = (url: string) => {
    if (!url) return null;
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const embedUrl = url.includes("shorts/") ? url.replace("shorts/", "embed/") : url.replace("watch?v=", "embed/");
    return (
      <div className="w-full h-full bg-black">
        {isYoutube ? (
          <iframe className="w-full h-full" src={embedUrl.split('&')[0]} allowFullScreen />
        ) : (
          <video controls className="w-full h-full object-cover" src={url} />
        )}
      </div>
    );
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(ficha?.nome_treino || "Treino", 14, 20);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 28);

    const tabelaDados: any[] = [];
    exercicios.forEach((ex: any) => {
      (ex.series || []).forEach((s: any, idx: number) => {
        const key = `${ex.nome}-${idx}`;
        tabelaDados.push([idx === 0 ? ex.nome : "", s.ordem || idx + 1, s.reps || '-', s.carga ? `${s.carga}kg` : '-', s.intervalo ? `${s.intervalo}s` : '-', inputValues[key] ? `${inputValues[key]}kg` : '-']);
      });
    });

    autoTable(doc, {
      startY: 35,
      head: [['Exercício', 'Série', 'Reps', 'Carga Rec.', 'Intervalo', 'Sua Carga']],
      body: tabelaDados,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`${ficha?.nome_treino || 'Treino'}.pdf`);
  };

  const fetchData = async () => {
    if (!treinoId) return;
    setLoading(true);
    const [fichaRes, regRes, concRes] = await Promise.all([
      supabase.from('fichas').select('*').eq('id', treinoId).maybeSingle(),
      supabase.from('registro_series').select('*').eq('treino_id', treinoId),
      supabase.from('conclusoes_treino').select('id', { count: 'exact' }).eq('treino_id', treinoId)
    ]);
    
    setFicha(fichaRes.data);
    if (regRes.data) {
      const initialInputs: Record<string, string> = {};
      regRes.data.forEach((r: any) => initialInputs[`${r.exercicio_nome}-${r.serie_index}`] = r.carga.toString());
      setInputValues(initialInputs);
      setRegistros(regRes.data);
    }
    setSessoesContador(concRes.count || 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [treinoId]);

  const registrarCarga = async (nomeExercicio: string, carga: number, reps: number, serieIndex: number) => {
    if (!carga || carga <= 0) return;
    const registroExistente = registros.find(r => r.exercicio_nome === nomeExercicio && r.serie_index === serieIndex);
    const payload = { aluno_id: id, treino_id: treinoId, exercicio_nome: nomeExercicio, carga, repeticoes: reps, serie_index: serieIndex };
   // Substitua a linha 96 (ou a que contém o upsert) por esta:
const { data, error } = await supabase
  .from('registro_series')
  .upsert((registroExistente ? { ...payload, id: registroExistente.id } : payload) as any) // <- O 'as any' resolve o erro de tipo
  .select();
    if (!error && data) setRegistros(prev => [...prev.filter(r => r.id !== data[0].id), ...data]);
  };

  const finalizarSessao = async () => {
    setLoading(true);
    try {
      await Promise.all([
        supabase.from('conclusoes_treino').insert({ aluno_id: id, treino_id: treinoId, data_conclusao: new Date().toISOString() }),
        supabase.from('historico_treinos').insert({ aluno_id: id, data_treino: new Date().toISOString() })
      ]);
      setSessoesContador(prev => prev + 1); 
      setShowToast(true);
    } catch (err: any) { alert("Erro ao finalizar: " + err.message); } finally { setLoading(false); }
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
    <main className="min-h-screen bg-black text-white p-4 pb-24">
      <div className="max-w-2xl mx-auto">
       <header className="flex justify-between items-center mb-8 px-2">
  <button 
    onClick={() => router.back()} 
    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all"
  >
    <span className="text-blue-500">←</span> Voltar
  </button>
  
  <button 
    onClick={gerarPDF} 
    className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-600/20 transition-all"
  >
    <FaFilePdf className="inline mr-2 text-blue-500"/> Baixar Treino
  </button>
</header>

        <div className="mb-8 px-2">
          <h1 className="text-3xl font-black tracking-tighter">{ficha?.nome_treino || "Treino"}</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-widest mt-2">Sessões Totais: {sessoesContador}</p>
          <div className="w-full h-1.5 bg-neutral-900 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progresso}%` }} />
          </div>
        </div>
        
        {exercicios.map((ex: any, exIndex: number) => (
  <div key={exIndex} className={`mb-6 bg-neutral-900/50 backdrop-blur-xl rounded-[2rem] border overflow-hidden ${concluidos.includes(exIndex) ? 'border-blue-500/30' : 'border-white/5'}`}>
    {/* Estrutura Alterada: 'flex-row' fixo para manter vídeo na lateral */}
    <div className="flex flex-row">
      
      {/* Vídeo Lateral - Largura menor (w-1/3) */}
      {ex.video && (
        <div className="w-1/3 bg-black shrink-0">
            {renderizarVideo(ex.video)}
        </div>
      )}
      
      {/* Conteúdo ao lado */}
      <div className="p-4 flex-1">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-black text-sm">{ex.nome}</h3>
          <button onClick={() => !concluidos.includes(exIndex) && setConcluidos([...concluidos, exIndex])} 
                  className={`p-2 rounded-xl ${concluidos.includes(exIndex) ? 'bg-blue-600' : 'bg-white/5'}`}>
            <FaCheck className="text-[10px]" />
          </button>
        </div>
        
        {ex.observacao && <div className="mb-2 p-2 bg-blue-600/10 text-blue-400 text-[8px] font-bold rounded-lg"><FaInfoCircle className="inline mr-1"/> {ex.observacao}</div>}

        <div className="space-y-1.5">
          {ex.series?.map((s: any, sIndex: number) => {
            const key = `${ex.nome}-${sIndex}`;
            return (
              <div key={sIndex} className="grid grid-cols-4 items-center gap-1 bg-black/40 p-2 rounded-lg border border-white/5 text-center">
                <span className="text-[8px] font-bold">{s.ordem || sIndex + 1}ª</span>
                <span className="text-[9px] font-bold">{s.reps}x</span>
                <span className="text-[9px] font-bold">{s.carga || 0}kg</span>
                <input 
                  type="number" placeholder="kg" value={inputValues[key] || ''} 
                  onChange={(e) => setInputValues(prev => ({ ...prev, [key]: e.target.value }))}
                  onBlur={(e) => registrarCarga(ex.nome, Number(e.target.value), s.reps, sIndex)}
                  className="bg-white/5 rounded-md py-1 text-[9px] font-bold text-center border border-white/10 outline-none focus:border-blue-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
))}

        <button onClick={finalizarSessao} disabled={!todosFinalizados} 
                className={`w-full py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${todosFinalizados ? 'bg-blue-600 shadow-xl' : 'bg-neutral-800 text-neutral-500'}`}>
          {todosFinalizados ? 'Finalizar Sessão' : 'Conclua todos os exercícios'}
        </button>

        {showToast && <ToastSucesso mensagem="Treino registrado." onClose={() => router.push(`/aluno/${id}`)} />}
      </div>
    </main>
  );
}