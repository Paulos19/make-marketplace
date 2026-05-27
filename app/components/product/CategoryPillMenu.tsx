'use client'

import { Category } from '@prisma/client'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface CategoryPillMenuProps {
  categories: Category[]
}

export function CategoryPillMenu({ categories }: CategoryPillMenuProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentCategoryId = searchParams.get('category')

  return (
    <div className="w-full overflow-x-auto pb-4 pt-2 hide-scrollbar">
      <div className="flex items-center gap-2 md:gap-4 min-w-max">
        <Link 
            href={pathname} 
            className={cn(
                "px-6 py-3 rounded-full font-bold text-sm transition-all duration-300",
                !currentCategoryId 
                    ? "bg-foreground text-background shadow-md scale-105" 
                    : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
        >
            TODOS
        </Link>
        
        {categories.map((category) => {
            const isActive = currentCategoryId === category.id;
            return (
                <Link 
                    key={category.id} 
                    href={`${pathname}?category=${category.id}`} 
                    className={cn(
                        "px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 uppercase tracking-wider",
                        isActive 
                            ? "bg-foreground text-background shadow-md scale-105" 
                            : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                >
                    {category.name}
                </Link>
            )
        })}
      </div>
    </div>
  )
}
