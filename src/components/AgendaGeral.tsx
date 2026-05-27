'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AgendaGeral() {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgenda = async () => {
      const hoje = new Date().toISOString(); 
      const { data } = await supabase
        .from('agendamentos')
        .select('*, alunos(nome)')
        .gte('data_hora', hoje)
        .order('data_hora', { ascending: true });
        
      setAgendamentos(data || []);
      setLoading(false);
    };
    fetchAgenda();
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">Carregando agenda...</div>;

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Próximos Agendamentos</h2>
      
      {agendamentos.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum agendamento para hoje.</p>
      ) : (
        <div className="space-y-3">
          {agendamentos.map((ag) => {
            const dataAula = new Date(ag.data_hora);
            const hoje = new Date();
            const isHoje = dataAula.toDateString() === hoje.toDateString();

            return (
              <div 
                key={ag.id} 
                className={`p-4 rounded-2xl flex justify-between items-center border transition-all ${
                  isHoje 
                    ? 'bg-blue-50 border-blue-100' 
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${isHoje ? 'text-blue-900' : 'text-gray-900'}`}>
                    {ag.alunos?.nome}
                  </span>
                  {isHoje && (
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-lg uppercase font-black tracking-wider">
                      Hoje
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-gray-500">
                  {dataAula.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}