import { Metadata } from 'next';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ShoppingCart, MessageCircle, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Como Comprar | Zacaplace',
  description: 'Aprenda o passo a passo para encontrar e comprar os melhores achadinhos no Zacaplace.',
};

export default function HowToBuyPage() {
  const steps = [
    {
      icon: <Search className="h-8 w-8 text-zaca-azul" />,
      title: "1. Encontre seu Achadinho",
      description: "Explore nossas categorias ou use a barra de busca para encontrar o produto perfeito para si. Leia a descrição e veja as fotos com atenção."
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-zaca-magenta" />,
      title: "2. Reserve o Produto",
      description: "Gostou? Clique em 'Reservar e Contatar Vendedor'. Isso garante que o produto fique guardado para si enquanto você finaliza a compra e o redireciona para o WhatsApp do vendedor."
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-zaca-vermelho" />,
      title: "3. Fale com o Vendedor",
      description: "Pelo WhatsApp, converse diretamente com o vendedor para tirar dúvidas, combinar a forma de pagamento (Pix, dinheiro, etc.) e o método de entrega (Correios, retirada em mãos, etc.)."
    },
     {
      icon: <Truck className="h-8 w-8 text-green-500" />,
      title: "4. Receba seu Produto!",
      description: "Após combinar tudo, é só aguardar seu achadinho chegar! Lembre-se de confirmar o recebimento e, se possível, deixar uma avaliação para ajudar outros compradores."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
              Como Comprar no Zacaplace
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Encontre seus produtos favoritos de forma simples e direta!
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
