'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaFilePdf, FaTrash, FaCloudUploadAlt } from 'react-icons/fa';

export default function ArquivosAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Carrega os arquivos do banco de dados
  const carregarArquivos = async () => {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('aluno_id', id)
      .order('created_at', { ascending: false });

    if (!error) setArquivos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    carregarArquivos();
  }, [id]);


  // Na página do Aluno, antes do useEffect:
useEffect(() => {
  const verificar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log("ID do Usuário Logado:", user?.id);
    console.log("ID que estou tentando buscar:", id); // ID vindo da URL
  };
  verificar();
}, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${id}/${Math.random()}.${fileExt}`;

    try {
      // 1. Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos-alunos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Salvar referência no banco
      const { error: dbError } = await supabase.from('documentos').insert({
        aluno_id: id,
        url: filePath,
        nome_arquivo: file.name
      });

      if (dbError) throw dbError;

      alert("Arquivo enviado com sucesso!");
      carregarArquivos();
    } catch (err: any) {
      alert("Erro ao enviar: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deletarArquivo = async (fileId: string, url: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;

    try {
      await supabase.storage.from('documentos-alunos').remove([url]);
      await supabase.from('documentos').delete().eq('id', fileId);
      carregarArquivos();
    } catch (err) {
      alert("Erro ao excluir arquivo.");
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 md:p-12 min-h-screen bg-gray-50/50">
      <button onClick={() => router.back()} className="text-sm font-bold text-gray-400 mb-8 hover:text-black">← Voltar</button>
      
      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tighter">Documentos</h1>
        <p className="text-gray-500 font-bold">Gerencie exames, atestados e documentos.</p>
      </header>

      {/* Área de Upload */}
      <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 text-center mb-10">
        <FaCloudUploadAlt className="mx-auto text-4xl text-gray-300 mb-4" />
        <label className="cursor-pointer bg-black text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-gray-800 transition-all">
          {uploading ? 'Enviando...' : 'Selecionar PDF'}
          <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {/* Lista de Arquivos */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-400">Carregando...</p>
        ) : arquivos.length === 0 ? (
          <p className="text-center text-gray-400">Nenhum arquivo enviado ainda.</p>
        ) : (
          arquivos.map((arq) => (
            <div key={arq.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <FaFilePdf className="text-red-500 text-2xl" />
                <span className="font-bold text-gray-700">{arq.nome_arquivo}</span>
              </div>
              <button 
  onClick={() => {
    const { data } = supabase.storage.from('documentos-alunos').getPublicUrl(arq.url);
    console.log("URL gerada:", data.publicUrl); // <--- ABRA O CONSOLE E VEJA O QUE APARECE
    window.open(data.publicUrl, '_blank');
  }}
  className="text-blue-600 font-bold text-sm hover:underline"
>
  Abrir
</button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}