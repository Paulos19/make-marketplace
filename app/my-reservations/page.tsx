import Navbar from '../components/layout/Navbar';
import { MyReservationsClient } from './components/MyReservationsClient';

export default function MyReservationsPage() {
  return (
    <>
    <Navbar/>
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Minhas Reservas</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Acompanhe seus achadinhos e solicitações de reservas. Tá guardadinho, viu?!
        </p>
      </div>
      <MyReservationsClient />
    </div>
    </>
  );
}