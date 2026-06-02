import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SemanaTreinos({ diasTreino, intervalo }: { diasTreino: Date[], intervalo: Date[] }) {
  return (
    <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5">
      <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-6">Sua semana</h2>
      <div className="flex justify-between items-center">
        {intervalo.map((dia, i) => {
          const treinou = diasTreino.some(d => isSameDay(d, dia));
          const hoje = isSameDay(dia, new Date());
          const falha = dia < new Date() && !treinou && !hoje;
          return (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${treinou ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : falha ? 'bg-red-500/10 text-red-500' : hoje ? 'border border-white text-white' : 'bg-white/5 text-neutral-600'}`}>
                {treinou ? '✓' : falha ? '✕' : hoje ? '●' : ''}
              </div>
              <span className="text-[9px] font-bold text-neutral-500 uppercase">{format(dia, 'EEEEE', { locale: ptBR })}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}