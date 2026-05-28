'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FaTrophy, FaFire, FaChartPie, FaBolt } from 'react-icons/fa';

export default function DashboardPerformance({ alunoId }: { alunoId: string }) {
  const [dados, setDados] = useState<any>({ frequencia: [], prs: [], totalVolume: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('registro_series')
        .select('exercicio_nome, carga, repeticoes')
        .eq('aluno_id', alunoId);

      if (data) {
        const freqMap = data.reduce((acc: any, curr) => {
          acc[curr.exercicio_nome] = (acc[curr.exercicio_nome] || 0) + 1;
          return acc;
        }, {});
        
        const prMap = data.reduce((acc: any, curr) => {
          if (!acc[curr.exercicio_nome] || curr.carga > acc[curr.exercicio_nome]) {
            acc[curr.exercicio_nome] = curr.carga;
          }
          return acc;
        }, {});

        const volumeTotal = data.reduce((acc, curr) => acc + (curr.carga * curr.repeticoes), 0);

        setDados({
          frequencia: Object.entries(freqMap).map(([name, val]) => ({ name, val: Number(val) })).sort((a, b) => b.val - a.val).slice(0, 5),
          prs: Object.entries(prMap).map(([name, val]) => ({ name, val: Number(val) })).slice(0, 4),
          totalVolume: volumeTotal
        });
      }
    };
    fetchData();
  }, [alunoId]);

  return (
    // O w-full e o max-w garantem que não fique esticado demais na web
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      
      {/* Cards de Métricas - Grid perfeito */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard title="Vol. Total" value={`${(dados.totalVolume / 1000).toFixed(1)}k kg`} icon={<FaBolt className="text-amber-500" />} />
        <MetricCard title="Exercícios" value={dados.frequencia.length} icon={<FaChartPie className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico Estilizado */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <FaFire className="text-rose-500" />
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Foco do Treino</h2>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados.frequencia}>
                <XAxis dataKey="name" fontSize={8} axisLine={false} tickLine={false} interval={0} />
                <Tooltip cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {dados.frequencia.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#111827' : '#e5e7eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PRs Premium */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <FaTrophy className="text-amber-500" />
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recordes Pessoais</h2>
          </div>
          <div className="space-y-4">
            {dados.prs.length > 0 ? dados.prs.map((pr: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700 truncate mr-2">{pr.name}</span>
                <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap">{pr.val} kg</span>
              </div>
            )) : <p className="text-xs text-gray-400">Nenhum recorde ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-24">
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
      <div className="flex justify-between items-center">
        <p className="text-lg font-black truncate">{value}</p>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  );
}