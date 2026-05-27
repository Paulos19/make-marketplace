'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Icon, type IconName } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { motion, Variants } from 'framer-motion'

interface CategoryData {
  id: string
  name: string
  _count: {
    products: number
  }
}

interface CategoriesClientGridProps {
  categories: CategoryData[]
}

const categoryIcons: Record<string, IconName> = {
  'Moda': 'shirt',
  'Tecnologia': 'smartphone',
  'Casa': 'home',
  'Beleza': 'sparkles',
  'Infantil': 'baby',
  'Esportes': 'dumbbell',
  'default': 'shapes',
}

const getCategoryIcon = (categoryName: string): IconName => {
  for (const key in categoryIcons) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) {
      return categoryIcons[key]
    }
  }
  return categoryIcons['default']
}

const bgColors = [
  "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
  "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
  "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300",
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

export function CategoriesClientGrid({ categories }: CategoriesClientGridProps) {
  return (
    <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
    >
      {categories.map((category, index) => (
        <motion.div key={category.id} variants={itemVariants}>
          <Link href={`/categories/${category.id}`} className="group block outline-none h-full">
            <Card className={cn(
                "overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-none rounded-[2rem] h-full shadow-sm relative",
                bgColors[index % bgColors.length]
            )}>
              <CardContent className="flex flex-col items-center justify-center p-6 md:p-8 text-center h-full">
                
                {/* Ícone Gigante em Fundo de Marca d'Água */}
                <div className="absolute -right-4 -bottom-4 opacity-10 transition-transform duration-700 group-hover:scale-150 group-hover:rotate-12">
                   <Icon name={getCategoryIcon(category.name)} className="h-32 w-32" />
                </div>

                <div className="mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 relative z-10">
                  <Icon name={getCategoryIcon(category.name)} className="h-10 w-10 md:h-14 md:w-14 opacity-90" />
                </div>
                
                <span className="font-black text-lg md:text-xl leading-tight tracking-tight relative z-10 mb-3">
                    {category.name}
                </span>

                <Badge variant="secondary" className="relative z-10 bg-white/50 dark:bg-black/20 text-current border-none font-bold">
                    {category._count.products} {category._count.products === 1 ? 'item' : 'itens'}
                </Badge>

              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
