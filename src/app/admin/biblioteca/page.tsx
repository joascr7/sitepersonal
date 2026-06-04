'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaCloudUploadAlt, FaSave, FaSpinner, FaChevronDown, FaChevronUp, FaVideo } from 'react-icons/fa';

const translations = {
  'pt-BR': { title: 'Biblioteca de Treinos', btnFile: 'Arquivo', btnSave: 'Salvar Alterações', loading: 'CARREGANDO SISTEMA...', saving: 'Salvando...', errDb: 'Erro ao salvar no banco.', errUpload: 'Erro no upload: ' },
  'pt-PT': { title: 'Biblioteca de Treinos', btnFile: 'Ficheiro', btnSave: 'Guardar Alterações', loading: 'A CARREGAR SISTEMA...', saving: 'A guardar...', errDb: 'Erro ao guardar no banco.', errUpload: 'Erro no upload: ' },
  'en': { title: 'Workout Library', btnFile: 'File', btnSave: 'Save Changes', loading: 'LOADING SYSTEM...', saving: 'Saving...', errDb: 'Error saving to database.', errUpload: 'Upload error: ' }
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

  const handleFileUpload = async (e: any, m: any, exIdx: number) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileId = `${m.id}-${exIdx}`;
    setUploading(fileId);

    const { data, error } = await supabase.storage.from('videos').upload(`exercicios/${Date.now()}_${file.name}`, file);
    if (error) { setUploading(null); return alert(t.errUpload + error.message); }

    const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(data.path);
    const novosExercicios = [...m.exercicios_json];
    novosExercicios[exIdx] = { ...novosExercicios[exIdx], video: publicUrl };
    setModelos(prev => prev.map(item => item.id === m.id ? { ...item, exercicios_json: novosExercicios } : item));
    setUploading(null);
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center font-black text-[var(--primary)] uppercase tracking-[0.2em]">{t.loading}</main>;

  return (
    <main className="p-6 md:p-12 max-w-3xl mx-auto min-h-screen">
      <h1 className="text-3xl font-black mb-10 tracking-tighter text-[var(--text-primary)]">{t.title}</h1>
      
      <div className="space-y-4">
        {modelos.map((m) => (
          <div key={m.id} className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] shadow-xl overflow-hidden">
            <button onClick={() => setTreinoAberto(treinoAberto === m.id ? null : m.id)} className="w-full p-8 text-left flex justify-between items-center hover:bg-[var(--surface-sec)] transition-all">
              <h2 className="font-black text-[var(--text-primary)]">{m.nome_modelo}</h2>
              <div className="text-[var(--text-secondary)]">{treinoAberto === m.id ? <FaChevronUp /> : <FaChevronDown />}</div>
            </button>
            
            {treinoAberto === m.id && (
              <div className="px-8 pb-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
                {m.exercicios_json?.map((ex: any, idx: number) => (
                  <div key={idx} className="bg-[var(--surface-sec)] p-6 rounded-[1.5rem] border border-[var(--border)]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4 flex items-center gap-2"><FaVideo /> {ex.nome}</p>
                    <div className="flex gap-2">
                      <input className="flex-1 p-4 rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" placeholder="Link do vídeo..." value={ex.video || ''}
                        onChange={(e) => {
                          const novos = [...m.exercicios_json];
                          novos[idx].video = e.target.value;
                          setModelos(prev => prev.map(i => i.id === m.id ? {...i, exercicios_json: novos} : i));
                        }}
                      />
                      <label className={`cursor-pointer px-6 py-4 rounded-[1rem] text-[9px] font-black uppercase tracking-widest flex items-center justify-center ${uploading === `${m.id}-${idx}` ? 'bg-[var(--surface)]' : 'bg-[var(--primary)] text-white'}`}>
                        {uploading === `${m.id}-${idx}` ? <FaSpinner className="animate-spin" /> : <FaCloudUploadAlt />}
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, m, idx)} />
                      </label>
                    </div>
                  </div>
                ))}
                <button onClick={() => salvarTreino(m)} className="w-full bg-[var(--primary)] text-white p-6 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2">
                  <FaSave /> {t.btnSave}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}