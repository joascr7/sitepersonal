'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';
import { FaCalendarCheck, FaDumbbell, FaMedal } from 'react-icons/fa';

export default function DashboardPerformance({ alunoId }: { alunoId: string }) {
  const [dados, setDados] = useState<any>({ frequencia: [], prs: [], totalTreinos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!alunoId) { setLoading(false); return; }

    async function carregarDados() {
      setLoading(true);
      try {
        const { data: treinos, error: treinosError } = await supabase
          .from('conclusoes_treino')
          .select('id')
          .eq('aluno_id', alunoId.trim());

        const { data: registros, error: regError } = await supabase
          .from('registro_series')
          .select('exercicio_nome, carga')
          .eq('aluno_id', alunoId.trim());

        if (treinosError || regError) throw new Error("Erro ao buscar dados");

        const prMap = (registros || []).reduce((acc: any, curr) => {
          const carga = Number(curr.carga) || 0;
          if (!acc[curr.exercicio_nome] || carga > acc[curr.exercicio_nome]) acc[curr.exercicio_nome] = carga;
          return acc;
        }, {});

        setDados({
          frequencia: (registros || []).reduce((acc: any, curr) => {
            acc[curr.exercicio_nome] = (acc[curr.exercicio_nome] || 0) + 1;
            return acc;
          }, {}),
          prs: Object.entries(prMap)
            .map(([name, val]) => ({ name, val }))
            .sort((a: any, b: any) => b.val - a.val)
            .slice(0, 4),
          totalTreinos: treinos ? treinos.length : 0
        });
      } catch (err) { 
        console.error("Erro no Dashboard:", err); 
      } finally { 
        setLoading(false); 
      }
    }
    carregarDados();
  }, [alunoId]);

  if (loading) return <div className="text-center py-20 text-blue-500 font-black uppercase tracking-widest text-xs">Analisando sua performance...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 bg-black">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Treinos Realizados" value={dados.totalTreinos.toString()} unit="sessões" icon={<FaCalendarCheck className="text-blue-500" />} />
        <MetricCard title="Variedade" value={Object.keys(dados.frequencia).length.toString()} unit="exercícios" icon={<FaDumbbell className="text-blue-500" />} />
        <MetricCard title="Recordes Batidos" value={dados.prs.length.toString()} unit="vitórias" icon={<FaMedal className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Frequência */}
        <div className="lg:col-span-2 bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-8">Exercícios que você mais faz</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(dados.frequencia).map(([name, val]) => ({ name, val })).sort((a:any, b:any) => b.val - a.val).slice(0, 5)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#737373' }} interval={0} angle={-45} textAnchor="end" height={60} tickFormatter={(v) => v.length > 8 ? `${v.substring(0, 7)}...` : v} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#525252' }} />
                <Tooltip cursor={{ fill: '#171717', radius: 12 }} content={({ active, payload }) => active && payload ? <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{payload[0].value} séries</div> : null} />
                <Bar dataKey="val" radius={[6, 6, 6, 6]} barSize={40}>
                  {Object.entries(dados.frequencia).map((_: any, i: number) => <Cell key={i} fill={i === 0 ? '#2563eb' : '#262626'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Melhores Marcas */}
        <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-8">Suas Melhores Marcas</h2>
          <div className="space-y-6">
            {dados.prs.length > 0 ? dados.prs.map((pr: any, i: number) => (
              <div key={i} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <span className="text-sm font-semibold text-neutral-300">{pr.name}</span>
                <span className="text-sm font-black text-white">{pr.val}kg</span>
              </div>
            )) : <p className="text-xs text-neutral-600 font-bold uppercase tracking-widest">Continue treinando para registrar seu primeiro recorde.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, icon }: any) {
  return (
    <div className="bg-neutral-950/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-4 shadow-xl">
      <div className="p-3 bg-white/5 rounded-2xl">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{title}</p>
        <p className="text-lg font-black text-white">{value} <span className="text-[10px] text-neutral-400 font-medium">{unit}</span></p>
      </div>
    </div>
  );
}