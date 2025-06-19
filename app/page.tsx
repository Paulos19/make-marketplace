import { Icon, type IconName } from '@/components/ui/icon'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import prisma from '@/lib/prisma'
import {
  Prisma,
  Category,
  HomePageBanner,
  HomepageSection,
} from '@prisma/client'
import { ShieldCheck, Package, BadgePercent, Sparkles, Shirt, Home, Gift, Cpu, Baby, HeartPulse } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { HeroCarousel } from './components/home/HeroCarousel'
import { ProductScrollArea } from './components/home/ProductScrollArea'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

// --- Mapeamentos de Ícones ---
const categoryIcons: Record<string, IconName> = {
  'Beleza & Cuidados': 'sparkles',
  'Moda & Estilo': 'shirt',
  'Casa & Decoração': 'home',
  'Presentes & Criativos': 'gift',
  'Tecnologia & Gadgets': 'cpu',
  'Infantil & Bebê': 'baby',
  'Cuidados Pessoais e Saúde': 'heartPulse',
  'Ofertas & Descontos': 'badgePercent',
  default: 'laptop',
}

const benefitIcons = {
  shield: ShieldCheck,
  package: Package,
  badge: BadgePercent,
}

// --- Tipos de Dados ---
type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { user: true; category: true }
}>
type SectionWithProducts = HomepageSection & { products: ProductWithDetails[] }

// --- Componentes da Página ---

function DynamicSection({ section }: { section: SectionWithProducts }) {
  return (
    <section>
      <div className="relative mb-8 h-48 w-full overflow-hidden rounded-lg">
        <Image
          src={section.bannerImageUrl}
          alt={section.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div
          className="absolute inset-0 flex items-center justify-center text-center text-4xl font-bold"
          style={{ color: section.bannerFontColor || '#FFFFFF' }}
        >
          <h2>{section.title}</h2>
        </div>
      </div>
      <ProductScrollArea title="" products={section.products} />
    </section>
  )
}

function BenefitCard({
  iconName,
  title,
  children,
}: {
  iconName: keyof typeof benefitIcons
  title: string
  children: React.ReactNode
}) {
  const IconComponent = benefitIcons[iconName]
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6 text-center shadow-sm">
      <div className="rounded-full bg-primary p-3 text-primary-foreground">
        <IconComponent className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{children}</p>
    </div>
  )
}

// --- Componente Principal da Página ---
export default async function HomePage() {
  const [banners, featuredProducts, onPromotionProducts, homepageSections, categories] =
    await Promise.all([
      prisma.homePageBanner.findMany({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { isFeatured: true, isReserved: false },
        include: { user: true, category: true },
        take: 10,
      }),
      prisma.product.findMany({
        where: { onPromotion: true, isReserved: false },
        include: { user: true, category: true },
        take: 10,
      }),
      prisma.homepageSection.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.category.findMany({ take: 8 }),
    ])

  const allProductIds = homepageSections.flatMap((section) => section.productIds)
  const sectionProducts =
    allProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: allProductIds } },
          include: { user: true, category: true },
        })
      : []

  const productsMap = new Map(sectionProducts.map((p) => [p.id, p]))
  const sectionsWithProducts = homepageSections.map((section) => ({
    ...section,
    products: section.productIds
      .map((id) => productsMap.get(id))
      .filter((p): p is ProductWithDetails => !!p),
  }))

  return (
    <>
    <Navbar/>
    <div className="flex flex-col gap-16 pb-20 md:gap-24 lg:gap-28">
      <HeroCarousel banners={banners} />

      <div className="container mx-auto flex flex-col gap-16 md:gap-20 lg:gap-24">
        {categories.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold tracking-tight">
              Explore por Categorias
            </h2>
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
                {categories.map((category: Category) => {
                  const iconKey =
                    Object.keys(categoryIcons).find((key) =>
                      category.name.includes(key),
                    ) || 'default'
                  const iconName = categoryIcons[iconKey] as IconName
                  return (
                    <Tooltip key={category.id}>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/products?category=${category.id}`}
                          className="group flex flex-col items-center gap-3 rounded-lg border bg-card p-4 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        >
                          <div className="rounded-full bg-muted p-4 transition-colors group-hover:bg-primary/10">
                            <Icon
                              name={iconName}
                              className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary"
                            />
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{category.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </TooltipProvider>
          </section>
        )}

        <ProductScrollArea
          title="Ofertas do Dia"
          products={onPromotionProducts}
          href="/products?onPromotion=true"
        />
        
        <ProductScrollArea
          title="Produtos em Destaque"
          products={featuredProducts}
          href="/products?isFeatured=true"
        />

        {sectionsWithProducts.map((section) => (
          <DynamicSection key={section.id} section={section} />
        ))}

        <section>
          <h2 className="mb-8 text-2xl font-bold tracking-tight">
            Por que comprar no Zacaplace?
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <BenefitCard iconName="shield" title="Compra Segura">
              Garantimos a sua compra do início ao fim com um processo de
              pagamento protegido e verificado.
            </BenefitCard>
            <BenefitCard iconName="package" title="Vendedores da Comunidade">
              Nossa plataforma é formada por vendedores apaixonados e escolhidos
              a dedo pela nossa equipe.
            </BenefitCard>
            <BenefitCard iconName="badge" title="As Melhores Ofertas">
              Encontre produtos incríveis com preços que você não verá em
              nenhum outro lugar no mercado.
            </BenefitCard>
          </div>
        </section>
      </div>
    </div>
    <Footer/>
    </>
  )
}
