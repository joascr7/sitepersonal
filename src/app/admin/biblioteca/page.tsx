'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaCloudUploadAlt, FaSave, FaSpinner, FaChevronDown, FaChevronUp, FaVideo, FaImage, FaDumbbell } from 'react-icons/fa';

const translations = {
  'pt-BR': { title: 'Biblioteca de Treinos', btnSave: 'Salvar Alterações', loading: 'CARREGANDO SISTEMA...', saving: 'Salvando...', errDb: 'Erro ao salvar no banco.', errUpload: 'Erro no upload: ', general: 'Geral', pasteUrl: 'Cole o link do vídeo/gif...' },
  'pt-PT': { title: 'Biblioteca de Treinos', btnSave: 'Guardar Alterações', loading: 'A CARREGAR SISTEMA...', saving: 'A guardar...', errDb: 'Erro ao guardar no banco.', errUpload: 'Erro no upload: ', general: 'Geral', pasteUrl: 'Cole o link do vídeo/gif...' },
  'en': { title: 'Workout Library', btnSave: 'Save Changes', loading: 'LOADING SYSTEM...', saving: 'Saving...', errDb: 'Error saving to database.', errUpload: 'Upload error: ', general: 'General', pasteUrl: 'Paste video/gif link...' }
};

export default function BibliotecaAdmin() {
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [treinoAberto, setTreinoAberto] = useState<string | null>(null);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');

  useEffect(() => {
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    carregarModelos();
  }, []);

  const t = translations[lang] || translations['pt-BR'];

  const carregarModelos = async () => {
    setLoading(true);
    const { data } = await supabase.from('treinos_padrao').select('*');
    setModelos(data || []);
    setLoading(false);
  };

  const salvarTreino = async (modelo: any) => {
    const { error } = await supabase
      .from('treinos_padrao')
      .update({ exercicios_json: modelo.exercicios_json })
      .eq('id', modelo.id);
    if (error) return alert(t.errDb);
    alert("Alterações salvas!");
  };

  const handleFileUpload = async (e: any, m: any, exIdxOriginal: number) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileId = `${m.id}-${exIdxOriginal}`;
    setUploading(fileId);

    const { data, error } = await supabase.storage.from('videos').upload(`exercicios/${Date.now()}_${file.name}`, file);
    if (error) { setUploading(null); return alert(t.errUpload + error.message); }

    const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(data.path);
    const novosExercicios = [...m.exercicios_json];
    novosExercicios[exIdxOriginal] = { ...novosExercicios[exIdxOriginal], video: publicUrl };
    setModelos(prev => prev.map(item => item.id === m.id ? { ...item, exercicios_json: novosExercicios } : item));
    setUploading(null);
  };

  // Função auxiliar para verificar se a URL é imagem/gif
  const isImageOrGif = (url: string) => {
    if (!url) return false;
    return /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i.test(url);
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center font-black text-[var(--primary)] uppercase tracking-[0.2em]">{t.loading}</main>;

  return (
    <main className="p-4 md:p-10 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-3xl md:text-4xl font-black mb-10 tracking-tighter text-[var(--text-primary)]">{t.title}</h1>
      
      <div className="space-y-6">
        {modelos.map((m) => {
          // Agrupa os exercícios por categoria. Se não houver 'categoria' no JSON, cai em 'Geral'
          const exerciciosAgrupados = (m.exercicios_json || []).reduce((acc: any, ex: any, idx: number) => {
            const cat = ex.categoria || t.general;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push({ ...ex, originalIndex: idx });
            return acc;
          }, {});

          return (
            <div key={m.id} className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] shadow-lg overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setTreinoAberto(treinoAberto === m.id ? null : m.id)} 
                className="w-full p-6 md:p-8 text-left flex justify-between items-center hover:bg-[var(--surface-sec)] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
                    <FaDumbbell size={20} />
                  </div>
                  <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{m.nome_modelo}</h2>
                </div>
                <div className="text-[var(--text-secondary)] bg-[var(--surface-sec)] p-3 rounded-full group-hover:bg-[var(--border)] transition-colors">
                  {treinoAberto === m.id ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </button>
              
              {treinoAberto === m.id && (
                <div className="px-6 pb-8 pt-2 md:px-8 space-y-8 animate-in slide-in-from-top-4 duration-300 border-t border-[var(--border)]">
                  
                  {Object.entries(exerciciosAgrupados).map(([categoria, exs]: any) => (
                    <div key={categoria} className="space-y-4">
                      {/* Título da Categoria */}
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-[var(--primary)] rounded-full" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                          {categoria}
                        </h3>
                      </div>

                      {/* Lista de Exercícios da Categoria */}
                      <div className="grid grid-cols-1 gap-3">
                        {exs.map((ex: any) => (
                          <div key={ex.originalIndex} className="bg-[var(--surface-sec)] p-3 md:p-4 rounded-[1.5rem] border border-[var(--border)] flex flex-col md:flex-row gap-4 items-center hover:border-[var(--primary)]/30 transition-colors">
                            
                            {/* PREVIEW DE MÍDIA (Thumbnail Esquerdo) */}
                            <div className="w-full md:w-24 h-40 md:h-24 shrink-0 rounded-[1rem] overflow-hidden bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center relative group">
                              {ex.video ? (
                                isImageOrGif(ex.video) ? (
                                  <img src={ex.video} alt={ex.nome} className="w-full h-full object-cover" />
                                ) : (
                                  <video src={ex.video} className="w-full h-full object-cover" muted loop playsInline autoPlay />
                                )
                              ) : (
                                <div className="flex flex-col items-center text-[var(--text-secondary)] opacity-40">
                                  <FaImage size={24} className="mb-1" />
                                  <span className="text-[8px] font-bold uppercase tracking-widest">Sem Mídia</span>
                                </div>
                              )}
                            </div>

                            {/* INFORMAÇÕES E INPUTS (Lado Direito) */}
                            <div className="flex-1 w-full flex flex-col gap-3">
                              <p className="text-sm font-bold text-[var(--text-primary)]">{ex.nome}</p>
                              
                              <div className="flex gap-2 w-full">
                                <input 
                                  className="flex-1 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--text-secondary)]/50" 
                                  placeholder={t.pasteUrl} 
                                  value={ex.video || ''}
                                  onChange={(e) => {
                                    const novos = [...m.exercicios_json];
                                    novos[ex.originalIndex].video = e.target.value;
                                    setModelos(prev => prev.map(i => i.id === m.id ? {...i, exercicios_json: novos} : i));
                                  }}
                                />
                                
                                <label className={`cursor-pointer shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${uploading === `${m.id}-${ex.originalIndex}` ? 'bg-[var(--surface)] border border-[var(--border)]' : 'bg-[var(--primary)] text-white hover:brightness-110 shadow-lg shadow-[var(--primary)]/20'}`}>
                                  {uploading === `${m.id}-${ex.originalIndex}` ? <FaSpinner className="animate-spin text-[var(--text-secondary)]" /> : <FaCloudUploadAlt size={18} />}
                                  <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFileUpload(e, m, ex.originalIndex)} />
                                </label>
                              </div>
                            </div>
                            
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button onClick={() => salvarTreino(m)} className="w-full mt-6 bg-[var(--primary)] text-white p-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.1em] hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[var(--primary)]/20">
                    <FaSave size={16} /> {t.btnSave}
                  </button>
                  
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}