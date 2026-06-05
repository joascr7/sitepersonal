import { FaTimes, FaShieldAlt } from 'react-icons/fa';

interface TermosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermosModal({ isOpen, onClose }: TermosModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-5 animate-in fade-in duration-300">
      <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] max-w-2xl w-full max-h-[85vh] border border-[var(--border)] shadow-2xl animate-in zoom-in-95 flex flex-col">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4 shrink-0">
          <div className="flex items-center gap-3 text-[var(--primary)]">
            <FaShieldAlt size={24} />
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tighter">
              Termos de Uso
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors p-2 bg-[var(--surface-sec)] rounded-full active:scale-95"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Conteúdo do Termo (Rolável) */}
        <div className="overflow-y-auto pr-2 space-y-6 text-sm sm:text-base text-[var(--text-secondary)] custom-scrollbar font-medium leading-relaxed flex-grow">
          
          <p>
            Bem-vindo ao <strong>AuraFit</strong>. Ao se cadastrar e utilizar nossa plataforma, você concorda expressamente com os termos e condições descritos abaixo.
          </p>

          <div>
            <h3 className="font-black text-[var(--text-primary)] mb-2 uppercase tracking-widest text-[10px] sm:text-xs">1. Isenção de Responsabilidade</h3>
            <p>
              O AuraFit é exclusivamente uma ferramenta tecnológica (software) de organização e gestão de treinos. <strong>O criador, proprietário e os desenvolvedores deste aplicativo não assumem qualquer responsabilidade</strong> por lesões físicas, danos à saúde, problemas médicos ou quaisquer resultados decorrentes da execução dos exercícios e treinos registrados na plataforma.
            </p>
          </div>

          <div>
            <h3 className="font-black text-[var(--text-primary)] mb-2 uppercase tracking-widest text-[10px] sm:text-xs">2. Responsabilidade do Profissional (Personal Trainer)</h3>
            <p>
              Ao utilizar esta plataforma como treinador, você declara ser o único e exclusivo responsável pela prescrição, adequação da carga e segurança dos treinos enviados aos seus alunos. O aplicativo atua apenas como um meio de comunicação e gestão, não validando, atestando ou revisando a competência técnica dos treinos elaborados.
            </p>
          </div>

          <div>
            <h3 className="font-black text-[var(--text-primary)] mb-2 uppercase tracking-widest text-[10px] sm:text-xs">3. Disponibilidade do Sistema</h3>
            <p>
              O sistema é fornecido "no estado em que se encontra". O desenvolvedor não se responsabiliza por eventuais falhas técnicas, perda temporária de dados, indisponibilidade de servidores ou interrupções no serviço causadas por terceiros.
            </p>
          </div>

          <div>
            <h3 className="font-black text-[var(--text-primary)] mb-2 uppercase tracking-widest text-[10px] sm:text-xs">4. Aceite e Vínculo Legal</h3>
            <p>
              O uso continuado da plataforma configura o aceite incondicional destes termos. Caso não concorde com qualquer disposição aqui descrita, pedimos que não prossiga com o cadastro ou utilização do aplicativo.
            </p>
          </div>

        </div>

        {/* Botão de Fechar */}
        <div className="mt-6 pt-4 border-t border-[var(--border)] shrink-0">
          <button 
            onClick={onClose} 
            className="w-full py-4 bg-[var(--primary)] text-white rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-[var(--primary)]/20"
          >
            Li e Entendi
          </button>
        </div>

      </div>
    </div>
  );
}