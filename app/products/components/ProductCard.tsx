import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface UserInfo { id: string; name?: string | null; whatsappLink?: string | null; }
interface Category { id: string; name: string; }
interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  onPromotion?: boolean | null;
  images: string[];
  user: UserInfo;
  createdAt: string;
  categories: Category[];
}

const ProductCard = ({ product }: { product: Product }) => (
  <Link href={`/products/${product.id}`} className="block group rounded-lg overflow-hidden focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2" aria-label={`Ver detalhes de ${product.name}`}>
    <Card className="h-full flex flex-col transition-all duration-300 ease-in-out group-hover:shadow-xl dark:bg-gray-800/70 dark:border-gray-700/80 dark:group-hover:border-sky-600/70 transform group-hover:scale-[1.02]">
      <CardHeader className="p-0 relative overflow-hidden">
        <div className="aspect-[4/3] w-full relative">
          <Image 
            src={product.images && product.images.length > 0 ? product.images[0] : '/img-placeholder.png'}
            alt={`Imagem de ${product.name}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={false}
          />
        </div>
        {product.onPromotion && (
          <Badge 
            variant="destructive" 
            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white shadow-md px-2.5 py-1 text-xs font-semibold"
          >
            PROMOÇÃO!
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow p-4 space-y-2">
        <CardTitle className="text-lg font-semibold leading-tight mb-1 truncate text-gray-800 dark:text-gray-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          {product.name}
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 h-10 overflow-hidden text-ellipsis line-clamp-2">
          {product.description || 'Descubra mais sobre este produto incrível.'}
        </p>
        {product.categories && product.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {/* <<< CORREÇÃO APLICADA AQUI >>> */}
            {product.categories.slice(0, 3).map(category => (
              <Badge key={category.id} variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">{category.name}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-1 border-t dark:border-gray-700/50 mt-auto">
        <div className="w-full">
          {product.onPromotion && product.originalPrice && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
              R$ {product.originalPrice.toFixed(2)}
            </p>
          )}
          <p className={`font-bold text-xl ${product.onPromotion ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-gray-50'}`}>
            R$ {product.price.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            Vendido por: <span className="font-medium">{product.user?.name || 'MakeStore'}</span>
          </p>
        </div>
      </CardFooter>
    </Card>
  </Link>
);

const ProductCardSkeleton = () => (
  <Card className="h-full flex flex-col dark:bg-gray-800/70 dark:border-gray-700/80">
    <CardHeader className="p-0 mb-4 relative">
      <Skeleton className="w-full aspect-[4/3] rounded-t-lg" />
    </CardHeader>
    <CardContent className="flex-grow px-4 pb-2 space-y-3">
      <Skeleton className="h-5 w-3/4 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-5/6 rounded" />
      <div className="flex gap-2 mt-1">
        <Skeleton className="h-5 w-1/4 rounded-full" />
        <Skeleton className="h-5 w-1/4 rounded-full" />
      </div>
    </CardContent>
    <CardFooter className="px-4 pb-4 pt-0 mt-auto">
      <div className="w-full space-y-1">
        <Skeleton className="h-4 w-1/4 rounded" />
        <Skeleton className="h-7 w-1/3 rounded" />
      </div>
    </CardFooter>
  </Card>
);

export { ProductCard, ProductCardSkeleton };
