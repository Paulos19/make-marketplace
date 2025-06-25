import { BannersClient } from './components/BannersClient';
import prisma from '@/lib/prisma';

export default async function AdminBannersPage() {
  const banners = await prisma.homePageBanner.findMany();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestão de Banners</h1>
        <p className="text-muted-foreground">
          Crie e gira os banners que aparecem na página inicial.
        </p>
      </div>
      <BannersClient initialBanners={banners} />
    </div>
  );
}