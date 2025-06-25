'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import type { HomePageBanner } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BannerForm } from './BannerForm';
import { PlusCircle, Trash2, Edit, Loader2, AlertTriangle, Save } from 'lucide-react';

// Schema para validação dos dados
const formSchema = z.object({
  title: z.string().optional(),
  imageUrl: z.string().url({ message: 'Por favor, suba uma imagem para o banner.' }),
  linkUrl: z.string().url({ message: 'URL inválida. Se não houver link, deixe em branco.' }).optional().or(z.literal('')),
  isActive: z.boolean(),
});

type BannerFormValues = z.infer<typeof formSchema>;

interface BannersClientProps {
  initialBanners: HomePageBanner[];
}

export function BannersClient({ initialBanners }: BannersClientProps) {
  const [banners, setBanners] = useState(initialBanners);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<HomePageBanner | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomePageBanner | null>(null);

  // O estado e a lógica do formulário agora vivem neste componente pai
  const form = useForm<BannerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      imageUrl: '',
      linkUrl: '',
      isActive: true,
    },
  });

  // Efeito para resetar o formulário quando o modal é aberto
  useEffect(() => {
    if (isFormOpen) {
      if (editingBanner) {
        form.reset({
          title: editingBanner.title || '',
          imageUrl: editingBanner.imageUrl,
          linkUrl: editingBanner.linkUrl || '',
          isActive: editingBanner.isActive,
        });
      } else {
        form.reset({
          title: '',
          imageUrl: '',
          linkUrl: '',
          isActive: true,
        });
      }
    }
  }, [editingBanner, isFormOpen, form]);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/banners');
      const data = await response.json();
      setBanners(data);
    } catch (error) {
      toast.error('Falha ao carregar os banners.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    setIsLoading(true);
    try {
      await fetch(`/api/admin/banners/${bannerToDelete.id}`, { method: 'DELETE' });
      toast.success('Banner excluído com sucesso!');
      setBannerToDelete(null);
      fetchBanners();
    } catch (error) {
      toast.error('Falha ao excluir o banner.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenCreate = () => {
    setEditingBanner(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (banner: HomePageBanner) => {
    setEditingBanner(banner);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (values: BannerFormValues) => {
    setIsSubmitting(true);
    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners';
      const method = editingBanner ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`Falha ao ${editingBanner ? 'atualizar' : 'criar'} o banner.`);
      }
      toast.success(`Banner ${editingBanner ? 'atualizado' : 'criado'} com sucesso!`);
      setIsFormOpen(false);
      fetchBanners();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Banners</h1>
        <Button onClick={handleOpenCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo
        </Button>
      </div>
      
      {isLoading ? (
        <p>A carregar banners...</p>
      ) : banners.length === 0 ? (
        <p>Nenhum banner encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardHeader>
                <CardTitle className="truncate">{banner.title}</CardTitle>
                <CardDescription>
                  {banner.isActive ? <Badge variant="success">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative w-full">
                  <Image src={banner.imageUrl} alt={banner.title || 'Banner Image'} fill className="rounded-md object-cover" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(banner)}>
                    <Edit className="mr-2 h-4 w-4"/> Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setBannerToDelete(banner)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo para Criar/Editar com nova estrutura */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{editingBanner ? 'Editar Banner' : 'Adicionar Novo Banner'}</DialogTitle>
            <DialogDescription>{editingBanner ? 'Faça alterações no seu banner existente.' : 'Crie um novo banner para a página inicial.'}</DialogDescription>
          </DialogHeader>
          
          <div className="flex-grow overflow-y-auto px-6">
            <BannerForm form={form} />
          </div>

          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={form.handleSubmit(handleFormSubmit)} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (editingBanner ? <Save className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>)}
              {editingBanner ? 'Salvar Alterações' : 'Criar Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Exclusão (sem alterações) */}
      <Dialog open={!!bannerToDelete} onOpenChange={() => setBannerToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o banner "<strong>{bannerToDelete?.title}</strong>"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setBannerToDelete(null)} disabled={isLoading}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
