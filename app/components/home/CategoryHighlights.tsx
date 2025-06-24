import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import type { Category } from '@prisma/client';

interface CategoryHighlightsProps {
  categories: Category[];
}

// Mapeamento de ícones para categorias específicas para dar um toque visual
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


export function CategoryHighlights({ categories }: CategoryHighlightsProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Navegue por Categorias</h2>
        <p className="text-muted-foreground mt-1">Encontre exatamente o que você procura.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/products?category=${category.id}`} className="group block">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-3 transition-colors duration-300 group-hover:bg-primary/20">
                   <Icon name={getCategoryIcon(category.name)} className="h-8 w-8 text-primary" />
                </div>
                <span className="font-semibold text-sm text-center text-foreground">{category.name}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
