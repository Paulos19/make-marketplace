import prisma from '@/lib/prisma';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { ProductCard } from '@/app/products/components/ProductCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wrench } from 'lucide-react';

// Função para buscar apenas serviços
async function getServices() {
    const services = await prisma.product.findMany({
        where: {
            isService: true, // Filtra apenas os itens marcados como serviço
            isSold: false,
            isReserved: false,
        },
        include: {
            user: true, 
            category: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Transforma os dados para o formato que o ProductCard espera
    return services.map(service => ({
        ...service,
        categories: service.category ? [service.category] : [],
    }));
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
              Serviços Manuais na Praça
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Encontre os melhores profissionais e serviços da região, de manicure a aulas particulares!
            </p>
          </header>

          {services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <ProductCard key={service.id} product={service as any} />
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
                <Alert className="max-w-md bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50">
                    <Wrench className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <AlertTitle className="font-bold text-yellow-800 dark:text-yellow-300">Ops, nenhum serviço por aqui!</AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                        Ainda não há serviços cadastrados. Volte em breve!
                    </AlertDescription>
                </Alert>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
