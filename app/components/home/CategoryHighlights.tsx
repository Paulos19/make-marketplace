import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import type { Category } from '@prisma/client';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryHighlightsProps {
  categories: Category[];
}

const categoryIcons: Record<string, IconName> = {
  'Moda': 'shirt',
  'Tecnologia': 'smartphone',
  'Casa': 'home',
  'Beleza': 'sparkles',
  'Infantil': 'baby',
  'Esportes': 'dumbbell',
  'default': 'shapes',
};

const getCategoryIcon = (categoryName: string): IconName => {
    for (const key in categoryIcons) {
        if (categoryName.toLowerCase().includes(key.toLowerCase())) {
            return categoryIcons[key];
        }
    }
    return categoryIcons['default'];
};

const bgColors = [
  "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
  "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
  "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300",
];

export function CategoryHighlights({ categories }: CategoryHighlightsProps) {
  const mobileCategories = categories.slice(0, 3);
  const desktopCategories = categories.slice(0, 5);

  return (
    <section className="w-full relative py-12 md:py-16">
      {/* Textura WhatsApp/Doodle Suave */}
      <div 
        className="absolute inset-0 z-0 opacity-5 dark:opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#4c1d95 2px, transparent 2px)',
          backgroundSize: '30px 30px'
        }} 
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-8 md:mb-12 text-center sm:text-left">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">
            Navegue por Categorias
          </h2>
          <p className="text-muted-foreground mt-2 md:text-lg font-medium">
            Encontre exatamente o que você procura.
          </p>
        </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
        {/* Mobile: 3 categorias + Ver Todas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:hidden gap-4 md:gap-6 col-span-2 sm:col-span-4">
          {mobileCategories.map((category, index) => (
            <Link key={category.id} href={`/categories/${category.id}`} className="group block outline-none">
              <Card className={cn(
                  "overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-none rounded-[2rem] h-full shadow-sm",
                  bgColors[index % bgColors.length]
              )}>
                <CardContent className="flex flex-col items-center justify-center p-6 md:p-8 text-center h-full">
                  <div className="mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <Icon name={getCategoryIcon(category.name)} className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                  </div>
                  <span className="font-bold text-lg leading-tight tracking-tight">{category.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
          <Link href="/categories" className="group block outline-none">
            <Card className="overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-2 border-dashed border-foreground/20 hover:border-foreground/40 rounded-[2rem] h-full bg-transparent hover:bg-foreground/5 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center p-6 md:p-8 text-center h-full">
                <div className="mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  <Search className="h-10 w-10 md:h-12 md:w-12 text-foreground opacity-60" />
                </div>
                <span className="font-bold text-lg leading-tight tracking-tight text-foreground/80 group-hover:text-foreground">Ver Todas</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Desktop: 5 categorias + Ver Todas */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-6 col-span-2 sm:col-span-4 lg:col-span-6">
          {desktopCategories.map((category, index) => (
            <Link key={category.id} href={`/categories/${category.id}`} className="group block outline-none">
              <Card className={cn(
                  "overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-none rounded-[2rem] h-full shadow-sm",
                  bgColors[index % bgColors.length]
              )}>
                <CardContent className="flex flex-col items-center justify-center p-6 xl:p-8 text-center h-full">
                  <div className="mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <Icon name={getCategoryIcon(category.name)} className="h-12 w-12 opacity-80" />
                  </div>
                  <span className="font-bold text-lg leading-tight tracking-tight">{category.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
          <Link href="/categories" className="group block outline-none">
            <Card className="overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-2 border-dashed border-foreground/20 hover:border-foreground/40 rounded-[2rem] h-full bg-transparent hover:bg-foreground/5 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center p-6 xl:p-8 text-center h-full">
                <div className="mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  <Search className="h-12 w-12 text-foreground opacity-60" />
                </div>
                <span className="font-bold text-lg leading-tight tracking-tight text-foreground/80 group-hover:text-foreground">Ver Todas</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}
