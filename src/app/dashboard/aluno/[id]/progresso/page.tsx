'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, subMonths, startOfWeek } from 'date-fns';
import { FaFilePdf, FaArrowLeft, FaChartLine, FaHistory } from 'react-icons/fa';
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
      // Busca paralela para máxima performance
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

  // Filtro inteligente: garante que pegamos dados mesmo se o nome tiver variações de case ou espaços
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

  if (loading) return <div className="flex h-screen items-center justify-center font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Carregando interface...</div>;

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-20">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest hover:text-emerald-600 transition-colors"><FaArrowLeft /> Voltar</button>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Dashboard de Performance</span>
        <button onClick={exportarPDF} className="bg-zinc-900 text-white px-5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all">PDF</button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* PERFIL */}
        <header className="flex items-center justify-between bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-5">
            <img src={aluno?.avatar_url || '/placeholder.png'} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-gray-100"/>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{aluno?.nome}</h1>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">{aluno?.objetivo || 'Sem objetivo'}</p>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase ${aluno?.status_pagamento === 'ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
             {aluno?.status_pagamento}
          </span>
        </header>

       <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {/* Cards de Métricas (Empilhados no mobile, lado a lado no desktop) */}
  <div className="grid grid-cols-2 gap-4 md:col-span-2">
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <p className="text-[9px] uppercase font-bold text-gray-400 mb-2">Carga Máxima (PR)</p>
      <p className="text-2xl font-bold">{cargaMaxima}<span className="text-xs text-gray-400 ml-1">kg</span></p>
    </div>
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <p className="text-[9px] uppercase font-bold text-gray-400 mb-2">Séries Totais</p>
      <p className="text-2xl font-bold">{historico.length}</p>
    </div>
  </div>

  {/* Análise de Exercício (Ocupa a linha toda no mobile) */}
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm md:col-span-2 flex flex-col md:flex-row items-center gap-4">
    <div className="flex-1 w-full">
      <label className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Análise de Exercício</label>
      <select 
        className="w-full font-bold text-lg outline-none bg-transparent truncate" 
        value={filtro.exercicio} 
        onChange={(e) => setFiltro({...filtro, exercicio: e.target.value})}
      >
        {Array.from(new Set(historico.map(h => h.exercicio_nome))).map(ex => 
          <option key={ex as string} value={ex as string}>{ex as string}</option>
        )}
      </select>
    </div>
    
    <div className="flex bg-gray-50 p-1 rounded-xl w-full md:w-auto">
      {['semana', 'mes'].map(p => (
        <button 
          key={p} 
          onClick={() => setFiltro({...filtro, periodo: p})} 
          className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${filtro.periodo === p ? 'bg-white shadow-sm' : 'text-gray-400'}`}
        >
          {p}
        </button>
      ))}
    </div>
  </div>
</section>

        {/* GRÁFICO */}
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="flex items-center gap-2 text-[9px] uppercase font-bold text-gray-400 mb-6 tracking-widest"><FaChartLine /> Evolução de Carga (kg)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosFiltrados.slice(0, 15).reverse()}>
                <defs>
                  <linearGradient id="colorCarga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f9fafb" />
                <XAxis dataKey="data_execucao" tickFormatter={(v) => format(parseISO(v), 'dd/MM')} tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="carga" stroke="#10b981" strokeWidth={3} fill="url(#colorCarga)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </main>
  );
}