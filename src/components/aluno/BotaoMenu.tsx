export default function BotaoMenu({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="bg-neutral-950/80 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 transition-all active:scale-95">
      <div className="text-lg text-white">{icon}</div>
      <span className="font-black text-[10px] uppercase tracking-widest text-neutral-500">{label}</span>
    </button>
  );
}