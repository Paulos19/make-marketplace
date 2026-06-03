import prisma from '@/lib/prisma'
import { SellerCard } from './components/SellerCard'
import { PackageOpen, Store } from 'lucide-react'
import { cookies } from 'next/headers'

export default async function SellersPage() {
  const cookieStore = await cookies();
  const stateFilter = cookieStore.get('zacaplace_state')?.value || '';
  const cityFilter = cookieStore.get('zacaplace_city')?.value || '';

  const sellerLocationFilter = stateFilter ? {
    state: stateFilter,
    ...(cityFilter ? { city: cityFilter } : {}),
  } : {};

  const sellers = await prisma.user.findMany({
    where: {
      role: 'SELLER',
      showInSellersPage: true,
      ...sellerLocationFilter,
    },
    include: {
      // Inclui as avaliações recebidas para calcular a média
      reviewsReceived: {
        select: {
          rating: true,
        },
      },
    },
  })
  
  // Calcula a média e adiciona ao objeto de cada vendedor
  const sellersWithRating = sellers.map(seller => {
    const totalReviews = seller.reviewsReceived.length;
    const totalRating = seller.reviewsReceived.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    return {
      ...seller,
      averageRating,
      totalReviews
    }
  })

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/30 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-3xl mb-8 backdrop-blur-2xl border border-white/10 shadow-2xl">
              <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl text-white mb-6">
            Nossos Vendedores
          </h1>
          <p className="text-lg text-white/60">
            Descubra as lojas exclusivas e profissionais dedicados a oferecer os melhores produtos no Zacaplace.
          </p>
        </div>

        {sellersWithRating.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sellersWithRating.map(seller => (
              <SellerCard key={seller.id} seller={seller} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
             <PackageOpen className="mx-auto h-20 w-20 text-white/20 mb-6 relative z-10" />
             <h3 className="text-2xl font-bold text-white relative z-10">Nenhum vendedor encontrado</h3>
             <p className="mt-4 text-white/50 relative z-10">
                 Volte em breve para conhecer nossos vendedores parceiros.
             </p>
          </div>
        )}
      </div>
    </div>
  )
}
