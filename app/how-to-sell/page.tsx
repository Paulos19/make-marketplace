import { Metadata } from 'next';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, PackagePlus, HandCoins, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Como Vender | Zacaplace',
  description: 'Aprenda o passo a passo para se tornar um vendedor e anunciar seus produtos no Zacaplace.',
};

export default function HowToSellPage() {
  const steps = [
    {
      icon: <UserPlus className="h-8 w-8 text-zaca-azul" />,
      title: "1. Crie sua Conta de Vendedor",
      description: "No momento do registo, escolha a opção 'Quero Vender'. Preencha os seus dados, incluindo o seu link do WhatsApp para que os clientes o possam contatar facilmente."
    },
    {
      icon: <PackagePlus className="h-8 w-8 text-zaca-magenta" />,
      title: "2. Cadastre seus Achadinhos",
      description: "Aceda ao seu painel, vá para 'Adicionar Produto' e capriche nas fotos e na descrição. Quanto mais detalhes, melhor! Defina o seu preço e a quantidade em estoque."
    },
    {
      icon: <HandCoins className="h-8 w-8 text-zaca-vermelho" />,
      title: "3. Gerencie e Finalize suas Vendas",
      description: "Quando um cliente reservar um produto, você será notificado. Combine o pagamento e a entrega diretamente com o comprador através do WhatsApp. Após a entrega, marque o pedido como concluído no seu painel de vendas."
    },
     {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      title: "4. Tudo Pronto!",
      description: "É isso! Continue a adicionar novos produtos e a gerir suas vendas pelo painel. Boas vendas, cumpadi!"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
              Como Vender no Zacaplace
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Transforme seus produtos em negócio em apenas 3 passos!
            </p>
          </header>
          
          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="shadow-lg dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="flex-shrink-0">{step.icon}</div>
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-200">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300 ml-12">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
