'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { subMonths, startOfWeek, format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProgressoPersonal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [historico, setHistorico] = useState<any[]>([]);
  const [exerciciosUnicos, setExerciciosUnicos] = useState<string[]>([]);
  const [filtro, setFiltro] = useState({ exercicio: '', periodo: 'mes' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('registro_series')
        .select('*')
        .eq('aluno_id', id)
        .order('data_execucao', { ascending: false });

      if (data) {
        setHistorico(data);
        const unicos = Array.from(new Set(data.map((h: any) => h.exercicio_nome)));
        setExerciciosUnicos(unicos as string[]);
        if (unicos.length > 0) setFiltro(prev => ({ ...prev, exercicio: unicos[0] as string }));
      }
      setLoading(false);
    };
    if (id) carregarDados();
  }, [id]);

  const dadosFiltrados = useMemo(() => {
    const limite = filtro.periodo === 'semana' ? startOfWeek(new Date()) : subMonths(new Date(), 1);
    return historico.filter(h => h.exercicio_nome === filtro.exercicio && new Date(h.data_execucao) >= limite);
  }, [historico, filtro]);

  const dadosGrafico = useMemo(() => {
    const map = dadosFiltrados.reduce((acc, curr) => {
      const dataFmt = format(parseISO(curr.data_execucao), 'dd/MM');
      if (!acc[dataFmt] || curr.carga > acc[dataFmt].carga) {
        acc[dataFmt] = { data: dataFmt, carga: curr.carga };
      }
      return acc;
    }, {} as Record<string, any>);
    return Object.values(map).reverse();
  }, [dadosFiltrados]);

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Relatorio de Performance: ${filtro.exercicio}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);
    
    autoTable(doc, {
      startY: 35,
      head: [['Data', 'Carga (kg)', 'Repeticoes', 'Serie']],
      body: dadosFiltrados.map(d => [
        format(parseISO(d.data_execucao), 'dd/MM/yyyy HH:mm'),
        `${d.carga} kg`,
        d.repeticoes,
        d.serie_index + 1
      ]),
    });
    doc.save(`relatorio_${filtro.exercicio}_${format(new Date(), 'ddMMyyyy')}.pdf`);
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center font-black">PROCESSANDO DADOS...</main>;

  return (
    <main className="min-h-screen bg-[#F8F9FA] p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">Analytics do Aluno</h1>
            <p className="text-[10px] font-black uppercase text-gray-400 mt-1">Gestao de Alta Performance</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportarPDF} className="bg-white border px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-gray-50 transition-all">Exportar PDF</button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100">
            <label className="text-[9px] font-black uppercase text-gray-400">Exercício</label>
            <select className="w-full font-black text-lg outline-none cursor-pointer" value={filtro.exercicio} onChange={(e) => setFiltro({...filtro, exercicio: e.target.value})}>
              {exerciciosUnicos.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex bg-white p-2 rounded-[2rem] border border-gray-100">
            {['semana', 'mes'].map(p => (
              <button key={p} onClick={() => setFiltro({...filtro, periodo: p})}
                className={`flex-1 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest py-4 transition-all ${filtro.periodo === p ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
                {p}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-8 rounded-[2rem] border border-gray-100 mb-8">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">Tendencia de Carga</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
                <Tooltip />
                <Area type="monotone" dataKey="carga" stroke="#000" strokeWidth={4} fill="#f3f4f6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Auditoria Completa de Series</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400">
                <tr><th className="p-6">Data</th><th className="p-6">Carga</th><th className="p-6">Reps</th><th className="p-6">Serie #</th></tr>
              </thead>
              <tbody className="text-sm font-bold">
                {dadosFiltrados.map((d, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="p-6">{format(parseISO(d.data_execucao), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="p-6">{d.carga} kg</td>
                    <td className="p-6">{d.repeticoes} reps</td>
                    <td className="p-6">Série {d.serie_index + 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}