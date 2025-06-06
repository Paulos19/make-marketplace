// app/privacy/page.tsx
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Zacaplace',
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <article className="prose dark:prose-invert max-w-4xl mx-auto">
          <h1 className="font-bangers text-zaca-roxo dark:text-zaca-lilas">Política de Privacidade</h1>
          <p className="text-sm text-slate-500">Última atualização: 07 de Junho de 2025</p>
          
          <h2>1. Coleta de Informações</h2>
          <p>
            Coletamos informações que você nos fornece diretamente, como quando você cria uma conta, lista um produto, faz uma compra ou se comunica conosco. Isso pode incluir seu nome, endereço de e-mail, endereço de entrega e informações de pagamento.
          </p>

          <h2>2. Uso das Informações</h2>
          <p>
            Usamos as informações coletadas para operar, manter e melhorar nossa Plataforma, processar transações, enviar notificações, responder às suas solicitações e personalizar sua experiência.
          </p>

          <h2>3. Compartilhamento de Informações</h2>
          <p>
            Não compartilhamos suas informações pessoais com terceiros, exceto conforme necessário para fornecer nossos serviços (por exemplo, com processadores de pagamento) ou se exigido por lei.
          </p>

          {/* Adicione outras seções conforme necessário: Segurança, Cookies, Seus Direitos, etc. */}
        </article>
      </main>
      <Footer />
    </div>
  );
}