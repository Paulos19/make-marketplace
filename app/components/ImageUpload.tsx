'use client';

import { useState } from 'react';
import { UploadDropzone } from '@/lib/uploadthing';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  storagePath?: string;
  userId?: string;
  currentFiles?: string[];
  onRemoveFile?: (url: string) => void;
  /** Endpoint do UploadThing a ser usado. Default: "imageUploader" */
  endpoint?: "imageUploader" | "productImage" | "profileImage" | "bannerImage";
}

export default function ImageUpload({
  onUploadComplete,
  maxFiles = 1,
  currentFiles = [],
  onRemoveFile,
  endpoint = "imageUploader",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const remainingSlots = maxFiles - currentFiles.length;

  const handleRemoveExistingFile = (urlToRemove: string) => {
    if (onRemoveFile) {
      onRemoveFile(urlToRemove);
    }
  };

  return (
    <div className="space-y-4">
      {remainingSlots > 0 && (
        <UploadDropzone
          endpoint={endpoint}
          config={{ mode: "auto" }}
          onUploadBegin={() => {
            setIsUploading(true);
          }}
          onClientUploadComplete={(res) => {
            setIsUploading(false);
            if (res) {
              const urls = res.map((file) => file.ufsUrl);
              onUploadComplete(urls);
              toast.success(`${urls.length} imagem(ns) enviada(s)!`);
            }
          }}
          onUploadError={(error: Error) => {
            setIsUploading(false);
            toast.error(`Falha no upload: ${error.message}`);
          }}
          appearance={{
            container:
              "border-2 border-dashed border-border rounded-lg p-6 cursor-pointer transition-colors hover:border-primary/50 ut-uploading:border-primary",
            label: "text-sm text-muted-foreground",
            allowedContent: "text-xs text-muted-foreground/70",
            button:
              "bg-primary text-primary-foreground hover:bg-primary/90 ut-uploading:bg-primary/70 rounded-md px-4 py-2 text-sm font-medium",
            uploadIcon: "text-muted-foreground/50 w-12 h-12",
          }}
          content={{
            label: () =>
              isUploading
                ? "Enviando..."
                : `Arraste e solte ou clique para selecionar. (${remainingSlots} restante(s))`,
            allowedContent: () => "Imagens até 8MB (JPG, PNG, GIF, WebP)",
          }}
        />
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
