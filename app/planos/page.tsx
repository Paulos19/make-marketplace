'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Check, Crown, Rocket, Zap, Loader2, Info, Banknote, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/app/components/layout/Navbar'
import Footer from '@/app/components/layout/Footer'
import type { Product } from '@prisma/client'
import { cn } from '@/lib/utils'
import { PurchaseType } from '@prisma/client'
import { PixPaymentModal } from '../components/modals/PixPaymentModal'
import { motion, Variants } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

// --- DEFINIÇÃO DOS PLANOS ---
const plans = [
    {
        name: 'Achadinho Turbo',
        priceId: process.env.NEXT_PUBLIC_STRIPE_TURBO_PRICE_ID,
        price: 'R$ 4,90',
        numericPrice: '4.90',
        purchaseType: PurchaseType.ACHADINHO_TURBO,
        frequency: '/ 7 dias',
        description: 'Impulsione um item para o topo da vitrine por uma semana inteira.',
        features: [
            'Destaque na seção "Turbinados"',
            'Visibilidade máxima na homepage',
            'Ideal para um empurrão rápido',
            'Válido por 7 dias',
        ],
        icon: Rocket,
        buttonText: 'Turbinar Agora',
        type: 'payment',
        gradient: 'bg-[conic-gradient(from_90deg_at_50%_50%,hsl(var(--zaca-azul)),hsl(var(--zaca-magenta)),hsl(var(--zaca-azul)))]',
        highlighted: false,
    },
    {
        name: 'Meu Catálogo no Zaca',
        priceId: process.env.NEXT_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID,
        price: 'R$ 19,90',
        numericPrice: '19.90',
        purchaseType: null,
        frequency: '/mês',
        description: 'Sua loja profissional no Zaca com página exclusiva e visibilidade total.',
        features: [
            'Página de vendedor personalizada',
            'Aparição na lista de Vendedores',
            'Link compartilhável da sua loja',
            'Selo de Vendedor Verificado',
            'Gerenciamento completo de itens',
        ],
        icon: Crown,
        buttonText: 'Assinar Agora',
        type: 'subscription',
        gradient: 'bg-[conic-gradient(from_90deg_at_50%_50%,#F59E0B,#FBBF24,#F59E0B)]',
        highlighted: true,
    },
    {
        name: 'Carrossel na Praça',
        priceId: process.env.NEXT_PUBLIC_STRIPE_CAROUSEL_PRICE_ID,
        price: 'R$ 14,90',
        numericPrice: '14.90',
        purchaseType: PurchaseType.CARROSSEL_PRACA,
        frequency: '/postagem',
        description: 'Seu produto divulgado com tráfego pago no Instagram do Zacaplace.',
        features: [
            'Post dedicado no feed do Instagram',
            'Alcance ampliado para novos clientes',
            'Link direto para seu produto',
            'Ideal para lançamentos e promoções',
        ],
        icon: Zap,
        buttonText: 'Divulgar no Insta',
        type: 'payment',
        gradient: 'bg-[conic-gradient(from_90deg_at_50%_50%,hsl(var(--zaca-vermelho)),hsl(var(--zaca-magenta)),hsl(var(--zaca-vermelho)))]',
        highlighted: false,
    },
];

type Plan = (typeof plans)[0]

// --- COMPONENTE DO CARD DE PLANO COM BORDAS ANIMADAS ---
const PlanCard = ({ plan, onButtonClick }: { plan: Plan; onButtonClick: () => void }) => {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        'w-full',
        plan.highlighted ? 'lg:w-[38%] z-10' : 'lg:w-[31%]'
      )}
    >
      <div
        className={cn(
          'relative rounded-2xl p-1 bg-background/20',
           plan.highlighted && 'lg:-my-6'
        )}
      >
        {/* Animação da Borda */}
        <div className={cn(
            "absolute inset-0 rounded-2xl -z-10 blur-xl opacity-50",
            "animate-[border-spin_6s_linear_infinite]",
            plan.gradient,
            plan.highlighted && "opacity-80 blur-2xl animate-pulse"
        )} />
         <div className={cn(
            "absolute inset-0 rounded-2xl -z-10",
            "animate-[border-spin_6s_linear_infinite]",
            plan.gradient,
        )} />

        <Card className="flex flex-col h-full rounded-xl overflow-hidden group">
          {plan.highlighted && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
              <Badge className="bg-amber-400 text-amber-900 font-bold border-none text-sm py-1 px-4 shadow-lg">
                <Star className="mr-1.5 h-4 w-4" />
                MAIS POPULAR
              </Badge>
            </div>
          )}
          <CardHeader className="text-center items-center pt-8">
            <div className="p-3 rounded-full mb-4 bg-background border">
              <plan.icon
                className={cn(
                  'h-8 w-8 transition-colors duration-300',
                  plan.highlighted ? 'text-amber-500' : 'text-primary'
                )}
              />
            </div>
            <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
            <CardDescription className="px-6 h-12">{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-4 px-6">
            <div className="text-center">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground">{plan.frequency}</span>
            </div>
            <ul className="space-y-2 text-sm">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="p-6 mt-auto">
            <Button
              className={cn(
                'w-full group/button transition-transform duration-200 hover:scale-105',
                plan.highlighted &&
                  'bg-amber-500 hover:bg-amber-600 text-amber-900 font-bold shadow-lg'
              )}
              onClick={onButtonClick}
              size="lg"
            >
              <plan.icon className="mr-2 h-5 w-5 transition-transform duration-200 group-hover/button:rotate-12" />
              {plan.buttonText}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </motion.div>
  )
}

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function PlanosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false)
  const [activePlan, setActivePlan] = useState<Plan | null>(null)
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [pixDetails, setPixDetails] = useState<{
    valor: string
    purchaseType: PurchaseType
    productId: string
  } | null>(null)

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch(`/api/products?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => setProducts(Array.isArray(data.products) ? data.products : []))
        .catch(() => toast.error('Falha ao carregar seus produtos e serviços.'))
    }
  }, [status, session])

  const handlePlanSelection = (plan: Plan) => {
    if (status !== 'authenticated') {
      router.push('/auth/signin?callbackUrl=/planos')
      return
    }
    if (plan.type === 'payment') {
      setActivePlan(plan)
      setIsProductSelectorOpen(true)
    } else {
      handleStripeCheckout(plan.priceId, plan.type)
    }
  }

  const handleStripeCheckout = async (priceId: string | undefined, type: string, productId?: string) => {
    if (!priceId) {
      toast.error('Erro de configuração: ID do plano não encontrado.')
      return
    }
    if (type === 'payment' && !productId) {
      toast.error('Você precisa selecionar um item para impulsionar.')
      return
    }
    setIsLoading(priceId)
    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, type, productId }),
      })
      const { url, error } = await response.json()
      if (!response.ok || !url) throw new Error(error || 'Não foi possível iniciar o checkout.')
      window.location.href = url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.')
    } finally {
      setIsLoading(null)
    }
  }

  const handlePixPayment = (plan: Plan, productId: string) => {
    if (!productId) {
      toast.error('Você precisa selecionar um item para pagar com PIX.')
      return
    }
    if (!plan.purchaseType) {
      toast.error('Este plano não suporta pagamento avulso com PIX.')
      return
    }
    setPixDetails({
      valor: plan.numericPrice,
      purchaseType: plan.purchaseType,
      productId: productId,
    })
    setIsProductSelectorOpen(false)
    setIsPixModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    toast.success('Serviço ativado! A página será atualizada.')
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      <Navbar />

      {pixDetails && (
        <PixPaymentModal
          isOpen={isPixModalOpen}
          onClose={() => setIsPixModalOpen(false)}
          valor={pixDetails.valor}
          purchaseType={pixDetails.purchaseType}
          productId={pixDetails.productId}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <header className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
              Dê um UP na sua Loja!
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Dê um gás nas suas vendas com nossos planos de destaque. Mais visibilidade, mais
              clientes, psit!
            </p>
          </header>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-8 lg:gap-6"
          >
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} onButtonClick={() => handlePlanSelection(plan)} />
            ))}
          </motion.div>
        </div>
      </main>

      <Dialog open={isProductSelectorOpen} onOpenChange={setIsProductSelectorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecione o item para: {activePlan?.name}</DialogTitle>
            <DialogDescription>
              Escolha qual dos seus produtos ou serviços você quer destacar com este plano.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {products.length > 0 ? (
              <Select onValueChange={setSelectedProductId} value={selectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um item..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center text-sm text-muted-foreground p-4 border rounded-md">
                <Info className="mx-auto h-6 w-6 mb-2" />
                Você precisa ter pelo menos um item cadastrado para usar este serviço.
              </div>
            )}
          </div>
          <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handlePixPayment(activePlan!, selectedProductId)}
              disabled={!selectedProductId || isLoading === activePlan?.priceId}
            >
              <Banknote className="mr-2 h-4 w-4" /> Pagar com PIX
            </Button>
            <Button
              onClick={() => handleStripeCheckout(activePlan?.priceId, 'payment', selectedProductId)}
              disabled={!selectedProductId || isLoading === activePlan?.priceId}
            >
              {isLoading === activePlan?.priceId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Pagar com Cartão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}