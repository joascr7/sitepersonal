'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, subMonths, startOfWeek } from 'date-fns';
import { FaArrowLeft, FaChartLine } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProgressoPersonalCompleto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [aluno, setAluno] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ exercicio: '', periodo: 'mes' });

  useEffect(() => {
    async function carregarTudo() {
      setLoading(true);
      const [alunoRes, seriesRes] = await Promise.all([
        supabase.from('alunos').select('*').eq('id', id).single(),
        supabase.from('registro_series')
          .select('*')
          .eq('aluno_id', id)
          .order('data_execucao', { ascending: false })
      ]);

      if (alunoRes.data) setAluno(alunoRes.data);
      if (seriesRes.data) {
        setHistorico(seriesRes.data);
        const unicos = Array.from(new Set(seriesRes.data.map((h: any) => h.exercicio_nome)));
        if (unicos.length > 0) {
          setFiltro(prev => ({ ...prev, exercicio: prev.exercicio || (unicos[0] as string) }));
        }
      }
      setLoading(false);
    }
    carregarTudo();
  }, [id]);

  const dadosFiltrados = useMemo(() => {
    const limite = filtro.periodo === 'semana' ? startOfWeek(new Date()) : subMonths(new Date(), 1);
    return historico.filter(h => 
      h.exercicio_nome?.trim().toLowerCase() === filtro.exercicio?.trim().toLowerCase() && 
      new Date(h.data_execucao) >= limite
    );
  }, [historico, filtro]);

  const cargaMaxima = useMemo(() => {
    const cargas = dadosFiltrados.map(d => Number(d.carga)).filter(c => !isNaN(c));
    return cargas.length > 0 ? Math.max(...cargas) : 0;
  }, [dadosFiltrados]);

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Performance: ${aluno?.nome || 'Aluno'}`, 14, 15);
    autoTable(doc, { 
      startY: 25, 
      head: [['Data', 'Exercicio', 'Carga', 'Reps']], 
      body: historico.map(h => [format(parseISO(h.data_execucao), 'dd/MM/yyyy'), h.exercicio_nome, `${h.carga}kg`, h.repeticoes]) 
    });
    doc.save(`Performance_${aluno?.nome || 'aluno'}.pdf`);
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
    <main className="min-h-screen bg-black pb-20 text-white">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 px-8 py-5 flex justify-between items-center">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
          <FaArrowLeft /> Voltar
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">Dashboard de Performance</span>
        <button onClick={exportarPDF} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all">Exportar PDF</button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* PERFIL */}
        <header className="flex items-center justify-between bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-6">
            <img src={aluno?.avatar_url || '/placeholder.png'} className="w-16 h-16 rounded-full object-cover border border-white/10"/>
            <div>
              <h1 className="text-xl font-black tracking-tighter">{aluno?.nome}</h1>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{aluno?.objetivo || 'Sem objetivo'}</p>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${aluno?.status_pagamento === 'ativo' ? 'bg-blue-600/10 text-blue-400' : 'bg-red-600/10 text-red-400'}`}>
             {aluno?.status_pagamento}
          </span>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="grid grid-cols-2 gap-6 md:col-span-2">
            <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
              <p className="text-[9px] uppercase font-black text-neutral-500 mb-2 tracking-widest">Carga Máxima (PR)</p>
              <p className="text-2xl font-black">{cargaMaxima}<span className="text-xs text-neutral-500 ml-1">kg</span></p>
            </div>
            <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
              <p className="text-[9px] uppercase font-black text-neutral-500 mb-2 tracking-widest">Séries Totais</p>
              <p className="text-2xl font-black">{historico.length}</p>
            </div>
          </div>

          <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-xl md:col-span-2 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full">
              <label className="text-[9px] uppercase font-black text-neutral-500 block mb-2 tracking-widest">Análise de Exercício</label>
              <select 
                className="w-full font-black text-lg outline-none bg-transparent truncate" 
                value={filtro.exercicio} 
                onChange={(e) => setFiltro({...filtro, exercicio: e.target.value})}
              >
                {Array.from(new Set(historico.map(h => h.exercicio_nome))).map(ex => 
                  <option key={ex as string} value={ex as string} className="bg-neutral-900">{ex as string}</option>
                )}
              </select>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-2xl w-full md:w-auto">
              {['semana', 'mes'].map(p => (
                <button 
                  key={p} 
                  onClick={() => setFiltro({...filtro, periodo: p})} 
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filtro.periodo === p ? 'bg-blue-600 text-white' : 'text-neutral-500'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* GRÁFICO */}
        <section className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
          <h2 className="flex items-center gap-2 text-[9px] uppercase font-black text-neutral-500 mb-8 tracking-widest"><FaChartLine /> Evolução de Carga (kg)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosFiltrados.slice(0, 15).reverse()}>
                <defs>
                  <linearGradient id="colorCarga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="data_execucao" tickFormatter={(v) => format(parseISO(v), 'dd/MM')} tick={{fontSize: 9, fill: '#666'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 9, fill: '#666'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                <Area type="monotone" dataKey="carga" stroke="#2563eb" strokeWidth={3} fill="url(#colorCarga)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </main>
  );
}