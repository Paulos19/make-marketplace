import prisma from '@/lib/prisma'
import { CategoriesClientGrid } from './CategoriesClientGrid'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'

export default async function CategoriesPage() {
    // Busca as categorias e inclui a contagem de produtos em cada uma
    const categoriesWithCount = await prisma.category.findMany({
        include: {
            _count: {
                select: { products: true },
            },
        },
        orderBy: { name: 'asc' },
    })

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950/50">
            {/* HEADER PREMIUM */}
            <header className="relative w-full bg-slate-950 py-20 md:py-32 text-center overflow-hidden border-b border-white/10">
                {/* Fundo Estrelado / Textura */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
                
                {/* Efeitos de Luz (Glow) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-zaca-roxo/20 rounded-full blur-[100px] pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10">
                    <Badge variant="outline" className="mb-6 text-indigo-300 border-indigo-400/30 uppercase tracking-widest font-bold px-4 py-1.5 bg-white/5 backdrop-blur-md">
                        <Search className="w-4 h-4 mr-2 inline-block" />
                        Catálogo Completo
                    </Badge>
                    
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6">
                        Explore o Zacaplace
                    </h1>
                    
                    <p className="mt-4 text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
                        Navegue por todas as nossas categorias. O achadinho perfeito ou o serviço ideal estão à sua espera.
                    </p>
                </div>
            </header>

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-16 sm:py-24">
                    <CategoriesClientGrid categories={categoriesWithCount} />
                </div>
            </main>
        </div>
    )
}
