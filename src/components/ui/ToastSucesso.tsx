import { FaCheckCircle } from 'react-icons/fa';

export default function ToastSucesso({ mensagem, onClose }: { mensagem: string, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      {/* Container Glassmorphism Premium */}
      <div className="bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6 transform animate-in zoom-in-95 duration-300">
        
        {/* Ícone com brilho sutil */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-600/20 blur-xl rounded-full" />
          <FaCheckCircle className="text-blue-500 text-6xl relative z-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tighter">Treino Concluído!</h2>
          <p className="text-neutral-400 font-medium text-xs uppercase tracking-widest">{mensagem}</p>
        </div>

        <button 
          onClick={onClose} 
          className="w-full bg-blue-600 text-white py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-500 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
        >
          Fechar e Voltar
        </button>
      </div>
    </div>
  );
}