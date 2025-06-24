'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check, Crown, Rocket, Zap, Loader2, Info, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import type { Product } from '@prisma/client';
import { cn } from '@/lib/utils';

// <<< INÍCIO DA CORREÇÃO: VERIFICAÇÃO DA CHAVE DO STRIPE >>>
// Garante que a chave publicável do Stripe está definida no ambiente.
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
    throw new Error("ERRO: A variável de ambiente NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não está definida. Verifique seu arquivo .env.local");
}
// Carrega a instância do Stripe de forma assíncrona, agora com a chave validada.
const stripePromise = loadStripe(stripePublishableKey);
// <<< FIM DA CORREÇÃO >>>


const plans = [
    {
        name: 'Achadinho Turbo',
        priceId: process.env.NEXT_PUBLIC_STRIPE_TURBO_PRICE_ID,
        price: 'R$ 9,90',
        frequency: '/7 dias',
        description: 'Impulsione um produto para o topo da homepage por uma semana.',
        features: [
            'Destaque na seção "Turbinados da Semana"',
            'Visibilidade máxima na página inicial',
            'Aumento de cliques e potenciais vendas',
            'Duração de 7 dias',
        ],
        icon: Rocket,
        buttonText: 'Turbinar um Achadinho',
        type: 'payment',
        className: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
    },
    {
        name: 'Carrossel na Praça',
        priceId: process.env.NEXT_PUBLIC_STRIPE_CAROUSEL_PRICE_ID,
        price: 'R$ 14,90',
        frequency: '/postagem',
        description: 'Seu produto divulgado em um post com Tráfego Pago no Instagram do Zacaplace.',
        features: [
            'Divulgação para uma audiência engajada',
            'Post dedicado no feed do Instagram',
            'Link direto para o seu produto',
            'Alcance ampliado para novos clientes',
        ],
        icon: Zap,
        buttonText: 'Divulgar no Instagram',
        type: 'payment',
        className: 'border-red-400 bg-red-50 dark:bg-red-900/20'
    },
    {
        name: 'Meu Catálogo no Zaca',
        priceId: process.env.NEXT_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID,
        price: 'R$ 9,90',
        frequency: '/mês',
        description: 'Tenha sua própria página de vendedor e apareça na lista de lojas.',
        features: [
            'Página de vendedor personalizada',
            'Exibição na lista de vendedores',
            'Link compartilhável da sua loja',
            'Painel de gerenciamento completo',
        ],
        icon: Crown,
        buttonText: 'Assinar Agora',
        type: 'subscription',
        className: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    },
];

export default function PlanosPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id) {
            fetch(`/api/products?userId=${session.user.id}`)
                .then(res => res.json())
                .then(data => setProducts(Array.isArray(data) ? data : []))
                .catch(() => toast.error("Falha ao carregar seus produtos."));
        }
    }, [status, session]);

    const handleCheckout = async (priceId: string | undefined, type: string, productId?: string) => {
        if (status !== 'authenticated') {
            router.push('/auth/signin?callbackUrl=/planos');
            return;
        }

        if (!priceId) {
            toast.error("Erro de configuração: ID do plano não encontrado.");
            return;
        }

        setIsLoading(priceId);

        if (type === 'payment' && !productId && priceId === process.env.NEXT_PUBLIC_STRIPE_TURBO_PRICE_ID) {
            toast.error("Você precisa selecionar um produto para turbinar.");
            setIsLoading(null);
            return;
        }

        try {
            const response = await fetch('/api/stripe/checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, type, productId }),
            });

            const { url, error } = await response.json();

            if (!response.ok || !url) {
                throw new Error(error || "Não foi possível iniciar o checkout.");
            }

            window.location.href = url;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Ocorreu um erro desconhecido.");
            setIsLoading(null);
        }
    };
    
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow bg-slate-50 dark:bg-slate-950">
                <div className="container mx-auto px-4 py-16">
                    <header className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
                            Planos de UP para sua Loja
                        </h1>
                        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Dê um gás nas suas vendas com nossos planos de destaque. Mais visibilidade, mais clientes!
                        </p>
                    </header>
                    
                    <Dialog open={isProductSelectorOpen} onOpenChange={setIsProductSelectorOpen}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {plans.map((plan) => (
                                <Card key={plan.name} className={cn("flex flex-col shadow-lg border-2", plan.className)}>
                                    <CardHeader className="text-center items-center">
                                        <div className="p-3 bg-white rounded-full mb-4 border shadow-inner">
                                            <plan.icon className="h-8 w-8 text-slate-800" />
                                        </div>
                                        <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
                                        <CardDescription className="px-6">{plan.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4">
                                        <div className="text-center">
                                            <span className="text-4xl font-bold">{plan.price}</span>
                                            <span className="text-muted-foreground">{plan.frequency}</span>
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        {plan.type === 'payment' && plan.name === 'Achadinho Turbo' ? (
                                            <DialogTrigger asChild>
                                                <Button className="w-full" disabled={isLoading === plan.priceId} size="lg">
                                                    {isLoading === plan.priceId ? <Loader2 className="h-5 w-5 animate-spin"/> : <Rocket className="mr-2 h-5 w-5"/>}
                                                    {plan.buttonText}
                                                </Button>
                                            </DialogTrigger>
                                        ) : (
                                            <Button className="w-full" onClick={() => handleCheckout(plan.priceId, plan.type)} disabled={isLoading === plan.priceId} size="lg">
                                                {isLoading === plan.priceId && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                                                {plan.buttonText}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                        
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Turbinar um Achadinho</DialogTitle>
                                <DialogDescription>
                                    Selecione qual dos seus produtos você quer impulsionar para o topo da homepage.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                {products.length > 0 ? (
                                    <Select onValueChange={setSelectedProductId} value={selectedProductId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Escolha um produto..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground p-4 border rounded-md">
                                        <Info className="mx-auto h-6 w-6 mb-2"/>
                                        Você precisa ter pelo menos um produto cadastrado para poder turbiná-lo.
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button 
                                    onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_TURBO_PRICE_ID, 'payment', selectedProductId)} 
                                    disabled={!selectedProductId || isLoading === process.env.NEXT_PUBLIC_STRIPE_TURBO_PRICE_ID}
                                >
                                    {isLoading === process.env.NEXT_PUBLIC_STRIPE_TURBO_PRICE_ID ? <Loader2 className="h-4 w-4 animate-spin"/> : "Confirmar e Pagar"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </main>
            <Footer />
        </div>
    );
}
