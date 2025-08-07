import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { ProductScrollArea } from '@/app/components/home/ProductScrollArea';
import { Separator } from '@/components/ui/separator';
import { ProductDetailsClient } from '../components/ProductDetailsClient';

interface ProductPageProps {
  params: {
    productId: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          storeName: true,
          image: true,
          whatsappLink: true,
          // --- CAMPOS ADICIONADOS PARA O VENDEDOR PREMIUM ---
          email: true,
          customRedirectUrl: true,
        },
      },
      category: true,
    },
  });

  if (!product || product.isSold) {
    notFound();
  }

  // --- LÓGICA DE BUSCA CORRIGIDA ---

  // 1. Busca os primeiros dois conjuntos de produtos relacionados
  const [relatedProducts, moreFromSeller] = await Promise.all([
    // Produtos relacionados (da mesma categoria)
    prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
        isSold: false,
        isReserved: false,
      },
      include: {
        user: true,
        category: true,
      },
      take: 10,
    }),
    // Mais produtos do mesmo vendedor
    prisma.product.findMany({
        where: {
            userId: product.userId,
            id: { not: productId },
            isSold: false,
            isReserved: false,
        },
        include: {
            user: true,
            category: true,
        },
        take: 10,
    })
  ]);

  // 2. Coleta os IDs dos produtos já encontrados para excluí-los da próxima busca
  const existingProductIds = [
    product.id,
    ...relatedProducts.map(p => p.id),
    ...moreFromSeller.map(p => p.id)
  ];
  
  // 3. Busca a lista final de produtos sugeridos, evitando duplicatas
  const suggestedProducts = await prisma.product.findMany({
      where: {
          isSold: false,
          isReserved: false,
          NOT: {
              id: { in: existingProductIds }
          }
      },
      include: {
          user: true,
          category: true,
      },
      orderBy: {
          createdAt: 'desc',
      },
      take: 10,
  });


  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow py-8 sm:py-12">
        <div className="container mx-auto px-4">
          
          <ProductDetailsClient product={product as any} />
          
          <Separator className="my-16 sm:my-24" />

          <div className="space-y-16">
            {moreFromSeller.length > 0 && (
                <ProductScrollArea
                    title={`Mais de ${product.user.storeName || product.user.name}`}
                    products={moreFromSeller}
                    href={`/seller/${product.userId}`}
                />
            )}

            {relatedProducts.length > 0 && (
                <ProductScrollArea
                    title="Achadinhos Relacionados"
                    products={relatedProducts}
                    href={`/category/${product.categoryId}`}
                />
            )}

            {suggestedProducts.length > 0 && (
                 <ProductScrollArea
                    title="Você também pode gostar"
                    products={suggestedProducts}
                    href="/products"
                />
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
