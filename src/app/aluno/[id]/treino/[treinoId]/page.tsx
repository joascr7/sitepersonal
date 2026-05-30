'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ToastSucesso from '@/components/ui/ToastSucesso';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFilePdf } from "react-icons/fa";

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
      headStyles: { fillColor: [52, 133, 191] },
    });

    doc.save(`${ficha?.nome_treino || 'Treino'}.pdf`);
  };

  useEffect(() => {
    if (!treinoId) return;
    const fetchData = async () => {
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
    fetchData();
  }, [treinoId]);

 const registrarCarga = async (nomeExercicio: string, carga: number, reps: number, serieIndex: number) => {
    if (!carga || carga <= 0) return;
    
    const registroExistente = registros.find(r => r.exercicio_nome === nomeExercicio && r.serie_index === serieIndex);
    
    // Payload base sem ID
    const payload = { 
      aluno_id: id, 
      treino_id: treinoId, 
      exercicio_nome: nomeExercicio, 
      carga, 
      repeticoes: reps, 
      serie_index: serieIndex 
    };

    // Adiciona o ID apenas se estivermos atualizando um registro existente
    const upsertData = registroExistente 
      ? { ...payload, id: registroExistente.id } 
      : payload;

    const { data, error } = await supabase
      .from('registro_series')
      .upsert(upsertData as any) // Asserção para permitir o campo 'id'
      .select();

    if (!error && data) {
      setRegistros(prev => [...prev.filter(r => r.id !== data[0].id), ...data]);
    }
  };

  const finalizarSessao = async () => {
    setLoading(true);
    try {
      const registrosParaSalvar = Object.entries(inputValues).map(([key, carga]) => {
        const [exercicio_nome, serie_index] = key.split('-');
        const serieOriginal = registros.find(r => r.exercicio_nome === exercicio_nome && r.serie_index === Number(serie_index));
        
        return {
          ...(serieOriginal?.id ? { id: serieOriginal.id } : {}), // Inclui o ID se já existir no banco
          aluno_id: id, 
          treino_id: treinoId, 
          exercicio_nome, 
          serie_index: Number(serie_index), 
          carga: Number(carga) || 0, 
          repeticoes: serieOriginal?.repeticoes || 12, 
          data_execucao: new Date().toISOString()
        };
      });

      const { error: errorSeries } = await supabase
        .from('registro_series')
        .upsert(registrosParaSalvar as any); // Asserção para aceitar o array com IDs

      if (errorSeries) throw new Error("Erro ao salvar séries: " + errorSeries.message);

      await Promise.all([
        supabase.from('conclusoes_treino').insert({ aluno_id: id, treino_id: treinoId }),
        supabase.from('historico_treinos').insert({ aluno_id: id, data_treino: new Date().toISOString() })
      ]);
      
      setShowToast(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao finalizar treino.");
    } finally {
      setLoading(false);
    }
  };

  const renderizarVideo = (url: string) => {
    if (!url) return null;
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const embedUrl = url.includes("shorts/") ? url.replace("shorts/", "embed/") : url.replace("watch?v=", "embed/");
    return (
      <div className="w-full bg-black rounded-3xl overflow-hidden mb-6 aspect-video shadow-lg">
        {isYoutube ? <iframe className="w-full h-full" src={embedUrl.split('&')[0]} allowFullScreen /> : <video controls className="w-full h-full" src={url} />}
      </div>
    );
  };

  if (loading) return <main className="p-10 text-center font-bold">CARREGANDO DADOS...</main>;

  return (
    <main className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="font-bold text-gray-400 uppercase text-xs">Voltar</button>
        <button onClick={gerarPDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all"><FaFilePdf /> PDF</button>
      </div>

      <header className="mb-10">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tighter">{ficha?.nome_treino || "Treino"}</h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Sessões totais: {sessoesContador}</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black">{progresso}%</span>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Concluído</p>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-black transition-all duration-500 ease-out" style={{ width: `${progresso}%` }} />
        </div>
      </header>
      
      {exercicios.map((ex: any, exIndex: number) => (
        <div key={exIndex} className={`mb-8 p-6 bg-white border rounded-3xl shadow-sm ${concluidos.includes(exIndex) ? 'border-black' : 'border-gray-100'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-gray-900">{ex.nome}</h3>
            <button onClick={() => !concluidos.includes(exIndex) && setConcluidos([...concluidos, exIndex])} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${concluidos.includes(exIndex) ? 'bg-black text-white' : 'bg-gray-100'}`}>
              {concluidos.includes(exIndex) ? 'Finalizado' : 'Marcar Exercício'}
            </button>
          </div>
          
          {ex.observacao && <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-xs font-medium rounded-xl italic">💡 {ex.observacao}</div>}
          {ex.video && renderizarVideo(ex.video)}

          <table className="w-full text-sm text-center">
            <thead className="text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-100">
              <tr><th className="pb-3 text-left">Série</th><th>Reps</th><th>Carga</th><th>Desc.</th><th>Sua Carga</th></tr>
            </thead>
            <tbody>
              {ex.series?.map((s: any, sIndex: number) => {
                const key = `${ex.nome}-${sIndex}`;
                return (
                  <tr key={sIndex} className="border-b border-gray-50">
                    <td className="py-4 font-black text-left">{s.ordem || sIndex + 1}</td>
                    <td className="py-4">{s.reps || '-'}</td>
                    <td className="py-4 text-gray-400">{s.carga || 0}kg</td>
                    <td className="py-4 font-black">{s.intervalo || 0}s</td>
                    <td className="py-4"><input type="number" value={inputValues[key] || ''} onChange={(e) => setInputValues(prev => ({ ...prev, [key]: e.target.value }))} onBlur={(e) => registrarCarga(ex.nome, Number(e.target.value), s.reps, sIndex)} className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <button onClick={finalizarSessao} disabled={!todosFinalizados} className={`w-full py-5 rounded-2xl font-black text-sm uppercase ${todosFinalizados ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
        {todosFinalizados ? 'Finalizar Sessão' : 'Conclua todos os exercícios'}
      </button>

      {showToast && <ToastSucesso mensagem="Treino registrado." onClose={() => router.push(`/aluno/${id}`)} />}
    </main>
  );
}