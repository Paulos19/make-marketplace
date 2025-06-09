// app/terms/page.tsx
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Serviço | Zacaplace',
  description: 'Leia os nossos Termos de Serviço para entender as regras e responsabilidades ao usar a plataforma Zacaplace.',
};

export default function TermsPage() {
  const lastUpdated = "9 de Junho de 2025";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <article className="prose dark:prose-invert max-w-4xl mx-auto">
          <h1 className="font-bangers text-zaca-roxo dark:text-zaca-lilas">Termos de Serviço</h1>
          <p className="lead">Bem-vindo ao Zacaplace! Antes de usar nossa plataforma, por favor, leia estes termos com atenção.</p>
          <p className="text-sm text-slate-500">Última atualização: {lastUpdated}</p>
          
          <h2>1. Definições</h2>
          <ul>
            <li><strong>Plataforma:</strong> Refere-se ao site e aos serviços oferecidos pelo Zacaplace.</li>
            <li><strong>Usuário:</strong> Qualquer pessoa que acesse ou utilize a Plataforma, incluindo Compradores e Vendedores.</li>
            <li><strong>Vendedor:</strong> Um Usuário que se cadastra com o perfil de vendedor para listar e vender produtos.</li>
            <li><strong>Comprador:</strong> Um Usuário que utiliza a plataforma para encontrar e reservar produtos.</li>
          </ul>

          <h2>2. Aceitação dos Termos</h2>
          <p>
            Ao se cadastrar, acessar ou usar a Plataforma Zacaplace, você declara que leu, entendeu e concorda em estar vinculado a estes Termos de Serviço e à nossa Política de Privacidade. Se você não concorda com estes termos, não deverá usar nossos serviços.
          </p>

          <h2>3. Descrição dos Serviços</h2>
          <p>
            O Zacaplace é uma plataforma de marketplace online que atua como intermediário, conectando Vendedores independentes a Compradores. Permitimos que Vendedores criem suas lojas, listem produtos e que Compradores descubram e reservem esses produtos.
          </p>
          <h3>3.1. Nosso Papel</h3>
          <p>
            É fundamental entender que o <strong>Zacaplace não é o vendedor</strong> dos itens listados. Somos uma vitrine e um facilitador. O contrato de compra e venda é celebrado diretamente entre o Comprador e o Vendedor. O Zacaplace não fabrica, armazena, inspeciona ou entrega os itens. A responsabilidade pela qualidade, segurança, legalidade e descrição dos produtos é inteiramente do Vendedor.
          </p>

          <h2>4. Contas de Usuário</h2>
          <ul>
            <li><strong>Cadastro:</strong> Para utilizar plenamente a plataforma, você deve criar uma conta, fornecendo informações verdadeiras e atualizadas.</li>
            <li><strong>Segurança:</strong> Você é o único responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado.</li>
            <li><strong>Idade:</strong> Você deve ter pelo menos 18 anos de idade para criar uma conta e utilizar nossos serviços.</li>
          </ul>

          <h2>5. Responsabilidades do Vendedor</h2>
          <ul>
            <li><strong>Veracidade:</strong> O Vendedor é responsável por fornecer descrições precisas, fotos de qualidade e informações corretas sobre seus produtos, incluindo preços e quantidade em estoque.</li>
            <li><strong>Negociação e Entrega:</strong> O Vendedor concorda em conduzir a negociação final, incluindo o acerto do pagamento e da entrega, de forma honesta e direta com o Comprador, principalmente através do canal de contato (WhatsApp) fornecido.</li>
            <li><strong>Legalidade:</strong> O Vendedor garante que tem o direito de vender os produtos listados e que eles cumprem todas as leis e regulamentos aplicáveis.</li>
          </ul>

          <h2>6. Responsabilidades do Comprador</h2>
          <ul>
            <li><strong>Contato:</strong> Ao reservar um produto, o Comprador concorda em iniciar o contato com o Vendedor para finalizar a transação.</li>
            <li><strong>Due Diligence:</strong> O Comprador é responsável por tirar todas as suas dúvidas sobre o produto, pagamento e entrega diretamente com o Vendedor antes de efetuar qualquer pagamento.</li>
            <li><strong>Pagamento:</strong> O pagamento é realizado diretamente ao Vendedor, fora da plataforma Zacaplace. O Zacaplace não se responsabiliza por quaisquer problemas relacionados ao pagamento.</li>
          </ul>

          <h2>7. Conduta e Usos Proibidos</h2>
          <p>Você concorda em não usar a Plataforma para:</p>
          <ul>
            <li>Violar qualquer lei ou regulamento.</li>
            <li>Publicar conteúdo falso, enganoso, malicioso ou difamatório.</li>
            <li>Listar produtos ilegais, falsificados ou que violem os direitos de propriedade intelectual de terceiros.</li>
            <li>Interferir no funcionamento da Plataforma ou tentar acessar contas de outros usuários.</li>
          </ul>

          <h2>8. Propriedade Intelectual</h2>
          <p>
            O nome "Zacaplace", o logo, o design e todo o conteúdo criado pela nossa equipe são de nossa propriedade exclusiva. O conteúdo gerado pelos usuários, como fotos e descrições de produtos, pertence aos respectivos usuários, mas ao publicá-lo, você nos concede uma licença não exclusiva para usar esse conteúdo na operação e promoção da Plataforma.
          </p>
          
          <h2>9. Limitação de Responsabilidade</h2>
          <p>
            Como somos uma plataforma intermediária, o Zacaplace não se responsabiliza por disputas, perdas ou danos de qualquer tipo que surjam da negociação e transação entre Compradores e Vendedores. Não garantimos a qualidade, segurança ou legalidade dos itens anunciados. Recomendamos que os usuários ajam com cautela e bom senso.
          </p>

          <h2>10. Alterações nos Termos</h2>
          <p>
            Podemos modificar estes Termos de Serviço a qualquer momento. Notificaremos sobre alterações significativas, mas é sua responsabilidade revisar os termos periodicamente. O uso contínuo da Plataforma após as alterações constitui sua aceitação dos novos termos.
          </p>

          <h2>11. Legislação Aplicável</h2>
          <p>
            Estes Termos de Serviço são regidos e interpretados de acordo com as leis da República Federativa do Brasil. Fica eleito o foro da Comarca de Sete Lagoas, Minas Gerais, para dirimir quaisquer controvérsias oriundas destes termos.
          </p>

          <h2>12. Contato</h2>
          <p>
            Se tiver alguma dúvida sobre estes termos, entre em contato conosco através do email: <strong>contato@resend.zacaplace.com.br</strong>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
