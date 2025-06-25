import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import prisma from '@/lib/prisma';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Badge } from '@/components/ui/badge';

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


export default async function CategoriesPage() {
    // Busca as categorias e inclui a contagem de produtos em cada uma
    const categoriesWithCount = await prisma.category.findMany({
        include: {
            _count: {
                select: { products: true },
            },
        },
        orderBy: { name: 'asc' },
    });

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-12 sm:py-16">
                    <header className="text-center mb-12">
                         <h1 className="text-4xl md:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
                            Todas as Categorias
                        </h1>
                        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Explore todos os cantos do Zacaplace. O achadinho que você procura está aqui!
                        </p>
                    </header>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                         {categoriesWithCount.map((category) => (
                            <Link key={category.id} href={`/categories/${category.id}`} className="group block">
                                <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                                <CardContent className="flex flex-col items-center justify-center p-4 text-center h-full">
                                    <div className="p-4 bg-primary/10 rounded-full mb-3 transition-colors duration-300 group-hover:bg-primary/20">
                                        <Icon name={getCategoryIcon(category.name)} className="h-8 w-8 text-primary" />
                                    </div>
                                    <span className="font-semibold text-sm text-center text-foreground">{category.name}</span>
                                    <Badge variant="secondary" className="mt-2">
                                        {category._count.products} {category._count.products === 1 ? 'item' : 'itens'}
                                    </Badge>
                                </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
