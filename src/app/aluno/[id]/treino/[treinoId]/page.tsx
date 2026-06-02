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
  const totalExercicios = exercicios.length;
  const progresso = totalExercicios > 0 ? Math.round((concluidos.length / totalExercicios) * 100) : 0;
  const todosFinalizados = totalExercicios > 0 && concluidos.length === totalExercicios;

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
        tabelaDados.push([
          idx === 0 ? ex.nome : "",
          s.ordem || idx + 1,
          s.reps || '-',
          s.carga ? `${s.carga}kg` : '-',
          s.intervalo ? `${s.intervalo}s` : '-',
          inputValues[key] ? `${inputValues[key]}kg` : '-'
        ]);
      });
      if (ex.observacao) {
        tabelaDados.push([{ content: `Obs: ${ex.observacao}`, colSpan: 6, styles: { fontStyle: 'italic', textColor: [100, 100, 100], fillColor: [245, 245, 245] } }]);
      }
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

  useEffect(() => {
    fetchData();
  }, [treinoId]);

  const registrarCarga = async (nomeExercicio: string, carga: number, reps: number, serieIndex: number) => {
    if (!carga || carga <= 0) return;
    
    const registroExistente = registros.find(r => r.exercicio_nome === nomeExercicio && r.serie_index === serieIndex);
    
    const payload = { 
      aluno_id: id, 
      treino_id: treinoId, 
      exercicio_nome: nomeExercicio, 
      carga, 
      repeticoes: reps, 
      serie_index: serieIndex 
    };

    const upsertData = registroExistente 
      ? { ...payload, id: registroExistente.id } 
      : payload;

    const { data, error } = await supabase
      .from('registro_series')
      .upsert(upsertData as any)
      .select();

    if (!error && data) {
      setRegistros(prev => [...prev.filter(r => r.id !== data[0].id), ...data]);
    }
  };

  const finalizarSessao = async () => {
    setLoading(true);
    try {
      await Promise.all([
        supabase.from('conclusoes_treino').insert({ 
          aluno_id: id, 
          treino_id: treinoId,
          data_conclusao: new Date().toISOString() 
        }),
        supabase.from('historico_treinos').insert({ 
          aluno_id: id, 
          data_treino: new Date().toISOString() 
        })
      ]);
      
      setSessoesContador(prev => prev + 1); 
      setShowToast(true);
    } catch (err: any) {
      console.error("Erro na finalização:", err);
      alert("Erro ao finalizar treino: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderizarVideo = (url: string) => {
    if (!url) return null;
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const embedUrl = url.includes("shorts/") ? url.replace("shorts/", "embed/") : url.replace("watch?v=", "embed/");
    return (
      <div className="w-full bg-black rounded-3xl overflow-hidden mb-6 aspect-video border border-white/5 shadow-2xl">
        {isYoutube ? <iframe className="w-full h-full" src={embedUrl.split('&')[0]} allowFullScreen /> : <video controls className="w-full h-full" src={url} />}
      </div>
    );
  };

  if (loading) return <main className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black">CARREGANDO DADOS...</main>;

  return (
    <main className="min-h-screen bg-black p-6 md:p-12 text-white">
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <button onClick={() => router.back()} className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 hover:text-white">← Voltar</button>
          <button onClick={gerarPDF} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"><FaFilePdf /> Exportar PDF</button>
        </header>

        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tighter">{ficha?.nome_treino || "Treino"}</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Sessões Totais: {sessoesContador}</p>
          <div className="w-full h-2 bg-neutral-900 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]" style={{ width: `${progresso}%` }} />
          </div>
        </div>
        
        {exercicios.map((ex: any, exIndex: number) => (
          <div key={exIndex} className={`mb-8 p-8 bg-neutral-950/80 backdrop-blur-xl rounded-[2.5rem] border ${concluidos.includes(exIndex) ? 'border-blue-500/50' : 'border-white/5'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black">{ex.nome}</h3>
              <button onClick={() => !concluidos.includes(exIndex) && setConcluidos([...concluidos, exIndex])} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${concluidos.includes(exIndex) ? 'bg-blue-600 text-white' : 'bg-white/5 text-neutral-400'}`}>
                {concluidos.includes(exIndex) ? <><FaCheck /> Finalizado</> : 'Marcar Exercício'}
              </button>
            </div>
            
            {ex.observacao && <div className="mb-6 p-4 bg-blue-600/10 text-blue-400 text-[10px] font-bold rounded-2xl flex items-center gap-2"><FaInfoCircle /> {ex.observacao}</div>}
            {ex.video && renderizarVideo(ex.video)}

            <table className="w-full text-center text-xs">
              <thead className="text-[9px] uppercase font-black text-neutral-500 tracking-widest border-b border-white/5">
                <tr><th className="pb-3 text-left">Série</th><th>Reps</th><th>Carga</th><th>Desc.</th><th>Sua Carga</th></tr>
              </thead>
              <tbody className="text-xs font-medium">
                {ex.series?.map((s: any, sIndex: number) => {
                  const key = `${ex.nome}-${sIndex}`;
                  return (
                    <tr key={sIndex} className="border-b border-white/5">
                      <td className="py-4 font-black text-left">{s.ordem || sIndex + 1}</td>
                      <td className="py-4 text-neutral-400">{s.reps || '-'}</td>
                      <td className="py-4 text-neutral-400">{s.carga || 0}kg</td>
                      <td className="py-4 font-black">{s.intervalo || 0}s</td>
                      <td className="py-4">
  <input 
    type="number" 
    placeholder="0"
    value={inputValues[key] || ''} 
    onChange={(e) => setInputValues(prev => ({ ...prev, [key]: e.target.value }))} 
    onBlur={(e) => registrarCarga(ex.nome, Number(e.target.value), s.reps, sIndex)} 
    className="w-20 py-2.5 bg-white/5 border border-white/10 rounded-xl text-center font-black text-white placeholder-neutral-600 focus:bg-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300"
  />
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        <button 
          onClick={finalizarSessao} 
          disabled={!todosFinalizados} 
          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${todosFinalizados ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
        >
          {todosFinalizados ? 'Finalizar Sessão' : 'Conclua todos os exercícios'}
        </button>

        {showToast && <ToastSucesso mensagem="Treino registrado." onClose={() => router.push(`/aluno/${id}`)} />}
      </div>
    </main>
  );
}