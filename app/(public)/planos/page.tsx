'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Check, Crown, Rocket, Zap, Loader2, Info, Banknote, Star, Instagram } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Product } from '@prisma/client'
import { cn } from '@/lib/utils'
import { PurchaseType } from '@prisma/client'
import { PixPaymentModal } from '@/app/components/modals/PixPaymentModal'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

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
            'Destaque na seção "Turbinados da Semana"',
            'Visibilidade máxima garantida na homepage',
            'Ideal para queimar estoque rápido',
            'Válido por 7 dias corridos',
        ],
        icon: Rocket,
        buttonText: 'Turbinar Agora',
        type: 'payment',
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
            'Página de vendedor exclusiva (Mini-site)',
            'Destaque na lista oficial de Lojistas',
            'Link próprio para partilhar no WhatsApp/Insta',
            'Selo de Vendedor Verificado',
            'Gerenciamento ilimitado de anúncios',
        ],
        icon: Crown,
        buttonText: 'Assinar Plano VIP',
        type: 'subscription',
    },
    {
        name: 'Carrossel na Praça',
        priceId: process.env.NEXT_PUBLIC_STRIPE_CAROUSEL_PRICE_ID,
        price: 'R$ 14,90',
        numericPrice: '14.90',
        purchaseType: PurchaseType.CARROSSEL_PRACA,
        frequency: '/postagem',
        description: 'Seu produto divulgado diretamente no Instagram oficial do Zacaplace.',
        features: [
            'Post dedicado no feed do Instagram @zacaplace',
            'Exposição a milhares de seguidores da cidade',
            'Tráfego direcionado para o seu anúncio',
            'Ideal para grandes lançamentos e queimas',
        ],
        icon: Zap,
        buttonText: 'Divulgar no Instagram',
        type: 'payment',
    },
];

type Plan = (typeof plans)[0]

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
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-background pt-24 md:pt-32">
      
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

      {/* HEADER DA PÁGINA */}
      <header className="w-full bg-slate-50 dark:bg-slate-950 py-16 md:py-24 text-center border-b border-border">
        <div className="container mx-auto px-4">
            <Badge variant="outline" className="mb-4 text-zaca-roxo border-zaca-roxo/30 uppercase tracking-widest font-bold">Impulsione Resultados</Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-zaca-roxo to-indigo-600 dark:from-indigo-400 dark:to-zaca-lilas mb-6">
                Escolha o seu Poder
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
                Seja para um empurrão rápido ou para montar a sua loja definitiva. Temos o plano certo para fazer os seus produtos voarem.
            </p>
        </div>
      </header>

      <main className="flex-grow">
          
        {/* SESSÃO 1: ACHADINHO TURBO */}
        <section className="relative w-full py-20 lg:py-32 bg-slate-950 text-white overflow-hidden">
            {/* Fundo estrelado / espacial */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
            <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    
                    {/* Textos à Esquerda */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-6">
                            <Rocket className="w-5 h-5 text-sky-400" />
                            <span className="text-sky-100 font-bold tracking-wide text-sm">DESTAQUE EXPRESSO</span>
                        </div>
                        
                        <h2 className="text-5xl lg:text-7xl font-black mb-6 leading-tight tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-sky-300">
                            {plans[0].name}
                        </h2>
                        
                        <p className="text-xl text-slate-300 mb-8 font-medium leading-relaxed">
                            {plans[0].description}
                        </p>
                        
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-sm">
                            <div className="flex items-baseline gap-2 mb-6 border-b border-slate-800 pb-6">
                                <span className="text-6xl font-black text-white">{plans[0].price}</span>
                                <span className="text-xl text-slate-400 font-medium">{plans[0].frequency}</span>
                            </div>
                            <ul className="space-y-4">
                                {plans[0].features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-lg text-slate-200">
                                        <div className="bg-sky-500/20 p-1 rounded-full shrink-0">
                                            <Check className="h-5 w-5 text-sky-400" />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <Button 
                            onClick={() => handlePlanSelection(plans[0])}
                            size="lg" 
                            className="w-full sm:w-auto h-16 px-10 text-xl font-black bg-sky-500 hover:bg-sky-400 text-white rounded-full shadow-[0_0_40px_-10px_rgba(14,165,233,0.8)] hover:scale-105 transition-all"
                        >
                            <Rocket className="mr-3 w-6 h-6" />
                            {plans[0].buttonText}
                        </Button>
                    </motion.div>

                    {/* Imagem à Direita (A rapariga com o foguete) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative flex justify-center items-center"
                    >
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="relative w-full max-w-lg lg:max-w-xl aspect-square"
                        >
                            <Image 
                                src="/achadinho-turbo.png" 
                                alt="Achadinho Turbo" 
                                fill 
                                className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
                            />
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>


        {/* SESSÃO 2: MEU CATÁLOGO NO ZACA (INVERTIDA) */}
        <section className="relative w-full py-20 lg:py-32 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
            {/* Elementos Decorativos Fundo */}
            <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-amber-300/30 dark:bg-amber-700/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-400/20 dark:bg-yellow-600/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    
                    {/* Imagem/Composição à Esquerda */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="order-2 lg:order-1 relative flex justify-center items-center"
                    >
                        <motion.div
                            animate={{ y: [0, -15, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="relative w-full max-w-lg aspect-square"
                        >
                            <Image 
                                src="/meu-catalogo.png" 
                                alt="Meu Catálogo no Zaca" 
                                fill 
                                className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]" 
                            />
                        </motion.div>
                    </motion.div>

                    {/* Textos à Direita */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="order-1 lg:order-2"
                    >
                        <div className="inline-flex items-center gap-2 bg-amber-200/50 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 px-4 py-1.5 rounded-full mb-6">
                            <Star className="w-5 h-5 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
                            <span className="text-amber-800 dark:text-amber-200 font-bold tracking-wide text-sm">PLANO ASSINATURA</span>
                        </div>
                        
                        <h2 className="text-5xl lg:text-7xl font-black mb-6 leading-tight tracking-tighter text-slate-900 dark:text-white">
                            {plans[1].name}
                        </h2>
                        
                        <p className="text-xl text-slate-700 dark:text-slate-300 mb-8 font-medium leading-relaxed">
                            {plans[1].description}
                        </p>
                        
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl p-8 mb-8">
                            <div className="flex items-baseline gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                                <span className="text-6xl font-black text-amber-500">{plans[1].price}</span>
                                <span className="text-xl text-slate-500 font-medium">{plans[1].frequency}</span>
                            </div>
                            <ul className="space-y-4">
                                {plans[1].features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-lg text-slate-700 dark:text-slate-300">
                                        <div className="bg-amber-100 dark:bg-amber-900/50 p-1 rounded-full shrink-0">
                                            <Check className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <Button 
                            onClick={() => handlePlanSelection(plans[1])}
                            size="lg" 
                            className="w-full sm:w-auto h-16 px-10 text-xl font-black bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-[0_0_40px_-10px_rgba(245,158,11,0.6)] hover:scale-105 transition-all"
                        >
                            <Crown className="mr-3 w-6 h-6" />
                            {plans[1].buttonText}
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>


        {/* SESSÃO 3: CARROSSEL NA PRAÇA */}
        <section className="relative w-full py-20 lg:py-32 bg-gradient-to-br from-fuchsia-950 via-purple-900 to-indigo-950 text-white overflow-hidden">
             {/* Fundo Padrão Grid Opaco */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
             
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    
                    {/* Textos à Esquerda */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-fuchsia-500/20 border border-fuchsia-400/30 px-4 py-1.5 rounded-full mb-6">
                            <Instagram className="w-5 h-5 text-fuchsia-400" />
                            <span className="text-fuchsia-200 font-bold tracking-wide text-sm">TRÁFEGO SOCIAL</span>
                        </div>
                        
                        <h2 className="text-5xl lg:text-7xl font-black mb-6 leading-tight tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-pink-100">
                            {plans[2].name}
                        </h2>
                        
                        <p className="text-xl text-fuchsia-100 mb-8 font-medium leading-relaxed">
                            {plans[2].description}
                        </p>
                        
                        <div className="bg-black/20 border border-white/10 rounded-3xl p-8 mb-8 backdrop-blur-xl">
                            <div className="flex items-baseline gap-2 mb-6 border-b border-white/10 pb-6">
                                <span className="text-6xl font-black text-white">{plans[2].price}</span>
                                <span className="text-xl text-fuchsia-200/60 font-medium">{plans[2].frequency}</span>
                            </div>
                            <ul className="space-y-4">
                                {plans[2].features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-lg text-fuchsia-50">
                                        <div className="bg-fuchsia-500/30 p-1 rounded-full shrink-0">
                                            <Check className="h-5 w-5 text-fuchsia-300" />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <Button 
                            onClick={() => handlePlanSelection(plans[2])}
                            size="lg" 
                            className="w-full sm:w-auto h-16 px-10 text-xl font-black bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white rounded-full shadow-[0_0_40px_-10px_rgba(217,70,239,0.6)] hover:scale-105 transition-all"
                        >
                            <Instagram className="mr-3 w-6 h-6" />
                            {plans[2].buttonText}
                        </Button>
                    </motion.div>

                    {/* Composição à Direita (Estilo Instagram) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative flex justify-center items-center"
                    >
                        <div className="relative w-full max-w-md aspect-[4/5] bg-white rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col p-6">
                            {/* Insta Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-fuchsia-500 to-purple-600 p-[3px]">
                                    <div className="w-full h-full bg-white rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
                                        <div className="w-full h-full bg-slate-200"></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">zacaplace</h4>
                                    <p className="text-xs text-slate-500">Patrocinado</p>
                                </div>
                            </div>
                            {/* Insta Image */}
                            <div className="flex-1 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center group cursor-pointer border border-slate-100">
                                <Image 
                                    src="/carrossel-praca.png" 
                                    alt="Carrossel na Praça - Rede Social" 
                                    fill 
                                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    <span className="bg-white/20 backdrop-blur-md text-white font-bold px-3 py-1 rounded-full text-sm translate-y-4 group-hover:translate-y-0 transition-transform">Visitar o Lojista</span>
                                </div>
                            </div>
                            {/* Insta Actions */}
                            <div className="flex justify-between items-center px-2">
                                <div className="flex gap-4">
                                    <div className="w-7 h-7 rounded-full border-2 border-slate-300"></div>
                                    <div className="w-7 h-7 rounded-full border-2 border-slate-300"></div>
                                    <div className="w-7 h-7 rounded-full border-2 border-slate-300"></div>
                                </div>
                                <div className="w-6 h-6 rounded-sm border-2 border-slate-300"></div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>

      </main>

      {/* DIALOG DE SELEÇÃO DE PRODUTOS (Para Planos Avulsos) */}
      <Dialog open={isProductSelectorOpen} onOpenChange={setIsProductSelectorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Destacar com {activePlan?.name}</DialogTitle>
            <DialogDescription className="text-base">
              Escolha qual dos seus produtos ou serviços você quer dar aquele empurrãozinho.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            {products.length > 0 ? (
              <Select onValueChange={setSelectedProductId} value={selectedProductId}>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue placeholder="Selecione um item da sua loja..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-base py-3">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center text-sm text-muted-foreground p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
                <Info className="mx-auto h-8 w-8 mb-3 text-slate-400" />
                <p className="font-medium text-slate-600 dark:text-slate-300">Você precisa ter pelo menos um item cadastrado para usar este serviço.</p>
              </div>
            )}
          </div>
          <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
            <Button
              variant="outline"
              className="h-12 font-bold text-slate-700 dark:text-slate-200"
              onClick={() => handlePixPayment(activePlan!, selectedProductId)}
              disabled={!selectedProductId || isLoading === activePlan?.priceId}
            >
              <Banknote className="mr-2 h-5 w-5 text-emerald-500" /> Pagar com PIX
            </Button>
            <Button
              className="h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => handleStripeCheckout(activePlan?.priceId, 'payment', selectedProductId)}
              disabled={!selectedProductId || isLoading === activePlan?.priceId}
            >
              {isLoading === activePlan?.priceId ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                'Pagar com Cartão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}