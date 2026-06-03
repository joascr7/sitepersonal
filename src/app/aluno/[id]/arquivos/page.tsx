'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaFilePdf, FaTrash, FaCloudUploadAlt, FaDownload } from 'react-icons/fa';

export default function ArquivosAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const carregarArquivos = async () => {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('aluno_id', id)
      .order('created_at', { ascending: false });

    if (!error) setArquivos(data || []);
    setLoading(false);
  };

  useEffect(() => { carregarArquivos(); }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${id}/${Math.random()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage.from('documentos-alunos').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('documentos').insert({
        aluno_id: id,
        url: filePath,
        nome_arquivo: file.name
      });

      if (dbError) throw dbError;
      alert("Arquivo enviado com sucesso!");
      carregarArquivos();
    } catch (err: any) { alert("Erro ao enviar: " + err.message); } 
    finally { setUploading(false); }
  };

  const deletarArquivo = async (fileId: string, url: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      await supabase.storage.from('documentos-alunos').remove([url]);
      await supabase.from('documentos').delete().eq('id', fileId);
      carregarArquivos();
    } catch (err) { alert("Erro ao excluir arquivo."); }
  };

 return (
    // pt-20: compensa o Header superior (AuraFit), pb-32: reserva o espaço da Navbar inferior
    <main className="w-full min-h-screen bg-black text-white pt-20 px-4 pb-32">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-8 hover:text-white transition-colors">← Voltar</button>
        
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tighter">Documentos</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Gestão de Exames e Atestados</p>
        </header>

        {/* Área de Upload */}
        <div className="bg-neutral-950/80 backdrop-blur-xl p-10 rounded-[2.5rem] border-2 border-dashed border-white/5 text-center mb-10 hover:border-blue-500/50 transition-all duration-300">
          <FaCloudUploadAlt className="mx-auto text-4xl text-neutral-700 mb-4" />
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            {uploading ? 'Enviando...' : 'Selecionar PDF'}
            <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
          </label>
        </div>

        {/* Lista de Arquivos */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-neutral-500 font-bold tracking-widest text-[10px] uppercase">Carregando...</p>
          ) : arquivos.length === 0 ? (
            <p className="text-center text-neutral-700 font-bold tracking-widest text-[10px] uppercase">Nenhum arquivo enviado.</p>
          ) : (
            arquivos.map((arq) => (
              <div key={arq.id} className="flex items-center justify-between p-6 bg-neutral-950/80 backdrop-blur-xl rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <FaFilePdf className="text-blue-500 text-2xl" />
                  <span className="font-bold text-white text-sm truncate max-w-[150px]">{arq.nome_arquivo}</span>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        const { data } = supabase.storage.from('documentos-alunos').getPublicUrl(arq.url);
                        window.open(data.publicUrl, '_blank');
                      }}
                      className="text-blue-400 hover:text-blue-300 transition-all"
                    >
                      <FaDownload className="text-lg" />
                    </button>
                    <button onClick={() => deletarArquivo(arq.id, arq.url)} className="text-red-500 hover:text-red-400 transition-all">
                      <FaTrash className="text-lg" />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ESPAÇADOR DE SEGURANÇA: Garante que o scroll ultrapasse a Navbar inferior */}
        <div className="h-40 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}