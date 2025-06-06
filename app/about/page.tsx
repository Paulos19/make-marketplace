// app/about/page.tsx
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nós | Zacaplace',
  description: 'Conheça a história e a missão do Zacaplace, o seu marketplace de achadinhos.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <article className="prose dark:prose-invert max-w-4xl mx-auto">
          <h1 className="font-bangers text-zaca-roxo dark:text-zaca-lilas">Sobre o Zacaplace</h1>
          <p className="lead">
            Bem-vindo ao Zacaplace, o seu novo lugar favorito na internet para encontrar os melhores "achadinhos" de maquiagem e muito mais! Nascemos de uma ideia simples: criar uma comunidade vibrante e divertida onde todos podem comprar e vender produtos de beleza de forma fácil e segura.
          </p>
          
          <h2>Nossa Missão, Cumpadi!</h2>
          <p>
            Nossa missão é democratizar o acesso a produtos de qualidade, conectando vendedores talentosos a compradores apaixonados por beleza. Queremos ser mais do que um marketplace; queremos ser um ponto de encontro, um lugar para descobrir tendências, compartilhar dicas e, claro, fazer ótimos negócios. No Zacaplace, cada produto tem uma história, e cada compra é um "psit" de alegria!
          </p>

          <h2>A Turma por Trás da Zaca</h2>
          <p>
            Somos uma equipe de entusiastas da tecnologia e da beleza, inspirados pelo humor e pela simplicidade. Acreditamos que o comércio pode ser divertido, e trabalhamos todos os dias para que a sua experiência na nossa plataforma seja intuitiva, segura e, acima de tudo, hilária.
          </p>
          
          <h2>Por que "Zacaplace"?</h2>
          <p>
            O nome é uma homenagem ao espírito brincalhão e acolhedor que queremos cultivar. Um lugar onde você se sente em casa, pode dar umas boas risadas e sempre encontrar algo que te surpreenda. Junte-se à nossa turma e vamos juntos fazer deste o lugar mais animado para comprar e vender online!
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}