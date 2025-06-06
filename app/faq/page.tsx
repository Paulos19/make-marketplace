import { Metadata } from 'next';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: 'Dúvidas Frequentes (FAQ) | Zacaplace',
  description: 'Encontre respostas para as perguntas mais comuns sobre como comprar, vender e usar o Zacaplace.',
};

const faqItems = [
  {
    question: "O que é o Zacaplace?",
    answer: "O Zacaplace é um marketplace online divertido e seguro, focado em conectar vendedores e compradores de produtos incríveis, principalmente no universo da beleza e cosméticos, mas aberto a todos os 'achadinhos'."
  },
  {
    question: "Como eu faço para comprar um produto?",
    answer: "É simples! Navegue pelos 'achadinhos', encontre o que você ama, clique em 'Reservar e Contatar Vendedor'. Isso irá reservar o produto para si e redirecioná-lo para o WhatsApp do vendedor para combinar o pagamento e a entrega diretamente com ele."
  },
  {
    question: "Como posso começar a vender?",
    answer: "Para vender, você precisa de criar uma conta com o perfil de 'Vendedor'. Durante o registo, selecione a opção 'Quero Vender'. Após completar o seu perfil, poderá aceder ao seu painel de vendedor e começar a registar os seus produtos na hora!"
  },
  {
    question: "O Zacaplace processa os pagamentos?",
    answer: "Não. Atualmente, o Zacaplace funciona como uma vitrine e um ponto de encontro. A negociação final, o pagamento e a forma de entrega são combinados diretamente entre o comprador e o vendedor através do canal de contacto fornecido, como o WhatsApp."
  },
  {
    question: "É seguro comprar na plataforma?",
    answer: "Nós esforçamo-nos para criar um ambiente seguro, mas como a negociação final é feita fora da plataforma, recomendamos sempre que os utilizadores tomem precauções. Verifiquem o perfil do vendedor, prefiram métodos de pagamento seguros e, se possível, combinem a entrega em locais públicos. A confiança da nossa comunidade é tudo!"
  }
];

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
              Dúvidas Frequentes
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Psit! Suas perguntas mais comuns, respondidas na ponta da língua.
            </p>
          </header>

          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index + 1}`}>
                <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline text-slate-800 dark:text-slate-200">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-slate-600 dark:text-slate-300 pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
}
