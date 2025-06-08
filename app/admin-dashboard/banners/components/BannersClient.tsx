'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { HomePageBanner } from '@prisma/client';
import Image from 'next/image';
import { BannerForm } from './BannerForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

export function BannersClient() {
  const [banners, setBanners] = useState<HomePageBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    try {
      const { data } = await axios.get<HomePageBanner[]>('/api/admin/banners');
      setBanners(data);
    } catch (error) {
      toast.error('Falha ao carregar os banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Tem a certeza que deseja apagar este banner?')) return;
    try {
        await axios.delete(`/api/admin/banners/${bannerId}`);
        toast.success('Banner apagado com sucesso.');
        fetchBanners(); // Recarrega a lista
    } catch (error) {
        toast.error('Falha ao apagar o banner.');
    }
  }

  return (
    <div className="space-y-8">
      <BannerForm onSuccess={fetchBanners} />

      <Card>
        <CardHeader>
          <CardTitle>Banners Existentes</CardTitle>
          <CardDescription>Lista de todos os banners atualmente na plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>A carregar...</p>
          ) : (
            <div className="space-y-4">
              {banners.length === 0 && <p>Nenhum banner encontrado.</p>}
              {banners.map((banner) => (
                <div key={banner.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      width={150}
                      height={75}
                      className="rounded-md object-cover bg-muted"
                    />
                    <div>
                      <p className="font-semibold">{banner.title}</p>
                      <p className="text-sm text-muted-foreground">{banner.linkUrl || 'Sem link'}</p>
                    </div>
                  </div>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(banner.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}