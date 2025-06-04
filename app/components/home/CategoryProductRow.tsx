"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowRight } from 'lucide-react';
// Usaremos o AchadinhoCardMini que definimos anteriormente no AchadinhosDoZacaBanner
// Se você o moveu para um local compartilhado, ajuste o import.
// Por enquanto, vou assumir que podemos redefinir uma versão dele aqui ou importá-lo.

// --- Reutilizando/Adaptando AchadinhoCardMini ---
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MessageSquareText, User as UserIcon } from 'lucide-react';

interface UserInfo {
  id: string;
  name?: string | null;
  whatsappLink?: string | null;
}
interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrls: string[];
  user: UserInfo;
  originalPrice?: number | null;
  onPromotion?: boolean;
  categories?: { id: string; name: string }[]; // Adicionado para o card saber a categoria se necessário
}

// Card para o carrossel de categorias
const CategoryProductCard = ({ product }: { product: Product }) => (
  <Card className="group relative flex flex-col h-full overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
    <Link href={`/products/${product.id}`} className="block aspect-video w-full relative" aria-label={product.name}>
      <Image
        src={product.imageUrls[0] || '/img-placeholder.png'}
        alt={product.name}
        fill
        className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      />
      {product.onPromotion && (
        <div className="absolute top-2 right-2 bg-zaca-vermelho text-white text-xs font-semibold px-2 py-0.5 rounded-sm shadow-md">
          OFERTA!
        </div>
      )}
    </Link>
    <CardContent className="p-2.5 flex-grow">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 truncate group-hover:text-zaca-roxo transition-colors">
        <Link href={`/products/${product.id}`}>{product.name}</Link>
      </h4>
      <div>
        {product.onPromotion && product.originalPrice && (
          <span className="text-xs text-slate-500 dark:text-slate-400 line-through mr-1.5">
            R$ {product.originalPrice.toFixed(2)}
          </span>
        )}
        <span className={`text-sm font-bold ${product.onPromotion ? 'text-zaca-vermelho' : 'text-slate-900 dark:text-slate-50'}`}>
          R$ {product.price.toFixed(2)}
        </span>
      </div>
    </CardContent>
    <CardFooter className="p-2.5 border-t dark:border-slate-700/50 mt-auto">
        <Button asChild variant="outline" size="sm" className="w-full text-xs border-btn-ver-perfil text-btn-ver-perfil hover:bg-btn-ver-perfil-bg-hover hover:text-btn-ver-perfil-hover-text">
            <Link href={`/products/${product.id}`}>
                 Ver Detalhes
            </Link>
        </Button>
    </CardFooter>
  </Card>
);
// --- Fim do Card ---


interface CategoryProductRowProps {
  category: {
    id: string;
    name: string;
  };
  products: Product[];
  animationDelay?: number;
}

const fadeInUp = { // Pode ser importado de um arquivo de variantes global
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function CategoryProductRow({ category, products, animationDelay = 0 }: CategoryProductRowProps) {
  if (!products || products.length === 0) {
    return null; // Não renderiza nada se não houver produtos para esta categoria
  }

  // Adapta o nome da categoria para um tom "Zaca"
  const zacaCategoryName = () => {
    if (category.name.toLowerCase().includes("maquiagem")) return `Maquiagens de Arrasar do Zaca`;
    if (category.name.toLowerCase().includes("pele")) return `Cuidados 'Zacariais' com a Pele`;
    if (category.name.toLowerCase().includes("cabelo")) return `Cabeleira do Zezé (e do Zaca!)`;
    // Adicione mais adaptações conforme suas categorias
    return `O Zaca Recomenda: ${category.name}`;
  };

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible" // Anima quando entra na viewport
      viewport={{ once: true, amount: 0.1 }} // Configurações da viewport
      transition={{ delay: animationDelay }}
      className="py-8 md:py-10" // Espaçamento vertical para cada linha
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-5 md:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bangers text-zaca-roxo dark:text-zaca-lilas tracking-wide">
            {zacaCategoryName()}
          </h2>
          <Button variant="ghost" asChild size="sm" className="text-zaca-azul dark:text-zaca-azul hover:text-zaca-magenta dark:hover:text-zaca-magenta">
            {/* Idealmente, o link da categoria deve ser um slug ou ID.
                Se você tiver uma página de categoria, use o link correto.
                Ex: /categories/${category.id} ou /products?category=${category.id} */}
            <Link href={`/products?category=${category.id}`}> 
              Ver Tudo <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {products.length > 0 ? (
            <Carousel
                opts={{
                align: "start",
                slidesToScroll: 'auto', // Permite scroll mais natural
                containScroll: 'trimSnaps' // Evita scroll excessivo no final
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2.5 md:-ml-4">
                {products.map((product) => (
                    <CarouselItem 
                        key={product.id} 
                        className="pl-2.5 md:pl-4 basis-[55%] xs:basis-[48%] sm:basis-[35%] md:basis-[28%] lg:basis-[23%] xl:basis-[19%]" // Ajuste de 'basis' para diferentes telas
                    >
                    <CategoryProductCard product={product} />
                    </CarouselItem>
                ))}
                </CarouselContent>
                {/* Mostrar setas apenas se houver mais itens do que o visível (ex: > 4 ou 5 itens) */}
                {products.length > 4 && <CarouselPrevious className="hidden sm:flex text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 shadow-md" />}
                {products.length > 4 && <CarouselNext className="hidden sm:flex text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 shadow-md" />}
            </Carousel>
        ) : (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                O Zaca ainda está procurando os melhores achadinhos para esta categoria. Volte em breve, psit!
            </p>
        )}
      </div>
    </motion.section>
  );
}