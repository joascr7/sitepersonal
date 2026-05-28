'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FaChartPie, FaBolt } from 'react-icons/fa';

export default function DashboardPerformance({ alunoId }: { alunoId: string }) {
  const [dados, setDados] = useState<any>({ frequencia: [], prs: [], totalVolume: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!alunoId) { setLoading(false); return; }

    async function carregarDados() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('registro_series')
          .select('exercicio_nome, carga, repeticoes')
          .eq('aluno_id', alunoId.trim());

        if (error) throw error;

        if (data && data.length > 0) {
          const freqMap = data.reduce((acc: any, curr) => {
            const nome = curr.exercicio_nome || "Sem nome";
            acc[nome] = (acc[nome] || 0) + 1;
            return acc;
          }, {});

          const prMap = data.reduce((acc: any, curr) => {
            const nome = curr.exercicio_nome || "Sem nome";
            const carga = Number(curr.carga) || 0;
            if (!acc[nome] || carga > acc[nome]) acc[nome] = carga;
            return acc;
          }, {});

          const volumeTotal = data.reduce((acc, curr) => acc + (Number(curr.carga) || 0) * (Number(curr.repeticoes) || 0), 0);

          setDados({
            frequencia: Object.entries(freqMap).map(([name, val]) => ({ name, val: Number(val) })).sort((a, b) => b.val - a.val).slice(0, 5),
            prs: Object.entries(prMap).map(([name, val]) => ({ name, val: Number(val) })).sort((a, b) => b.val - a.val).slice(0, 4),
            totalVolume: volumeTotal
          });
        }
      } catch (err) { console.error("Erro no Dashboard:", err); } 
      finally { setLoading(false); }
    }
    carregarDados();
  }, [alunoId]);

  if (loading) return <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">Analisando performance...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-6">
        <MetricCard title="Volume Total" value={`${(dados.totalVolume / 1000).toFixed(1)}k kg`} icon={<FaBolt className="text-gray-900" />} />
        <MetricCard title="Exercícios" value={dados.frequencia.length.toString()} icon={<FaChartPie className="text-gray-900" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Frequência */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Foco do Treino</h2>
          {dados.frequencia.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados.frequencia} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#9ca3af' }} />
                  <Tooltip cursor={{ fill: '#f9fafb', radius: 12 }} content={({ active, payload }) => active && payload ? (
                    <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-xl text-[10px] font-black uppercase tracking-widest">
                      {payload[0].value} execuções
                    </div>
                  ) : null} />
                  <Bar dataKey="val" radius={[8, 8, 8, 8]} barSize={32}>
                    {dados.frequencia.map((_: any, index: number) => (
                      <Cell key={index} fill={index === 0 ? '#111827' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-xs text-gray-400 text-center py-10">Nenhum treino registrado.</p>}
        </div>
        
        {/* Recordes Pessoais */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Recordes Pessoais (PRs)</h2>
          {dados.prs.length > 0 ? dados.prs.map((pr: any, i: number) => (
            <div key={i} className="flex justify-between items-center mb-5 group">
              <span className="text-sm font-bold text-gray-900">{pr.name}</span>
              <span className="bg-gray-50 text-gray-900 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest group-hover:bg-gray-900 group-hover:text-white transition-all">
                {pr.val} kg
              </span>
            </div>
          )) : <p className="text-xs text-gray-400">Nenhum recorde registrado.</p>}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string, value: string, icon: any }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
      <div className="absolute top-4 right-4 opacity-10 text-2xl">{icon}</div>
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</span>
      <p className="text-2xl font-black tracking-tighter text-gray-900">{value}</p>
    </div>
  );
}