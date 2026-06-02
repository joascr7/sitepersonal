export default function StatusCard({ aluno }: { aluno: any }) {
  return (
    <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 flex flex-col items-center gap-6 shadow-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${aluno.status_pagamento === 'bloqueado' ? 'bg-red-500' : 'bg-blue-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
            {aluno.status_pagamento === 'bloqueado' ? 'Restrito' : 'Assinatura Ativa'}
          </span>
        </div>
        <p className="text-xl font-black text-white">{aluno.status_pagamento === 'bloqueado' ? 'Conta Bloqueada' : 'Plano Premium'}</p>
      </div>
      <div className="w-full h-px bg-white/5" />
      <div className="w-full flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-neutral-500">
        <span>Vencimento</span>
        <span className="text-white">{aluno.data_vencimento ? new Date(aluno.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}</span>
      </div>
    </div>
  );
}