// app/terms/page.tsx
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Serviço | Zacaplace',
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <article className="prose dark:prose-invert max-w-4xl mx-auto">
          <h1 className="font-bangers text-zaca-roxo dark:text-zaca-lilas">Termos de Serviço</h1>
          <p className="text-sm text-slate-500">Última atualização: 07 de Junho de 2025</p>
          
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar o marketplace Zacaplace ("Plataforma"), você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com estes termos, não deverá usar a Plataforma.
          </p>

          <h2>2. Descrição do Serviço</h2>
          <p>
            O Zacaplace é uma plataforma online que permite aos usuários ("Vendedores") listar e vender produtos, e a outros usuários ("Compradores") comprar esses produtos. Não somos o vendedor dos itens, apenas fornecemos o espaço para as transações.
          </p>

          <h2>3. Contas de Usuário</h2>
          <p>
            Para usar certas funcionalidades, você deve se registrar e criar uma conta. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.
          </p>
          
          {/* Adicione outras seções conforme necessário: Conduta do Usuário, Pagamentos, Propriedade Intelectual, etc. */}
        </article>
      </main>
      <Footer />
    </div>
  );
}