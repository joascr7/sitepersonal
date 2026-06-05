'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaBullhorn, FaPaperPlane, FaImage, FaUsers, 
  FaMobileAlt, FaClock, FaEye, FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';

export default function AdminBroadcaster() {
  const [formData, setFormData] = useState({
    titulo: '', corpo: '', segmentacao: 'todos', mediaUrl: '', tipoMidia: 'imagem', ctaLink: '', agendamento: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [historicoCampanhas, setHistoricoCampanhas] = useState<any[]>([]);

  useEffect(() => {
    carregarHistoricoCampanhas();
  }, []);

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
      showToast('error', 'Preencha o título e o corpo da notificação.');
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

      showToast('success', formData.agendamento ? 'Notificação agendada com sucesso!' : 'Disparo em massa iniciado!');
      setFormData({ titulo: '', corpo: '', segmentacao: 'todos', mediaUrl: '', tipoMidia: 'imagem', ctaLink: '', agendamento: '' });
      carregarHistoricoCampanhas();
    } catch (err: any) {
      showToast('error', 'Erro ao registrar disparo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#F8FAFC] p-6 sm:p-10 font-sans box-border w-full">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Toasts de Feedback */}
        {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-4 rounded-xl shadow-2xl z-[999] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
            {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
          </div>
        )}

        {/* Header Principal */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shadow-inner">
            <FaBullhorn size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">Central de Disparos</h1>
            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-widest mt-0.5">Gerenciador de Notificações em Massa</p>
          </div>
        </div>

        {/* Grid Splitter Form vs Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Formulário de Configuração (Esquerda) */}
          <form onSubmit={handleDisparar} className="lg:col-span-7 bg-[#151A22] p-6 sm:p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-xl shadow-black/20">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5"><FaUsers /> Segmentação de Público</label>
                <select 
                  value={formData.segmentacao} 
                  onChange={(e) => setFormData({...formData, segmentacao: e.target.value})}
                  className="w-full px-4 py-3.5 bg-[#1B2330] border border-white/5 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-white shadow-inner"
                >
                  <option value="todos">Todos os Usuários (Global)</option>
                  <option value="alunos">Apenas Alunos</option>
                  <option value="personais">Apenas Personal Trainers</option>
                  <option value="plano_premium">Segmentação: Plano Premium</option>
                  <option value="plano_gratis">Segmentação: Usuários Gratuitos</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5"><FaClock /> Agendamento (Opcional)</label>
                <input 
                  type="datetime-local" 
                  value={formData.agendamento}
                  onChange={(e) => setFormData({...formData, agendamento: e.target.value})}
                  className="w-full px-4 py-3 bg-[#1B2330] border border-white/5 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-white shadow-inner"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Título da Mensagem</label>
              <input 
                type="text" 
                placeholder="Ex: Atualização Importante do Sistema 🚀"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                className="w-full px-4 py-3.5 bg-[#1B2330] border border-white/5 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-white shadow-inner"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Corpo do Push</label>
              <textarea 
                rows={4}
                placeholder="Escreva o texto descritivo detalhado que aparecerá na tela bloqueada..."
                value={formData.corpo}
                onChange={(e) => setFormData({...formData, corpo: e.target.value})}
                className="w-full px-4 py-3.5 bg-[#1B2330] border border-white/5 rounded-xl outline-none focus:border-blue-500 text-sm font-medium text-white shadow-inner resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 flex flex-col gap-2">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5"><FaImage /> URL do Arquivo de Mídia (Opcional)</label>
                <input 
                  type="url" 
                  placeholder="https://suaplataforma.com/imagem.gif"
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({...formData, mediaUrl: e.target.value})}
                  className="w-full px-4 py-3.5 bg-[#1B2330] border border-white/5 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-white shadow-inner"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Tipo de Formato</label>
                <select 
                  value={formData.tipoMidia}
                  onChange={(e) => setFormData({...formData, tipoMidia: e.target.value})}
                  className="w-full px-4 py-3.5 bg-[#1B2330] border border-white/5 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-white shadow-inner"
                >
                  <option value="imagem">Imagem Estática</option>
                  <option value="gif">GIF Animado</option>
                  <option value="video">Vídeo MP4</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Link de Ação CTA Deep Link (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ex: /dashboard/financeiro ou URL externa"
                value={formData.ctaLink}
                onChange={(e) => setFormData({...formData, ctaLink: e.target.value})}
                className="w-full px-4 py-3.5 bg-[#1B2330] border border-white/5 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-white shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.99] disabled:opacity-40 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 mt-4"
            >
              <FaPaperPlane size={12} /> {loading ? 'Processando envio...' : formData.agendamento ? 'Agendar Campanha' : 'Disparar Agora'}
            </button>
          </form>

          {/* Simulador Mobile em Tempo Real (Direita) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#151A22]/40 p-6 rounded-[2rem] border border-white/5 space-y-6">
            <h3 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center gap-2"><FaEye /> Preview Realtime (Notch/Safe Area)</h3>
            
            {/* Corpo Físico do Aparelho (Simulador iOS / Android) */}
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
                <p className="text-[9px] font-black tracking-widest uppercase text-white/50">Sexta-feira, 5 de junho</p>
              </div>

              {/* Push Notification Banner com Design System Premium */}
              <div className="relative z-20 mt-14 w-full bg-white/[0.08] backdrop-blur-xl border border-white/10 p-3 rounded-2xl space-y-1 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-blue-500 rounded-md flex items-center justify-center text-white text-[8px] font-black">A</div>
                    <span className="text-[9px] font-black tracking-wider uppercase text-white/70">AuraFit</span>
                  </div>
                  <span className="text-[8px] text-white/40 font-bold">agora</span>
                </div>

                <h4 className="text-xs font-black text-white leading-tight truncate">
                  {formData.titulo || "Título da sua Notificação"}
                </h4>
                <p className="text-[11px] text-white/70 font-medium leading-normal text-left line-clamp-3">
                  {formData.corpo || "Digite o texto do corpo no formulário para visualizar como os usuários receberão a notificação na tela de bloqueio do celular."}
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
              <h4 className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Últimos Disparos de Massa</h4>
              {historicoCampanhas.map((camp) => (
                <div key={camp.id} className="p-3 bg-[#1B2330] rounded-xl border border-white/5 text-xs flex justify-between items-center">
                  <div className="truncate pr-2">
                    <p className="font-bold text-white truncate">{camp.titulo}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5 uppercase font-medium">{camp.segmentacao}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md shrink-0 ${camp.status === 'enviado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
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