'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaBullhorn, FaPaperPlane, FaImage, FaUsers, 
  FaClock, FaEye, FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    pageTitle: 'Central de Disparos',
    pageSubtitle: 'Gerenciador de Notificações em Massa',
    segLabel: 'Segmentação de Público',
    segAll: 'Todos os Usuários (Global)',
    segStudents: 'Apenas Alunos',
    segTrainers: 'Apenas Personal Trainers',
    segPremium: 'Segmentação: Plano Premium',
    segFree: 'Segmentação: Usuários Gratuitos',
    scheduleLabel: 'Agendamento (Opcional)',
    titleLabel: 'Título da Mensagem',
    titlePlaceholder: 'Ex: Atualização Importante do Sistema 🚀',
    bodyLabel: 'Corpo do Push',
    bodyPlaceholder: 'Escreva o texto descritivo detalhado que aparecerá na tela bloqueada...',
    mediaLabel: 'URL do Arquivo de Mídia (Opcional)',
    mediaPlaceholder: 'https://suaplataforma.com/imagem.gif',
    typeLabel: 'Tipo de Formato',
    typeImg: 'Imagem Estática',
    typeGif: 'GIF Animado',
    typeVid: 'Vídeo MP4',
    ctaLabel: 'Link de Ação CTA Deep Link (Opcional)',
    ctaPlaceholder: 'Ex: /dashboard/financeiro ou URL externa',
    btnSend: 'Disparar Agora',
    btnSchedule: 'Agendar Campanha',
    btnProcessing: 'Processando envio...',
    previewTitle: 'Preview Realtime (Notch/Safe Area)',
    previewDate: 'Sexta-feira, 5 de junho',
    previewNow: 'agora',
    previewEmptyTitle: 'Título da sua Notificação',
    previewEmptyBody: 'Digite o texto do corpo no formulário para visualizar como os usuários receberão a notificação na tela de bloqueio do celular.',
    historyTitle: 'Últimos Disparos de Massa',
    errFill: 'Preencha o título e o corpo da notificação.',
    errSend: 'Erro ao registrar disparo: ',
    successSend: 'Disparo em massa iniciado!',
    successSchedule: 'Notificação agendada com sucesso!'
  },
  'pt-PT': {
    pageTitle: 'Central de Envios',
    pageSubtitle: 'Gestor de Notificações em Massa',
    segLabel: 'Segmentação de Público',
    segAll: 'Todos os Utilizadores (Global)',
    segStudents: 'Apenas Alunos',
    segTrainers: 'Apenas Personal Trainers',
    segPremium: 'Segmentação: Plano Premium',
    segFree: 'Segmentação: Utilizadores Gratuitos',
    scheduleLabel: 'Agendamento (Opcional)',
    titleLabel: 'Título da Mensagem',
    titlePlaceholder: 'Ex: Atualização Importante do Sistema 🚀',
    bodyLabel: 'Corpo do Push',
    bodyPlaceholder: 'Escreva o texto descritivo detalhado que aparecerá no ecrã bloqueado...',
    mediaLabel: 'URL do Ficheiro de Multimédia (Opcional)',
    mediaPlaceholder: 'https://asuaplataforma.com/imagem.gif',
    typeLabel: 'Tipo de Formato',
    typeImg: 'Imagem Estática',
    typeGif: 'GIF Animado',
    typeVid: 'Vídeo MP4',
    ctaLabel: 'Link de Ação CTA Deep Link (Opcional)',
    ctaPlaceholder: 'Ex: /dashboard/financeiro ou URL externa',
    btnSend: 'Enviar Agora',
    btnSchedule: 'Agendar Campanha',
    btnProcessing: 'A processar envio...',
    previewTitle: 'Pré-visualização em Tempo Real',
    previewDate: 'Sexta-feira, 5 de junho',
    previewNow: 'agora',
    previewEmptyTitle: 'Título da sua Notificação',
    previewEmptyBody: 'Digite o texto do corpo no formulário para visualizar como os utilizadores irão receber a notificação no ecrã bloqueado.',
    historyTitle: 'Últimos Envios em Massa',
    errFill: 'Preencha o título e o corpo da notificação.',
    errSend: 'Erro ao registar envio: ',
    successSend: 'Envio em massa iniciado!',
    successSchedule: 'Notificação agendada com sucesso!'
  },
  'en': {
    pageTitle: 'Broadcast Center',
    pageSubtitle: 'Mass Notification Manager',
    segLabel: 'Audience Segmentation',
    segAll: 'All Users (Global)',
    segStudents: 'Students Only',
    segTrainers: 'Trainers Only',
    segPremium: 'Segmentation: Premium Plan',
    segFree: 'Segmentation: Free Users',
    scheduleLabel: 'Scheduling (Optional)',
    titleLabel: 'Message Title',
    titlePlaceholder: 'Ex: Important System Update 🚀',
    bodyLabel: 'Push Body',
    bodyPlaceholder: 'Write the detailed descriptive text that will appear on the lock screen...',
    mediaLabel: 'Media File URL (Optional)',
    mediaPlaceholder: 'https://yourplatform.com/image.gif',
    typeLabel: 'Format Type',
    typeImg: 'Static Image',
    typeGif: 'Animated GIF',
    typeVid: 'MP4 Video',
    ctaLabel: 'CTA Deep Link Action (Optional)',
    ctaPlaceholder: 'Ex: /dashboard/financial or external URL',
    btnSend: 'Send Now',
    btnSchedule: 'Schedule Campaign',
    btnProcessing: 'Processing...',
    previewTitle: 'Realtime Preview (Notch/Safe Area)',
    previewDate: 'Friday, June 5',
    previewNow: 'now',
    previewEmptyTitle: 'Your Notification Title',
    previewEmptyBody: 'Type the body text in the form to preview how users will receive the notification on their mobile lock screen.',
    historyTitle: 'Recent Mass Broadcasts',
    errFill: 'Please fill in the notification title and body.',
    errSend: 'Error registering broadcast: ',
    successSend: 'Mass broadcast initiated!',
    successSchedule: 'Notification scheduled successfully!'
  }
};

export default function AdminBroadcaster() {
  const [formData, setFormData] = useState({
    titulo: '', corpo: '', segmentacao: 'todos', mediaUrl: '', tipoMidia: 'imagem', ctaLink: '', agendamento: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [historicoCampanhas, setHistoricoCampanhas] = useState<any[]>([]);

  // Estados de Tema e i18n
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    
    setMounted(true);
    carregarHistoricoCampanhas();
  }, []);

  const t = translations[lang] || translations['pt-BR'];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--danger': '#EF4444',
    '--success': '#22C55E',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--danger': '#DC2626',
    '--success': '#16A34A',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const carregarHistoricoCampanhas = async () => {
    const { data } = await supabase
      .from('notification_broadcasts')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(5);
    if (data) setHistoricoCampanhas(data);
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const handleDisparar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.corpo.trim()) {
      showToast('error', t.errFill);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('notification_broadcasts').insert({
        titulo: formData.titulo.trim(),
        corpo: formData.corpo.trim(),
        segmentacao: formData.segmentacao,
        media_url: formData.mediaUrl.trim() || null,
        tipo_midia: formData.mediaUrl.trim() ? formData.tipoMidia : null,
        cta_link: formData.ctaLink.trim() || null,
        agendado_para: formData.agendamento ? new Date(formData.agendamento).toISOString() : null,
        status: formData.agendamento ? 'pendente' : 'enviado',
        criado_por: user?.id
      });

      if (error) throw error;

      showToast('success', formData.agendamento ? t.successSchedule : t.successSend);
      setFormData({ titulo: '', corpo: '', segmentacao: 'todos', mediaUrl: '', tipoMidia: 'imagem', ctaLink: '', agendamento: '' });
      carregarHistoricoCampanhas();
    } catch (err: any) {
      showToast('error', t.errSend + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div style={themeStyles} className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] p-6 sm:p-10 font-sans box-border w-full transition-colors duration-500">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Toasts de Feedback Premium */}
        {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-4 rounded-xl shadow-2xl z-[999] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 ${
            toast.type === 'success' 
              ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' 
              : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'
          }`}>
            {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
          </div>
        )}

        {/* Header Principal */}
        <div className="flex items-center gap-4 border-b border-[var(--border)] pb-6">
          <div className="w-12 h-12 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl flex items-center justify-center shadow-inner">
            <FaBullhorn size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[var(--text-primary)]">{t.pageTitle}</h1>
            <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mt-0.5">{t.pageSubtitle}</p>
          </div>
        </div>

        {/* Grid Splitter Form vs Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Formulário de Configuração (Esquerda) */}
          <form onSubmit={handleDisparar} className="lg:col-span-7 bg-[var(--surface)] p-6 sm:p-8 rounded-[2rem] border border-[var(--border)] space-y-6 shadow-xl">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 group">
                <label className="text-[10px] font-black text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors uppercase tracking-widest flex items-center gap-1.5"><FaUsers /> {t.segLabel}</label>
                <select 
                  value={formData.segmentacao} 
                  onChange={(e) => setFormData({...formData, segmentacao: e.target.value})}
                  className="w-full px-4 py-3.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm font-bold text-[var(--text-primary)] shadow-inner transition-all"
                >
                  <option value="todos">{t.segAll}</option>
                  <option value="alunos">{t.segStudents}</option>
                  <option value="personais">{t.segTrainers}</option>
                  <option value="plano_premium">{t.segPremium}</option>
                  <option value="plano_gratis">{t.segFree}</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 group">
                <label className="text-[10px] font-black text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors uppercase tracking-widest flex items-center gap-1.5"><FaClock /> {t.scheduleLabel}</label>
                <input 
                  type="datetime-local" 
                  value={formData.agendamento}
                  onChange={(e) => setFormData({...formData, agendamento: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm font-bold text-[var(--text-primary)] shadow-inner transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 group">
              <label className="text-[10px] font-black text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors uppercase tracking-widest">{t.titleLabel}</label>
              <input 
                type="text" 
                placeholder={t.titlePlaceholder}
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                className="w-full px-4 py-3.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner transition-all"
              />
            </div>

            <div className="flex flex-col gap-2 group">
              <label className="text-[10px] font-black text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors uppercase tracking-widest">{t.bodyLabel}</label>
              <textarea 
                rows={4}
                placeholder={t.bodyPlaceholder}
                value={formData.corpo}
                onChange={(e) => setFormData({...formData, corpo: e.target.value})}
                className="w-full px-4 py-3.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner resize-none leading-relaxed transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 flex flex-col gap-2 group">
                <label className="text-[10px] font-black text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors uppercase tracking-widest flex items-center gap-1.5"><FaImage /> {t.mediaLabel}</label>
                <input 
                  type="url" 
                  placeholder={t.mediaPlaceholder}
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({...formData, mediaUrl: e.target.value})}
                  className="w-full px-4 py-3.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner transition-all"
                />
              </div>
              <div className="flex flex-col gap-2 group">
                <label className="text-[10px] font-black text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors uppercase tracking-widest">{t.typeLabel}</label>
                <select 
                  value={formData.tipoMidia}
                  onChange={(e) => setFormData({...formData, tipoMidia: e.target.value})}
                  className="w-full px-4 py-3.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm font-bold text-[var(--text-primary)] shadow-inner transition-all"
                >
                  <option value="imagem">{t.typeImg}</option>
                  <option value="gif">{t.typeGif}</option>
                  <option value="video">{t.typeVid}</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 group">
              <label className="text-[10px] font-black text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors uppercase tracking-widest">{t.ctaLabel}</label>
              <input 
                type="text" 
                placeholder={t.ctaPlaceholder}
                value={formData.ctaLink}
                onChange={(e) => setFormData({...formData, ctaLink: e.target.value})}
                className="w-full px-4 py-3.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-[var(--primary)]/20 flex items-center justify-center gap-3 mt-4"
            >
              <FaPaperPlane size={12} /> {loading ? t.btnProcessing : formData.agendamento ? t.btnSchedule : t.btnSend}
            </button>
          </form>

          {/* Simulador Mobile em Tempo Real (Direita) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[var(--surface)]/50 p-6 rounded-[2rem] border border-[var(--border)] space-y-6">
            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2"><FaEye /> {t.previewTitle}</h3>
            
            {/* Corpo Físico do Aparelho (Este bloco sempre mantém cores hardcoded escuras para parecer um celular real) */}
            <div className="w-[300px] h-[580px] bg-black rounded-[3rem] border-4 border-[#1B2330] relative shadow-2xl p-3 box-border overflow-hidden select-none">
              
              {/* Wallpaper Simulado Fundo */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-zinc-950 z-0" />
              
              {/* Notch / Dynamic Island */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-center shadow-inner">
                <span className="w-2 h-2 bg-zinc-900 rounded-full absolute left-4" />
              </div>

              {/* Informações da Tela de Bloqueio */}
              <div className="relative z-10 w-full text-center mt-12 space-y-0.5 text-white/80">
                <span className="text-4xl font-light tracking-tight">14:20</span>
                <p className="text-[9px] font-black tracking-widest uppercase text-white/50">{t.previewDate}</p>
              </div>

              {/* Push Notification Banner com Design System Premium */}
              <div className="relative z-20 mt-14 w-full bg-white/[0.08] backdrop-blur-xl border border-white/10 p-3 rounded-2xl space-y-1 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-blue-500 rounded-md flex items-center justify-center text-white text-[8px] font-black">A</div>
                    <span className="text-[9px] font-black tracking-wider uppercase text-white/70">AuraFit</span>
                  </div>
                  <span className="text-[8px] text-white/40 font-bold">{t.previewNow}</span>
                </div>

                <h4 className="text-xs font-black text-white leading-tight truncate">
                  {formData.titulo || t.previewEmptyTitle}
                </h4>
                <p className="text-[11px] text-white/70 font-medium leading-normal text-left line-clamp-3">
                  {formData.corpo || t.previewEmptyBody}
                </p>

                {formData.mediaUrl && (
                  <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-white/5 bg-black/40">
                    <img src={formData.mediaUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>
                )}
              </div>

              {/* Home Indicator Bar */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/40 rounded-full z-30" />
            </div>

            {/* Listagem do Histórico de Campanhas Enviadas */}
            <div className="w-full space-y-3">
              <h4 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t.historyTitle}</h4>
              {historicoCampanhas.map((camp) => (
                <div key={camp.id} className="p-3 bg-[var(--surface-sec)] rounded-xl border border-[var(--border)] text-xs flex justify-between items-center transition-colors">
                  <div className="truncate pr-2">
                    <p className="font-bold text-[var(--text-primary)] truncate">{camp.titulo}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 uppercase font-medium">{camp.segmentacao}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md shrink-0 ${
                    camp.status === 'enviado' 
                      ? 'bg-[var(--success)]/10 text-[var(--success)]' 
                      : 'bg-amber-500/10 text-amber-500' // Mantido âmbar para status pendente
                  }`}>
                    {camp.status}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}