import { BannersClient } from './components/BannersClient';

export default function AdminBannersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestão de Banners</h1>
        <p className="text-muted-foreground">
          Crie e gira os banners que aparecem na página inicial.
        </p>
      </div>
      <BannersClient />
    </div>
  );
}