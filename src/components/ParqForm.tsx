'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { FaCheck, FaTimes, FaEraser, FaExclamationTriangle } from 'react-icons/fa';

const translations = {
  'pt-BR': {
    title: 'Questionário de Saúde (PAR-Q)',
    subtitle: 'Preenchimento obrigatório para liberação dos treinos',
    questions: [
      'Algum médico já disse que você possui algum problema de coração e recomendou que fizesse apenas atividades físicas supervisionadas?',
      'Você sente dor no peito causada pela prática de atividade física?',
      'Você sentiu dor no peito no último mês?',
      'Você tende a perder a consciência ou cair em virtude de tontura?',
      'Você tem algum problema ósseo ou articular que poderia piorar com a atividade física?',
      'Algum médico já lhe receitou medicamento para pressão arterial ou para o coração?',
      'Você passou por alguma cirurgia ou lesão grave recentemente?',
      'Você sabe de alguma outra razão pela qual não deva praticar atividade física?'
    ],
    yes: 'Sim', no: 'Não',
    obsPlaceholder: 'Por favor, detalhe sua resposta aqui...',
    disclaimer: 'Declaro que li, compreendi e respondi as perguntas acima com total sinceridade. Assumo total responsabilidade pela veracidade das informações e reconheço que a avaliação final sobre o início dos treinos cabe ao meu Personal Trainer.',
    signHere: 'Assine com o dedo no quadro abaixo:',
    clearBtn: 'Limpar',
    submitBtn: 'Enviar e Liberar Treinos',
    errFillAll: 'Por favor, responda todas as perguntas.',
    errSign: 'Por favor, forneça sua assinatura.',
    loading: 'Enviando...'
  },
  'pt-PT': {
    title: 'Questionário de Saúde (PAR-Q)',
    subtitle: 'Preenchimento obrigatório para libertação dos treinos',
    questions: [
      'Algum médico já lhe disse que tem algum problema cardíaco e recomendou atividade física supervisionada?',
      'Sente dor no peito causada pela prática de atividade física?',
      'Sentiu dor no peito no último mês?',
      'Tende a perder a consciência ou cair devido a tonturas?',
      'Tem algum problema ósseo ou articular que poderia piorar com a atividade física?',
      'Algum médico já lhe receitou medicamentos para a tensão arterial ou coração?',
      'Passou por alguma cirurgia ou lesão grave recentemente?',
      'Tem conhecimento de alguma outra razão pela qual não deva praticar atividade física?'
    ],
    yes: 'Sim', no: 'Não',
    obsPlaceholder: 'Por favor, detalhe a sua resposta aqui...',
    disclaimer: 'Declaro que li, compreendi e respondi às perguntas com total sinceridade. Assumo total responsabilidade pela veracidade das informações. O Personal Trainer avaliará o início dos treinos.',
    signHere: 'Assine com o dedo no quadro abaixo:',
    clearBtn: 'Limpar',
    submitBtn: 'Enviar e Libertar Treinos',
    errFillAll: 'Por favor, responda a todas as perguntas.',
    errSign: 'Por favor, forneça a sua assinatura.',
    loading: 'A enviar...'
  },
  'en': {
    title: 'Health Questionnaire (PAR-Q)',
    subtitle: 'Mandatory completion to unlock workouts',
    questions: [
      'Has your doctor ever said that you have a heart condition and that you should only do physical activity recommended by a doctor?',
      'Do you feel pain in your chest when you do physical activity?',
      'In the past month, have you had chest pain when you were not doing physical activity?',
      'Do you lose your balance because of dizziness or do you ever lose consciousness?',
      'Do you have a bone or joint problem that could be made worse by a change in your physical activity?',
      'Is your doctor currently prescribing drugs for your blood pressure or heart condition?',
      'Have you had any recent surgeries or major injuries?',
      'Do you know of any other reason why you should not do physical activity?'
    ],
    yes: 'Yes', no: 'No',
    obsPlaceholder: 'Please provide details here...',
    disclaimer: 'I declare that I have read, understood, and answered the questions honestly. I take full responsibility for this information. I acknowledge my Personal Trainer will review this before clearing me for exercise.',
    signHere: 'Sign with your finger below:',
    clearBtn: 'Clear',
    submitBtn: 'Submit and Unlock Workouts',
    errFillAll: 'Please answer all questions.',
    errSign: 'Please provide your signature.',
    loading: 'Submitting...'
  }
};

export default function ParqForm({ alunoId, onComplete }: { alunoId: string, onComplete?: () => void }) {
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [isDark, setIsDark] = useState(true);
  const t = translations[lang] || translations['pt-BR'];

  // Respostas: chave = index da pergunta, valor = { yesNo: boolean, obs: string }
  const [respostas, setRespostas] = useState<Record<number, { yesNo: boolean | null, obs: string }>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
    
    // Inicializar estado das respostas
    const initRespostas: any = {};
    t.questions.forEach((_, i) => { initRespostas[i] = { yesNo: null, obs: '' }; });
    setRespostas(initRespostas);
  }, [t.questions.length]);

  const handleToggle = (index: number, value: boolean) => {
    setRespostas(prev => ({ ...prev, [index]: { ...prev[index], yesNo: value } }));
  };

  const handleObsChange = (index: number, text: string) => {
    setRespostas(prev => ({ ...prev, [index]: { ...prev[index], obs: text } }));
  };

  const limparAssinatura = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    
    // Validar se todas as perguntas foram respondidas (Sim ou Não)
    const todasRespondidas = Object.values(respostas).every(r => r.yesNo !== null);
    if (!todasRespondidas || Object.keys(respostas).length < t.questions.length) {
      return setErrorMsg(t.errFillAll);
    }

    // Validar Assinatura
    if (sigCanvas.current?.isEmpty()) {
      return setErrorMsg(t.errSign);
    }

    setLoading(true);
    try {
      // CORREÇÃO: Trocamos getTrimmedCanvas() por getCanvas() para evitar o erro do Webpack no Next.js
      const assinaturaBase64 = sigCanvas.current?.getCanvas().toDataURL('image/png');

      // Salva na tabela do PAR-Q
      const { error: parqError } = await supabase.from('aluno_parq').insert({
        aluno_id: alunoId,
        respostas: respostas,
        assinatura: assinaturaBase64
      });
      if (parqError) throw parqError;

      // Atualiza o status do aluno para PAR-Q válido
      const { error: alunoError } = await supabase.from('alunos').update({
        parq_valido: true
      }).eq('id', alunoId);
      if (alunoError) throw alunoError;

      if (onComplete) onComplete();

    } catch (error: any) {
  console.error("ERRO COMPLETO:", JSON.stringify(error, null, 2)); // Isso vai te dar o código do erro (ex: 42501 - permission denied)
  setErrorMsg('Erro ao salvar formulário. Tente novamente.');
} finally {
      setLoading(false);
    }
  };

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)'
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)'
  } as React.CSSProperties;

  return (
    <div style={themeStyles} className="w-full max-w-3xl mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Cabeçalho */}
      <div className="bg-[#1C283F] p-8 text-white text-center rounded-b-[2rem] shadow-lg relative z-10">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
          <FaExclamationTriangle size={26} />
        </div>
        <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>
        <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-2">{t.subtitle}</p>
      </div>

      <div className="p-6 sm:p-10 space-y-8 bg-[var(--bg)]">
        
        {/* Erro */}
        {errorMsg && (
          <div className="bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20 p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
            <FaExclamationTriangle className="shrink-0" /> {errorMsg}
          </div>
        )}

        {/* Lista de Perguntas */}
        <div className="space-y-6">
          {t.questions.map((pergunta, index) => (
            <div key={index} className="bg-[var(--surface)] p-5 rounded-[1.5rem] border border-[var(--border)] shadow-sm">
              <p className="text-[var(--text-primary)] font-bold text-sm leading-relaxed mb-4">
                <span className="text-[var(--primary)] mr-2">{index + 1}.</span> {pergunta}
              </p>
              
              <div className="flex gap-3 mb-3">
                <button 
                  onClick={() => handleToggle(index, true)}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-2 ${respostas[index]?.yesNo === true ? 'bg-[var(--danger)] text-white border-[var(--danger)] shadow-lg shadow-[var(--danger)]/20' : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border-[var(--border)]'}`}
                >
                  {respostas[index]?.yesNo === true && <FaCheck />} {t.yes}
                </button>
                <button 
                  onClick={() => handleToggle(index, false)}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-2 ${respostas[index]?.yesNo === false ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20' : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border-[var(--border)]'}`}
                >
                  {respostas[index]?.yesNo === false && <FaTimes />} {t.no}
                </button>
              </div>

              {/* Caixa de Observação (Aparece se responder SIM) */}
              <div className={`overflow-hidden transition-all duration-300 ${respostas[index]?.yesNo === true ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                <textarea 
                  value={respostas[index]?.obs || ''}
                  onChange={(e) => handleObsChange(index, e.target.value)}
                  placeholder={t.obsPlaceholder}
                  className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-4 rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--danger)] transition-colors resize-none h-24 custom-scrollbar"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Termo de Responsabilidade & Assinatura */}
        <div className="bg-[var(--surface-sec)] p-6 rounded-[1.5rem] border border-[var(--border)] mt-8">
          <p className="text-[var(--text-secondary)] text-[11px] font-medium leading-relaxed mb-6 text-justify">
            {t.disclaimer}
          </p>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{t.signHere}</label>
              <button onClick={limparAssinatura} className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--danger)] flex items-center gap-1 transition-colors">
                <FaEraser /> {t.clearBtn}
              </button>
            </div>
            
            {/* Canvas da Assinatura Digital */}
            <div className="w-full bg-white rounded-xl border-2 border-dashed border-[var(--primary)]/30 overflow-hidden cursor-crosshair">
              <SignatureCanvas 
                ref={sigCanvas}
                penColor="#0F1115"
                canvasProps={{ className: 'w-full h-40' }}
              />
            </div>
          </div>
        </div>

        {/* Botão Finalizar */}
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[var(--primary)] text-white py-5 rounded-[1.2rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-[0_10px_30px_-10px_var(--primary)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? t.loading : t.submitBtn}
        </button>

      </div>
    </div>
  );
}