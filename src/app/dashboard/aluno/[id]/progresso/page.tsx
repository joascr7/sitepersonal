'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { subMonths, startOfWeek } from 'date-fns';

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
        .order('data_execucao', { ascending: true });

      if (data && data.length > 0) {
        setHistorico(data);
        const unicos = Array.from(new Set(data.map((h: any) => h.exercicio_nome)));
        setExerciciosUnicos(unicos as string[]);
        setFiltro(prev => ({ ...prev, exercicio: unicos[0] as string }));
      }
      setLoading(false);
    };
    if (id) carregarDados();
  }, [id]);

  const dadosFiltrados = historico.filter(h => {
    const matchExercicio = h.exercicio_nome === filtro.exercicio;
    const dataExec = new Date(h.data_execucao);
    const limite = filtro.periodo === 'semana' ? startOfWeek(new Date(), { weekStartsOn: 0 }) : subMonths(new Date(), 1);
    return matchExercicio && dataExec >= limite;
  });

  const cargaMaxima = dadosFiltrados.length > 0 ? Math.max(...dadosFiltrados.map(d => d.carga)) : 0;

  if (loading) return <main className="flex min-h-screen items-center justify-center text-gray-400 font-bold">Analisando dados...</main>;

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Relatório de Evolução</h1>
          <p className="text-gray-500 font-medium">Acompanhe a curva de carga do seu aluno.</p>
        </header>

        {/* Painel de Controle */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2 block">Exercício</label>
            <select className="w-full bg-transparent font-bold text-sm outline-none" value={filtro.exercicio} onChange={(e) => setFiltro({...filtro, exercicio: e.target.value})}>
              {exerciciosUnicos.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>
          
          <div className="flex bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            {['semana', 'mes'].map(p => (
              <button key={p} onClick={() => setFiltro({...filtro, periodo: p})}
                className={`flex-1 rounded-xl text-xs font-black uppercase tracking-widest py-3 transition-all ${filtro.periodo === p ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}>
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* Dashboard de Performance */}
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-end mb-10">
             <div>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Carga Máxima</h2>
                <p className="text-3xl font-black">{cargaMaxima} <span className="text-sm text-gray-400">kg</span></p>
             </div>
          </div>
          
          {dadosFiltrados.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosFiltrados}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="data_execucao" hide />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="carga" stroke="#000" strokeWidth={4} dot={{r: 6, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-sm font-bold text-gray-400">Dados insuficientes para o período.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}