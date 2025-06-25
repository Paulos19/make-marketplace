'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Edit, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import type { HomePageBanner } from '@prisma/client';
import { BannerForm } from './BannerForm'; // Importa o formulário

interface BannersClientProps {
  initialBanners: HomePageBanner[];
}

export function BannersClient({ initialBanners }: BannersClientProps) {
  const [banners, setBanners] = useState(initialBanners);
  const [isLoading, setIsLoading] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<HomePageBanner | null>(null);
  
  // Estados para o formulário de edição/criação
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomePageBanner | null>(null);

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
      fetchBanners(); // Atualiza a lista
    } catch (error) {
      toast.error('Falha ao excluir o banner.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funções para abrir o formulário
  const handleCreate = () => {
    setEditingBanner(null);
    setIsFormOpen(true);
  };

  const handleEdit = (banner: HomePageBanner) => {
    setEditingBanner(banner);
    setIsFormOpen(true);
  };

  // Função chamada pelo formulário em caso de sucesso
  const handleSuccess = () => {
    setIsFormOpen(false);
    fetchBanners();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Banners</h1>
        <Button onClick={handleCreate}>
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
                <CardDescription>{banner.isActive ? <Badge variant="success">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative w-full">
                  <Image src={banner.imageUrl} alt={banner.title} fill className="rounded-md object-cover" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
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

      {/* Diálogo para Criar/Editar */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <BannerForm initialData={editingBanner} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para Confirmação de Exclusão */}
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
