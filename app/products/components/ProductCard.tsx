import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product as PrismaProduct, Category as PrismaCategory, User as PrismaUser } from '@prisma/client';

// Tipagem mais robusta para o produto, esperando as relações completas
interface ProductWithDetails extends PrismaProduct {
  user: PrismaUser | null;
  // CORREÇÃO: categories é um array de objetos que devem ter 'id' e 'name'
  categories: { id: string; name: string }[];
}

interface ProductCardProps {
  product: ProductWithDetails;
}

export function ProductCard({ product }: ProductCardProps) {
  if (!product || !product.user) {
    return null;
  }

  const firstImage = (product.images && product.images.length > 0) 
    ? product.images[0] 
    : 'https://placehold.co/600x600/EEE/31343C?text=Zaca';

  return (
    <Link href={`/products/${product.id}`} className="block group h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zaca-roxo rounded-lg">
      <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 transform group-hover:scale-[1.03] hover:border-zaca-magenta dark:hover:border-zaca-magenta">
        <CardHeader className="p-0 relative border-b dark:border-slate-700/50">
          <div className="aspect-square w-full relative bg-slate-100 dark:bg-slate-700">
            <Image
              src={firstImage} 
              alt={`Imagem de ${product.name}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>
          {product.onPromotion && (
            <Badge
              variant="destructive"
              className="absolute top-2.5 right-2.5 bg-zaca-vermelho text-white shadow-md px-2.5 py-1 text-xs font-semibold"
            >
              PROMO!
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex-grow p-4 space-y-1.5">
          <h3 className="text-md font-semibold leading-snug mb-1 truncate text-slate-800 dark:text-slate-100 group-hover:text-zaca-roxo dark:group-hover:text-zaca-lilas">
            {product.name}
          </h3>
          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {/* CORREÇÃO APLICADA AQUI: Usando category.id como a chave (key) */}
              {product.categories.slice(0, 2).map(category => (
                <Badge key={category.id} variant="secondary" className="text-xs">{category.name}</Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-2 border-t dark:border-slate-700/50 mt-auto bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            {product.onPromotion && product.originalPrice && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-through">
                R$ {product.originalPrice.toFixed(2)}
              </p>
            )}
            <p className={`font-bold text-lg ${product.onPromotion ? 'text-zaca-vermelho' : 'text-slate-900 dark:text-slate-50'}`}>
              R$ {product.price.toFixed(2)}
            </p>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
