import prisma from '@/lib/prisma'
import { SellerCard } from './components/SellerCard'
import { PackageOpen } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default async function SellersPage() {
  const sellers = await prisma.user.findMany({
    where: {
      role: 'SELLER',
      showInSellersPage: true,
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
    <>
    <Navbar/>
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Nossos Vendedores
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Conheça os vendedores incríveis que fazem parte da nossa comunidade.
        </p>
      </div>

      {sellersWithRating.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sellersWithRating.map(seller => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Nenhum vendedor encontrado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Volte em breve para conhecer nossos vendedores.
            </p>
        </div>
      )}
    </div>
    <Footer/>
    </>
  )
}
