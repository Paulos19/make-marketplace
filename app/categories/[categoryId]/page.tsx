import prisma from '@/lib/prisma';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { ProductCard } from '@/app/products/components/ProductCard';
import { notFound } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PackageSearch } from 'lucide-react';

interface CategoryPageProps {
  params: {
    categoryId: string;
  };
}

const transformProductForClient = (product: any) => {
    return {
      ...product,
      categories: product.category ? [product.category] : [],
      createdAt: new Date(product.createdAt).toISOString(),
      updatedAt: new Date(product.updatedAt).toISOString(),
    };
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryId } = params;

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      products: {
        where: {
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
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
              Categoria: {category.name}
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Explore todos os achadinhos incríveis que temos em "{category.name}".
            </p>
          </header>

          {category.products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {category.products.map((product) => (
                <ProductCard key={product.id} product={transformProductForClient(product)} />
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
                <Alert className="max-w-md bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50">
                    <PackageSearch className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <AlertTitle className="font-bold text-yellow-800 dark:text-yellow-300">Ops, nenhum achadinho por aqui!</AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                        Ainda não há produtos nesta categoria. Volte em breve!
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
