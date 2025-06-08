'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '@/lib/firebase';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { UploadCloud, X, Trash2, Loader2 } from 'lucide-react';

const storage = getStorage(app);

// A interface já estava correta, usando currentFiles
export interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  storagePath?: string;
  userId?: string;
  currentFiles?: string[];
  onRemoveFile?: (url: string) => void;
}

export default function ImageUpload({
  onUploadComplete,
  maxFiles = 1,
  storagePath = 'uploads/',
  userId,
  // CORREÇÃO: Usar 'currentFiles' e definir um valor padrão como []
  currentFiles = [], 
  onRemoveFile,
}: ImageUploadProps) {
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Calcula quantos uploads ainda são permitidos
    const remainingSlots = maxFiles - currentFiles.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);
    setFilesToUpload(prev => [...prev, ...filesToAdd]);
  }, [maxFiles, currentFiles.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: maxFiles - currentFiles.length,
    disabled: isUploading || currentFiles.length >= maxFiles,
  });

  const handleUpload = async () => {
    if (filesToUpload.length === 0) return;
    setIsUploading(true);
    setProgress({});
    
    const uploadPromises = filesToUpload.map(file => {
      return new Promise<string>((resolve, reject) => {
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
            toast.error(`Falha no upload de ${file.name}`);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    });

    try {
        const uploadedUrls = await Promise.all(uploadPromises);
        onUploadComplete(uploadedUrls);
        setFilesToUpload([]); // Limpa a fila de upload
        toast.success(`${uploadedUrls.length} imagem(ns) enviada(s)!`);
    } catch (error) {
        toast.error("Alguns uploads falharam. Tente novamente.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleRemoveExistingFile = (urlToRemove: string) => {
    if (onRemoveFile) {
      onRemoveFile(urlToRemove);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-md cursor-pointer text-center transition-colors ${isDragActive ? 'border-sky-500' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Arraste e solte ou clique para selecionar. ({maxFiles - currentFiles.length} restante(s))</p>
      </div>

      {filesToUpload.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Fila de Upload:</h4>
          {filesToUpload.map(file => (
            <div key={file.name} className="flex items-center justify-between p-2 border rounded-md">
              <span className="text-sm truncate">{file.name}</span>
              {progress[file.name] && <Progress value={progress[file.name]} className="w-1/2 mx-2 h-2" />}
            </div>
          ))}
          <Button onClick={handleUpload} disabled={isUploading || filesToUpload.length === 0} className="w-full">
            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : `Enviar ${filesToUpload.length} Arquivo(s)`}
          </Button>
        </div>
      )}

      {currentFiles.length > 0 && (
        <div className="space-y-2 pt-4">
          <h4 className="font-medium">Imagens Carregadas:</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {currentFiles.map((url) => (
              <div key={url} className="relative group aspect-square">
                <img src={url} alt="Imagem carregada" className="rounded-md object-cover w-full h-full" />
                {onRemoveFile && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={() => handleRemoveExistingFile(url)}
                  >
                    <Trash2 className="h-4 w-4" />
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
