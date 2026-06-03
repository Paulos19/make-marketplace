import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { cookies } from 'next/headers';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialState = cookieStore.get('zacaplace_state')?.value || '';
  const initialCity = cookieStore.get('zacaplace_city')?.value || '';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar initialState={initialState} initialCity={initialCity} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
