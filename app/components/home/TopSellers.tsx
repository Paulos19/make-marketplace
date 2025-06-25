import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type TopSeller = {
  id: string;
  name: string | null;
  storeName: string | null;
  image: string | null;
  averageRating: number;
  totalReviews: number;
};

interface TopSellersProps {
  sellers: TopSeller[];
}

export function TopSellers({ sellers }: TopSellersProps) {
  if (!sellers || sellers.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
        <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Top 5 Vendedores da Semana</h2>
            <p className="text-muted-foreground mt-1">Os vendedores mais bem avaliados pela nossa comunidade.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {sellers.map((seller, index) => (
                <Link key={seller.id} href={`/seller/${seller.id}`} className="group block">
                    <Card className="overflow-hidden text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative border-2 border-transparent hover:border-amber-400">
                         <Badge variant="secondary" className="absolute top-2 left-2 bg-amber-400 text-amber-900 font-bold border-none z-10">
                            <Award className="h-4 w-4 mr-1.5"/> Top {index + 1}
                        </Badge>
                        <CardContent className="p-6 flex flex-col items-center">
                            <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-800 shadow-lg">
                                <AvatarImage src={seller.image || undefined} alt={seller.storeName || seller.name || 'Vendedor'} />
                                <AvatarFallback className="text-3xl bg-slate-200 dark:bg-slate-700">
                                    {(seller.storeName || seller.name || 'V')[0]}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="mt-4 font-bold text-lg text-foreground truncate w-full">{seller.storeName || seller.name}</h3>
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                <span className="font-bold text-foreground">{seller.averageRating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({seller.totalReviews})</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    </section>
  );
}
