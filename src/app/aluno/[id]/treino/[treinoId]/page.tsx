'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ToastSucesso from '@/components/ui/ToastSucesso';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFilePdf, FaCheck, FaInfoCircle } from "react-icons/fa";

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
  const progresso = exercicios.length > 0 ? Math.round((concluidos.length / exercicios.length) * 100) : 0;
  const todosFinalizados = exercicios.length > 0 && concluidos.length === exercicios.length;

  const renderizarVideo = (url: string) => {
    if (!url) return null;
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const embedUrl = url.includes("shorts/") ? url.replace("shorts/", "embed/") : url.replace("watch?v=", "embed/");
    return (
      <div className="w-full h-full bg-black">
        {isYoutube ? <iframe className="w-full h-full" src={embedUrl.split('&')[0]} allowFullScreen /> : <video controls className="w-full h-full object-cover" src={url} />}
      </div>
    );
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(ficha?.nome_treino || "Treino", 14, 20);
    const tabelaDados: any[] = [];
    exercicios.forEach((ex: any) => {
      (ex.series || []).forEach((s: any, idx: number) => {
        const key = `${ex.nome}-${idx}`;
        tabelaDados.push([ex.nome, s.ordem || idx + 1, s.reps || '-', s.carga ? `${s.carga}kg` : '-', s.intervalo ? `${s.intervalo}s` : '-', inputValues[key] ? `${inputValues[key]}kg` : '-']);
      });
    });
    autoTable(doc, { startY: 35, head: [['Exercício', 'Série', 'Reps', 'Carga', 'Desc.', 'Sua Carga']], body: tabelaDados });
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
      const vals: Record<string, string> = {};
      regRes.data.forEach((r: any) => vals[`${r.exercicio_nome}-${r.serie_index}`] = r.carga.toString());
      setInputValues(vals);
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
    const { data } = await supabase.from('registro_series').upsert((registroExistente ? { ...payload, id: registroExistente.id } : payload) as any).select();
    if (data) setRegistros(prev => [...prev.filter(r => r.id !== data[0].id), ...data]);
  };

  const finalizarSessao = async () => {
    setLoading(true);
    await Promise.all([
      supabase.from('conclusoes_treino').insert({ aluno_id: id, treino_id: treinoId, data_conclusao: new Date().toISOString() }),
      supabase.from('historico_treinos').insert({ aluno_id: id, data_treino: new Date().toISOString() })
    ]);
    setShowToast(true);
    setLoading(false);
  };

  if (loading) return (
    <main className="min-h-screen bg-black p-6 space-y-6 animate-pulse">
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
    // Adicionado pb-0 aqui, pois o padding será controlado no container interno.
    // pt-20 compensa a barra superior fixa.
    <main className="w-full bg-black text-white pt-20 px-4 pb-0">
      <div className="max-w-2xl mx-auto pb-32">
        <header className="flex justify-between items-center mb-8 px-2">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-white/5 px-4 py-2 rounded-xl">← Voltar</button>
          <button onClick={gerarPDF} className="bg-blue-600/10 text-blue-400 px-4 py-2 rounded-xl text-[9px] font-black uppercase border border-blue-600/20"><FaFilePdf className="inline mr-2"/> BAIXAR TREINO</button>
        </header>

        <div className="mb-8 px-2">
          <h1 className="text-3xl font-black tracking-tighter">{ficha?.nome_treino}</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-widest mt-2">Sessões Totais: {sessoesContador}</p>
          <div className="w-full h-1.5 bg-neutral-900 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progresso}%` }} />
          </div>
        </div>
        
        {exercicios.map((ex: any, exIndex: number) => (
          <div key={exIndex} className={`mb-6 bg-neutral-900/50 backdrop-blur-xl rounded-[2rem] border overflow-hidden ${concluidos.includes(exIndex) ? 'border-blue-500/30' : 'border-white/5'}`}>
            <div className="flex flex-row">
              {ex.video && <div className="w-1/3 bg-black shrink-0">{renderizarVideo(ex.video)}</div>}
              
              <div className="p-4 flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-sm">{ex.nome}</h3>
                  <button onClick={() => !concluidos.includes(exIndex) && setConcluidos([...concluidos, exIndex])} className={`p-2 rounded-xl ${concluidos.includes(exIndex) ? 'bg-blue-600' : 'bg-white/5'}`}><FaCheck className="text-[10px]" /></button>
                </div>
                
                {ex.observacao && <div className="mb-3 p-2 bg-blue-600/10 text-blue-400 text-[8px] font-bold rounded-lg"><FaInfoCircle className="inline mr-1"/> {ex.observacao}</div>}

                {/* Cabeçalho da Grade */}
                <div className="grid grid-cols-4 gap-1 mb-1 px-1">
                  <span className="text-[8px] font-black text-neutral-500 uppercase text-center">Série</span>
                  <span className="text-[8px] font-black text-neutral-500 uppercase text-center">Reps</span>
                  <span className="text-[8px] font-black text-neutral-500 uppercase text-center">Carga Sugerida</span>
                  <span className="text-[8px] font-black text-neutral-500 uppercase text-center">Edit Carga</span>
                </div>

                <div className="space-y-1.5">
                  {ex.series?.map((s: any, sIndex: number) => {
                    const key = `${ex.nome}-${sIndex}`;
                    return (
                      <div key={sIndex} className="grid grid-cols-4 items-center gap-1 bg-black/40 p-2 rounded-lg border border-white/5 text-center">
                        <span className="text-[9px] font-black text-neutral-500">{s.ordem || sIndex + 1}ª</span>
                        <span className="text-[10px] font-bold">{s.reps}x</span>
                        <span className="text-[10px] font-bold">{s.carga || 0}kg</span>
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
          {todosFinalizados ? 'Finalizar Sessão' : 'Complete todos os exercícios'}
        </button>

        {showToast && <ToastSucesso mensagem="Treino registrado." onClose={() => router.push(`/aluno/${id}`)} />}
        
        {/* ESPAÇADOR DE SEGURANÇA (Adicionado para garantir o scroll final abaixo da navbar fixa) */}
        <div className="h-40 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}