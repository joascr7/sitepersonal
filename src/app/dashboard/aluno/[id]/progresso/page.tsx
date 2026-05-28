'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { subMonths, startOfWeek, parseISO } from 'date-fns';

export default function ProgressoPersonal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [historico, setHistorico] = useState<any[]>([]);
  const [exerciciosUnicos, setExerciciosUnicos] = useState<string[]>([]);
  const [filtro, setFiltro] = useState({ exercicio: '', periodo: 'mes' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('registro_series')
        .select('*')
        .eq('aluno_id', id)
        .order('data_execucao', { ascending: true });

      if (data && data.length > 0) {
        setHistorico(data);
        const unicos = Array.from(new Set(data.map((h: any) => h.exercicio_nome)));
        setExerciciosUnicos(unicos as string[]);
        setFiltro(prev => ({ ...prev, exercicio: unicos[0] as string }));
      } else {
        console.error("Erro ou dados vazios:", error);
      }
      setLoading(false);
    };
    if (id) carregarDados();
  }, [id]);

  // Filtro seguro: garante que não tentamos filtrar se exercicio for vazio
  const dadosFiltrados = historico.filter(h => {
  const matchExercicio = h.exercicio_nome === filtro.exercicio;
  
  // Converte a data do banco para um objeto Date real e ignora o problema do fuso
  const dataExec = new Date(h.data_execucao);
  
  // Usa o dia de hoje como base, garantindo que o tempo não interfira
  const hoje = new Date();
  const limite = filtro.periodo === 'semana' 
    ? startOfWeek(hoje, { weekStartsOn: 0 }) 
    : subMonths(hoje, 1);

  return matchExercicio && dataExec >= limite;
});

  if (loading) return <main className="p-10 text-center text-gray-400">Analisando dados...</main>;

  return (
    <main className="max-w-4xl mx-auto p-6 md:p-12">
      <h1 className="text-2xl font-black mb-8">Relatório de Evolução</h1>

      {/* Controles de Filtro */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <select 
          className="bg-white p-4 rounded-2xl border border-gray-100 font-bold text-sm shadow-sm"
          value={filtro.exercicio}
          onChange={(e) => setFiltro({...filtro, exercicio: e.target.value})}
        >
          {exerciciosUnicos.length > 0 ? (
            exerciciosUnicos.map(ex => <option key={ex} value={ex}>{ex}</option>)
          ) : (
            <option>Sem exercícios</option>
          )}
        </select>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {['semana', 'mes'].map(p => (
            <button 
              key={p}
              onClick={() => setFiltro({...filtro, periodo: p})}
              className={`flex-1 rounded-xl text-xs font-black uppercase transition-all ${filtro.periodo === p ? 'bg-white shadow-sm' : ''}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico ou Aviso */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[300px] flex flex-col">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Tendência de Carga</h2>
        
        {dadosFiltrados.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosFiltrados}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f9fafb" />
                <XAxis dataKey="data_execucao" tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})} fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Line type="monotone" dataKey="carga" stroke="#000" strokeWidth={3} dot={{r: 4, fill: '#000'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-sm font-bold text-gray-400">Nenhum dado encontrado para este período.</p>
          </div>
        )}
      </div>
    </main>
  );
}