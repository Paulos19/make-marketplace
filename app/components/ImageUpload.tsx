"use client";

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '@/lib/firebase'; // Sua configuração do Firebase
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { UploadCloud, X, Image as ImageIcon, Trash2 } from 'lucide-react';

const storage = getStorage(app);

export interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  storagePath?: string; // Caminho base no Firebase Storage, ex: 'product_images/'
  userId?: string; // Para criar subpastas por usuário, se necessário
  currentFiles?: string[]; // URLs das imagens já existentes
  onRemoveFile?: (url: string) => void; // Função para notificar a remoção de um arquivo existente
  // Se onRemoveFile for fornecido, o componente tentará excluir do Firebase.
  // Se não, apenas notificará o componente pai para lidar com a remoção da URL da lista.
}

export default function ImageUpload({
  onUploadComplete,
  maxFiles = 1,
  storagePath = 'uploads/',
  userId,
  currentFiles = [],
  onRemoveFile,
}: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(currentFiles);

  useEffect(() => {
    // Sincroniza o estado interno de URLs com as props, caso elas mudem externamente
    setUploadedUrls(currentFiles);
  }, [currentFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.slice(0, maxFiles - uploadedUrls.length - files.length);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, [maxFiles, uploadedUrls.length, files.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: maxFiles - uploadedUrls.length,
    disabled: uploading || uploadedUrls.length >= maxFiles,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress({});
    const urls: string[] = [];

    for (const file of files) {
      const uniqueFileName = `${Date.now()}-${file.name}`;
      const fullStoragePath = userId ? `${storagePath}${userId}/${uniqueFileName}` : `${storagePath}${uniqueFileName}`;
      const storageRef = ref(storage, fullStoragePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(prev => ({ ...prev, [file.name]: prog }));
        },
        (error) => {
          console.error("Erro no upload: ", error);
          toast.error(`Falha no upload de ${file.name}: ${error.message}`);
          // Considerar remover o arquivo da lista 'files' se o upload falhar
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            urls.push(downloadURL);
            setUploadedUrls(prev => [...prev, downloadURL]);
            if (urls.length === files.length) {
              onUploadComplete(urls); // Chama o callback quando todos os arquivos selecionados forem carregados
              setFiles([]); // Limpa os arquivos selecionados após o upload
              setUploading(false);
              toast.success(`${urls.length} imagem(ns) enviada(s) com sucesso!`);
            }
          } catch (error) {
            console.error("Erro ao obter URL de download: ", error);
            toast.error(`Falha ao obter URL para ${file.name}`);
          }
        }
      );
    }
  };

  const removeFileFromSelection = (fileName: string) => {
    setFiles(files.filter(f => f.name !== fileName));
  };

  const handleRemoveExistingFile = async (urlToRemove: string) => {
    if (onRemoveFile) {
      onRemoveFile(urlToRemove); // Notifica o componente pai primeiro
    }
    setUploadedUrls(prev => prev.filter(url => url !== urlToRemove));

    // Opcional: Tentar deletar do Firebase Storage
    // Isso só deve ser feito se o componente pai confirmar a remoção do banco de dados primeiro,
    // ou se a lógica de remoção for gerenciada aqui.
    // Por simplicidade, vamos assumir que o pai lida com a exclusão do DB e nos notifica.
    // Se você quiser que este componente delete do Firebase:
    /*
    if (onRemoveFile) { // ou uma prop específica como `deleteFromFirebase`
      try {
        const fileRef = ref(storage, urlToRemove); // Isso assume que a URL é a URL de download do Firebase
        await deleteObject(fileRef);
        toast.success("Imagem removida do armazenamento.");
      } catch (error: any) {
        console.error("Erro ao remover imagem do Firebase: ", error);
        // Se falhar, talvez adicionar a URL de volta ou notificar o usuário
        // toast.error("Falha ao remover imagem do armazenamento: " + error.message);
      }
    }
    */
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-md cursor-pointer text-center transition-colors
          ${isDragActive ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
          ${(uploading || uploadedUrls.length >= maxFiles) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        {isDragActive ? (
          <p className="text-sky-600 dark:text-sky-400">Solte as imagens aqui...</p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Arraste e solte {maxFiles - uploadedUrls.length > 1 ? `${maxFiles - uploadedUrls.length} imagens` : 'uma imagem'} aqui, ou clique para selecionar.
            ({maxFiles - uploadedUrls.length} restante(s))
          </p>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Arquivos selecionados:</h4>
          {files.map(file => (
            <div key={file.name} className="flex items-center justify-between p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
              <span className="text-sm truncate text-gray-600 dark:text-gray-400" title={file.name}>{file.name}</span>
              {progress[file.name] !== undefined && progress[file.name] < 100 && (
                <Progress value={progress[file.name]} className="w-1/2 mx-2 h-2" />
              )}
              {progress[file.name] === 100 && <span className="text-xs text-green-500">Concluído</span>}
              {!uploading && (
                <Button variant="ghost" size="icon" onClick={() => removeFileFromSelection(file.name)} className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button onClick={handleUpload} disabled={uploading || files.length === 0} className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700">
            {uploading ? 'Enviando...' : `Enviar ${files.length} Arquivo(s)`}
          </Button>
        </div>
      )}

      {uploadedUrls.length > 0 && (
        <div className="space-y-2 pt-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Imagens Carregadas:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {uploadedUrls.map((url, index) => (
              <div key={url || index} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`Imagem carregada ${index + 1}`}
                  className="rounded-md object-cover w-full h-full shadow-md"
                />
                {!uploading && onRemoveFile && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-7 w-7 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-red-600/80 border-none"
                    onClick={() => handleRemoveExistingFile(url)}
                    title="Remover imagem"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
