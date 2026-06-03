'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

  if (loading) return <div className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Carregando agenda...</div>;

  return (
    <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
      <h2 className="text-xl font-black text-white mb-6 tracking-tight">Próximos Agendamentos</h2>
      
      {agendamentos.length === 0 ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Nenhum agendamento para hoje.</p>
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
                    ? 'bg-blue-600/10 border-blue-600/20' 
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-black ${isHoje ? 'text-white' : 'text-neutral-300'}`}>
                    {ag.alunos?.nome}
                  </span>
                  {isHoje && (
                    <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-lg uppercase font-black tracking-wider">
                      Hoje
                    </span>
                  )}
                </div>
                <span className="text-sm font-black text-neutral-500">
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