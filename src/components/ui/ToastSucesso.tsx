import { FaCheckCircle } from 'react-icons/fa';

export default function ToastSucesso({ mensagem, onClose }: { mensagem: string, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-4">
        <FaCheckCircle className="text-emerald-500 text-5xl mx-auto" />
        <h2 className="text-xl font-black text-gray-900">Treino Concluído!</h2>
        <p className="text-gray-500 font-medium text-sm">{mensagem}</p>
        <button 
          onClick={onClose} 
          className="w-full bg-black text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all"
        >
          Fechar e Voltar
        </button>
      </div>
    </div>
  );
}