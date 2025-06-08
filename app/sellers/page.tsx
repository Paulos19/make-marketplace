import { SellerCard } from './components/SellerCard'; // Importa o novo card
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { Store, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion'; // Framer Motion é para Client Components, mas podemos usar no layout
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// Tipagem para os dados que a página espera
interface Seller {
  id: string;
  name: string | null;
  image: string | null;
  storeName: string | null;
  whatsappLink: string | null;
  sellerBannerImageUrl: string | null;
  profileDescription: string | null;
}

// Busca os dados no servidor
async function getSellers(): Promise<Seller[]> {
    try {
        const sellers = await prisma.user.findMany({
            where: { role: UserRole.SELLER },
            select: {
                id: true,
                name: true,
                image: true,
                storeName: true,
                whatsappLink: true,
                sellerBannerImageUrl: true,
                profileDescription: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return sellers;
    } catch (error) {
        console.error("Erro ao buscar vendedores na página:", error);
        return [];
    }
}


export default async function SellersPage() {
  const sellers = await getSellers();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <header className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl sm:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
            Nossos Vendedores Parceiros
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Descubra os artesãos e criadores incríveis que fazem parte da comunidade Zacaplace.
          </p>
        </header>

        {sellers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {sellers.map((seller) => (
              <SellerCard key={seller.id} seller={seller} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400 border-2 border-dashed dark:border-slate-700 rounded-xl">
            <Store className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
            <p className="text-xl font-semibold">Nenhum vendedor encontrado!</p>
            <p className="mt-1 text-sm">Ainda estamos a montar a nossa feira. Volte em breve!</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
