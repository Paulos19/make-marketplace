// app/components/ProductCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types'; // Certifique-se que o tipo Product está correto

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Retorna null se não houver um vendedor associado, para evitar cards "quebrados"
  if (!product.user) return null;

  return (
    <Link href={`/products/${product.id}`} className="block group focus-visible:ring-2 focus-visible:ring-zaca-roxo focus-visible:ring-offset-2 rounded-lg" aria-label={`Ver detalhes de ${product.name}`}>
      <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 transform group-hover:scale-[1.03] hover:border-zaca-magenta dark:hover:border-zaca-magenta">
        <CardHeader className="p-0 relative border-b dark:border-slate-700/50">
          <div className="aspect-square w-full relative bg-slate-100 dark:bg-slate-700 rounded-t-lg overflow-hidden">
            <Image
              src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : '/img-placeholder.png'} 
              alt={`Imagem de ${product.name}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
          {/* <<< FLAG DE PROMOÇÃO ADICIONADA AQUI >>> */}
          {product.onPromotion && (
            <Badge
              variant="destructive"
              className="absolute top-2.5 right-2.5 bg-zaca-vermelho hover:bg-zaca-vermelho/90 text-white shadow-md px-2.5 py-1 text-xs font-semibold border-none"
            >
              PROMO!
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex-grow p-4 space-y-1.5">
          <h3 className="text-md font-semibold leading-snug mb-1 truncate text-slate-800 dark:text-slate-100 group-hover:text-zaca-roxo dark:group-hover:text-zaca-lilas transition-colors">
            {product.name}
          </h3>
          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.categories.slice(0, 2).map(category => (
                <Badge key={category.id} variant="secondary" className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{category.name}</Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-2 border-t dark:border-slate-700/50 mt-auto bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            {/* <<< LÓGICA DE PREÇO PROMOCIONAL ADICIONADA AQUI >>> */}
            {product.onPromotion && product.originalPrice && product.originalPrice > product.price && (
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