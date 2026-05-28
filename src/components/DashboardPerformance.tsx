'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FaChartPie, FaBolt } from 'react-icons/fa';

export default function DashboardPerformance({ alunoId }: { alunoId: string }) {
  const [dados, setDados] = useState<any>({ frequencia: [], prs: [], totalVolume: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!alunoId) {
      setLoading(false);
      return;
    }

    async function carregarDados() {
      setLoading(true);
      try {
        // Buscamos o histórico de execução do aluno
        const { data, error } = await supabase
          .from('registro_series')
          .select('exercicio_nome, carga, repeticoes')
          .eq('aluno_id', alunoId.trim());

        if (error) throw error;

        if (data && data.length > 0) {
          // Mapeamento de Frequência
          const freqMap = data.reduce((acc: any, curr) => {
            const nome = curr.exercicio_nome || "Sem nome";
            acc[nome] = (acc[nome] || 0) + 1;
            return acc;
          }, {});

          // Mapeamento de Recordes (PRs) - Garantindo conversão para número
          const prMap = data.reduce((acc: any, curr) => {
            const nome = curr.exercicio_nome || "Sem nome";
            const carga = Number(curr.carga) || 0;
            if (!acc[nome] || carga > acc[nome]) acc[nome] = carga;
            return acc;
          }, {});

          // Cálculo de Volume Total
          const volumeTotal = data.reduce((acc, curr) => {
            const carga = Number(curr.carga) || 0;
            const reps = Number(curr.repeticoes) || 0;
            return acc + (carga * reps);
          }, 0);

          setDados({
            frequencia: Object.entries(freqMap)
              .map(([name, val]) => ({ name, val: Number(val) }))
              .sort((a, b) => b.val - a.val)
              .slice(0, 5),
            prs: Object.entries(prMap)
              .map(([name, val]) => ({ name, val: Number(val) }))
              .sort((a, b) => b.val - a.val)
              .slice(0, 4),
            totalVolume: volumeTotal
          });
        }
      } catch (err) {
        console.error("Erro no Dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [alunoId]);

  if (loading) return <div className="text-center py-10 text-gray-400">Carregando performance...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard title="Vol. Total" value={`${(dados.totalVolume / 1000).toFixed(1)}k kg`} icon={<FaBolt className="text-amber-500" />} />
        <MetricCard title="Exercícios" value={dados.frequencia.length} icon={<FaChartPie className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Frequência */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-[10px] font-black text-gray-400 uppercase mb-6">Foco do Treino</h2>
          {dados.frequencia.length > 0 ? (
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados.frequencia} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#6b7280' }} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} content={({ active, payload }) => active && payload ? (
                    <div className="bg-black text-white px-3 py-1 rounded-lg shadow-xl text-[10px] font-black uppercase">
                      {payload[0].payload.name}: {payload[0].value} treinos
                    </div>
                  ) : null} />
                  <Bar dataKey="val" radius={[6, 6, 6, 6]} barSize={32}>
                    {dados.frequencia.map((_: any, index: number) => (
                      <Cell key={index} fill={index === 0 ? '#000000' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-xs text-gray-400 text-center py-10">Nenhum treino registrado ainda.</p>}
        </div>
        
        {/* Recordes Pessoais */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-[10px] font-black text-gray-400 uppercase mb-6">Recordes (PRs)</h2>
          {dados.prs.length > 0 ? dados.prs.map((pr: any, i: number) => (
            <div key={i} className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
              <span className="text-xs font-bold text-gray-700">{pr.name}</span>
              <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold">{pr.val} kg</span>
            </div>
          )) : <p className="text-xs text-gray-400">Nenhum recorde registrado.</p>}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string, value: string, icon: any }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-24">
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
      <p className="text-lg font-black tracking-tight">{value}</p>
    </div>
  );
}