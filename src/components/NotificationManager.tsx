import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaPaperPlane, FaBell, FaChevronDown, FaUsers } from 'react-icons/fa';

interface Props {
  personalId: string;
  alunos: any[];
  showStatus: (type: 'success' | 'error' | 'info', text: string) => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    sendNotice: 'Enviar Aviso',
    allStudents: 'Todos os Alunos',
    titlePlaceholder: 'Título (ex: Novo Treino!)',
    msgPlaceholder: 'Escreva sua mensagem...',
    sendBtn: 'Enviar Notificação',
    sending: 'Enviando...',
    historyTitle: 'Últimas Enviadas',
    emptyHistory: 'Nenhuma notificação recente.',
    loadMore: 'Ver mais',
    errTitle: 'Digite um título.',
    errMsg: 'Digite uma mensagem.',
    errStudents: 'Nenhum aluno cadastrado.',
    success: 'Notificação enviada!',
    errSend: 'Erro ao enviar. Verifique o console.'
  },
  'pt-PT': {
    sendNotice: 'Enviar Aviso',
    allStudents: 'Todos os Alunos',
    titlePlaceholder: 'Título (ex: Novo Treino!)',
    msgPlaceholder: 'Escreva a sua mensagem...',
    sendBtn: 'Enviar Notificação',
    sending: 'A enviar...',
    historyTitle: 'Últimas Enviadas',
    emptyHistory: 'Nenhuma notificação recente.',
    loadMore: 'Ver mais',
    errTitle: 'Introduza um título.',
    errMsg: 'Introduza uma mensagem.',
    errStudents: 'Nenhum aluno registado.',
    success: 'Notificação enviada!',
    errSend: 'Erro ao enviar. Verifique a consola.'
  },
  'en': {
    sendNotice: 'Send Notice',
    allStudents: 'All Students',
    titlePlaceholder: 'Title (e.g., New Workout!)',
    msgPlaceholder: 'Write your message...',
    sendBtn: 'Send Notification',
    sending: 'Sending...',
    historyTitle: 'Recently Sent',
    emptyHistory: 'No recent notifications.',
    loadMore: 'Load more',
    errTitle: 'Enter a title.',
    errMsg: 'Enter a message.',
    errStudents: 'No students registered.',
    success: 'Notification sent!',
    errSend: 'Error sending. Check console.'
  }
};

export default function NotificationManager({ personalId, alunos, showStatus }: Props) {
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [alunoDestino, setAlunoDestino] = useState('todos');
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Controle de Interface (Tema, Idioma e Paginação)
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [isDark, setIsDark] = useState(true);
  const [itensVisiveis, setItensVisiveis] = useState(5);
  
  // Controle do Accordion (Expandir/Recolher)
  const [isFormOpen, setIsFormOpen] = useState(true); // Formulário começa aberto
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Histórico começa fechado

  const t = translations[lang] || translations['pt-BR'];

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');

    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
  }, []);

  useEffect(() => {
    if (alunos && alunos.length > 0) {
      fetchNotificacoes();
    }
  }, [alunos]);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BUSCA: Agora filtra pelo personal_id do remetente
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 const fetchNotificacoes = async () => {
    try {
      const alunoIds = alunos.map(a => a.id);
      if (alunoIds.length === 0) return;

      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .in('user_id', alunoIds)
        .order('criado_em', { ascending: false }) // <--- Corrigido para criado_em
        .limit(50);
        
      if (error) throw error;
      if (data) setNotificacoes(data);
    } catch (error) {
      console.error("Erro ao buscar:", error);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ENVIO: Agora inclui o personal_id em cada registro
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const enviar = async () => {
    if (!titulo.trim()) return showStatus('error', t.errTitle);
    if (!mensagem.trim()) return showStatus('error', t.errMsg);
    if (alunos.length === 0) return showStatus('error', t.errStudents);
    
    setLoading(true);

    try {
      let dadosParaInserir;

      if (alunoDestino === 'todos') {
        dadosParaInserir = alunos.map(a => ({
          personal_id: personalId, // Registro do remetente
          user_id: a.id,          // Registro do destinatário
          titulo: titulo.trim(),
          corpo: mensagem.trim(),
          lida: false
        }));
      } else {
        dadosParaInserir = [{
          personal_id: personalId, // Registro do remetente
          user_id: alunoDestino,  // Registro do destinatário
          titulo: titulo.trim(),
          corpo: mensagem.trim(),
          lida: false
        }];
      }
      
      const { error } = await supabase.from('user_notifications').insert(dadosParaInserir);
      if (error) throw error;
      
      showStatus('success', t.success);
      setTitulo('');
      setMensagem('');
      fetchNotificacoes();
      
      setIsHistoryOpen(true);
      setIsFormOpen(false); 
    } catch (err: any) {
      console.error("ERRO AO SALVAR NOTIFICAÇÃO:", err);
      showStatus('error', t.errSend);
    } finally {
      setLoading(false);
    }
  };

  const getNomeAluno = (id: string) => {
    const aluno = alunos.find(a => a.id === id);
    return aluno ? aluno.nome : 'Desconhecido';
  };

  const notificacoesExibidas = useMemo(() => {
    return notificacoes.slice(0, itensVisiveis);
  }, [notificacoes, itensVisiveis]);

  return (
    <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-md overflow-hidden transition-colors duration-500">
      
      {/* ━━━━━━━━━━ ÁREA DE ENVIO (ACORDEÃO) ━━━━━━━━━━ */}
      <div className="border-b border-[var(--border)]">
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-[var(--surface-sec)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <FaPaperPlane className="text-blue-500 text-sm" />
            </div>
            <h4 className="font-black text-lg text-[var(--text-primary)]">{t.sendNotice}</h4>
          </div>
          <FaChevronDown 
            className={`text-[var(--text-secondary)] transition-transform duration-300 ${isFormOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Conteúdo do Formulário */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFormOpen ? 'max-h-[500px] opacity-100 pb-6 px-6' : 'max-h-0 opacity-0 px-6'}`}>
          <div className="space-y-4 pt-2">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaUsers className="text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" />
              </div>
              <select 
                value={alunoDestino} 
                onChange={(e) => setAlunoDestino(e.target.value)}
                className="w-full bg-[var(--surface-sec)] pl-11 pr-4 py-3.5 rounded-xl text-sm text-[var(--text-primary)] outline-none border border-[var(--border)] font-medium appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="todos">{t.allStudents}</option>
                {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={t.titlePlaceholder}
              className="w-full bg-[var(--surface-sec)] px-4 py-3.5 rounded-xl text-sm text-[var(--text-primary)] outline-none border border-[var(--border)] font-bold placeholder:text-[var(--text-secondary)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder={t.msgPlaceholder}
              className="w-full bg-[var(--surface-sec)] px-4 py-3.5 rounded-xl text-sm text-[var(--text-primary)] outline-none border border-[var(--border)] resize-none h-28 placeholder:text-[var(--text-secondary)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            
            <button 
              onClick={enviar} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? t.sending : t.sendBtn}
            </button>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━ HISTÓRICO DE ENVIOS (ACORDEÃO) ━━━━━━━━━━ */}
      <div>
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-[var(--surface-sec)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <FaBell className="text-amber-500" /> 
            <h4 className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-widest opacity-90">{t.historyTitle}</h4>
          </div>
          <FaChevronDown 
            className={`text-[var(--text-secondary)] transition-transform duration-300 ${isHistoryOpen ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {/* Conteúdo do Histórico */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isHistoryOpen ? 'max-h-[800px] opacity-100 pb-6 px-6' : 'max-h-0 opacity-0 px-6'}`}>
          <div className="space-y-3 pt-2">
            {notificacoesExibidas.length === 0 ? (
              <div className="py-6 text-center bg-[var(--surface-sec)] rounded-xl border border-[var(--border)] border-dashed">
                <p className="text-xs text-[var(--text-secondary)] font-medium">{t.emptyHistory}</p>
              </div>
            ) : (
              notificacoesExibidas.map(notif => (
                <div key={notif.id} className="bg-[var(--surface-sec)] p-4 rounded-xl border border-[var(--border)] flex flex-col gap-1.5 hover:border-amber-500/30 transition-all group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-blue-500 uppercase bg-blue-500/10 px-2 py-0.5 rounded-md">
                      {getNomeAluno(notif.user_id)}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                      {new Date(notif.criado_em).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR')}
                    </span>
                  </div>
                  <strong className="text-sm text-[var(--text-primary)] tracking-tight">{notif.titulo}</strong>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{notif.corpo}</p>
                </div>
              ))
            )}
          </div>

          {notificacoes.length > itensVisiveis && (
            <button 
              onClick={() => setItensVisiveis(prev => prev + 5)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sec)] rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
            >
              <FaChevronDown size={10} />
              {t.loadMore}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}