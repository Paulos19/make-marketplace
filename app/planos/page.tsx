"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// CORREÇÃO: Usando 'as const' para que o TypeScript infira os tipos literais corretos.
const plans = [
  {
    name: 'Achadinho turbo',
    priceId: process.env.NEXT_PUBLIC_STRIPE_TURBO_PRICE_ID || 'price_turbo_placeholder',
    type: 'payment',
    price: 'R$ 4,90',
    priceDescription: 'Pagamento único por produto',
    description: 'Seu produto no topo das buscas em Sete Lagoas!',
    benefits: [
      'Visibilidade Máxima',
      'Venda Acelerada',
      'Destaque Exclusivo',
    ],
    cta: 'Turbinar meu Achadinho!',
    variant: 'default',
  },
  {
    name: 'Carrossel na Praça',
    priceId: process.env.NEXT_PUBLIC_STRIPE_CAROUSEL_PRICE_ID || 'price_carousel_placeholder',
    type: 'payment',
    price: 'R$ 19,90',
    priceDescription: 'Pagamento único por divulgação',
    description: 'Seu achadinho fazendo bafafá no Instagram do Zaca!',
    benefits: [
      'Alcance Explosivo',
      'Engajamento Quente',
      'Destaque nos Stories',
    ],
    cta: 'Ativar Carrossel do Zaca',
    variant: 'default',
  },
  {
    name: 'Meu Catálogo no Zaca',
    priceId: process.env.NEXT_PUBLIC_STRIPE_CATALOG_PRICE_ID || 'price_catalog_placeholder',
    type: 'subscription',
    price: 'R$ 9,90',
    priceDescription: 'por mês',
    description: 'Sua loja online em um link só, pra compartilhar com todo mundo!',
    benefits: [
      'Sua Vitrine Pessoal',
      'Link Descomplicado',
      'Profissionalismo na Palma da Mão',
      'Sem Dor de Cabeça',
    ],
    cta: 'Ativar Meu Catálogo!',
    variant: 'highlight',
  },
] as const; // <--- FIM DA CORREÇÃO

// CORREÇÃO: O tipo do parâmetro 'plan' agora é inferido corretamente.
const PlanCard = ({ plan, onSubscribe, isLoading, isSubscribing }: { plan: (typeof plans)[number], onSubscribe: (priceId: string, type: 'subscription' | 'payment') => void, isLoading: boolean, isSubscribing: boolean }) => (
  <Card className={cn(
    "flex flex-col h-full shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
    plan.variant === 'highlight' && "border-2 border-zaca-magenta"
  )}>
    <CardHeader className="text-center">
      <CardTitle className={cn(
        "text-2xl font-bangers tracking-wider",
        plan.variant === 'highlight' ? "text-zaca-magenta" : "text-zaca-roxo dark:text-zaca-lilas"
      )}>{plan.name}</CardTitle>
      <CardDescription>{plan.description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow space-y-4">
      <div className="text-center">
        <span className="text-4xl font-extrabold">{plan.price}</span>
        <span className="text-sm text-muted-foreground ml-1">{plan.priceDescription}</span>
      </div>
      <ul className="space-y-2 text-sm">
        {plan.benefits.map((benefit, i) => (
          <li key={i} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">{benefit}</span>
          </li>
        ))}
      </ul>
    </CardContent>
    <CardFooter>
      <Button
        className={cn(
          "w-full font-bold",
          plan.variant === 'highlight' && "bg-zaca-magenta hover:bg-zaca-magenta/90"
        )}
        onClick={() => onSubscribe(plan.priceId, plan.type)}
        disabled={isLoading}
      >
        {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {plan.cta}
      </Button>
    </CardFooter>
  </Card>
);

export default function PlansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, type: 'subscription' | 'payment') => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/planos');
      return;
    }
    
    setLoadingPriceId(priceId);

    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, type }),
      });

      const { url, error } = await response.json();

      if (!response.ok) {
        throw new Error(error || 'Falha ao iniciar o pagamento.');
      }
      
      window.location.href = url;

    } catch (err: any) {
      toast.error('Erro ao processar', { description: err.message });
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <main className="flex-grow">
        <section className="text-center py-16 md:py-20 px-4">
          <h1 className="text-4xl sm:text-5xl font-bangers text-zaca-roxo dark:text-zaca-lilas tracking-wider">
            Turbine Suas Vendas no Zacaplace!
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400">
            Cumpadi, tá na hora de fazer seu negócio em Sete Lagoas decolar! Conheça nossos Planos de UP!
          </p>
        </section>

        <section className="pb-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.name}
                  plan={plan}
                  onSubscribe={handleSubscribe}
                  isLoading={!!loadingPriceId}
                  isSubscribing={loadingPriceId === plan.priceId}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
