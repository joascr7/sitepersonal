import { FaLink } from 'react-icons/fa';

interface RegistrationLinkProps {
  userId: string;
  t: any;
  showStatus: (type: 'success' | 'error' | 'info', text: string) => void;
}

export default function RegistrationLink({ userId, t, showStatus }: RegistrationLinkProps) {
  const copiarLinkCadastro = () => {
    if (!userId) return;
    const link = `${window.location.origin}/cadastro/${userId}`;
    navigator.clipboard.writeText(link).then(() => {
      showStatus('success', 'Link copiado com sucesso!');
    }).catch(() => {
      showStatus('error', 'Erro ao copiar o link.');
    });
  };

  return (
    <button 
      onClick={copiarLinkCadastro} 
      className="bg-[#3B82F6] w-full text-white p-5 rounded-xl flex flex-col gap-3 shadow-md hover:brightness-110 active:scale-95 transition-all"
    >
      <FaLink size={22} />
      <span className="font-bold text-sm text-left">{t.registrationLink}</span>
    </button>
  );
}