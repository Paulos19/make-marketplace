// app/about/page.tsx
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Metadata } from 'next';
import { Heart, Store, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre Nós | Zacaplace',
  description: 'Não é só vender. É pertencer. Conheça a história e a missão do Zacaplace, o marketplace que nasceu no coração de Sete Lagoas.',
};

// Componente para um item da lista de missão, para melhor estilização
const MissionItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
    <li className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1 text-zaca-magenta">
            {icon}
        </div>
        <p className="text-slate-700 dark:text-slate-300">{text}</p>
    </li>
);

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-16 md:py-24">
        <article className="prose prose-lg dark:prose-invert max-w-4xl mx-auto space-y-8">
          
          {/* Seção Principal */}
          <header className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bangers text-zaca-roxo dark:text-zaca-lilas mb-4 tracking-wider">
              Sobre o Zacaplace
            </h1>
            <p className="lead text-xl md:text-2xl text-slate-800 dark:text-slate-200 font-semibold !mt-2">
              Não é só vender. É pertencer.
            </p>
          </header>

          <p>
            O Zacaplace nasceu em Sete Lagoas, mas antes disso, nasceu do coração de quem vive e acredita nessa cidade. É mais do que um site pra anunciar produto.
          </p>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            É um chamado pra quem acorda cedo, corre atrás, sonha com o pé no chão de cimento quente, e acredita no poder de empreender do seu jeito, no seu tempo.
          </p>
          <p>
            É pra quem trabalha de casa, da loja, da rua ou do fundo da garagem. É pra quem faz com carinho, pra quem faz com raça, pra quem faz com verdade. É para você, sete-lagoano que não desiste.
          </p>

          {/* Seção da Missão */}
          <section className="!mt-16 py-8">
            <h2 className="text-center md:text-left">Nossa Missão: <span className="text-zaca-magenta">valorizar quem faz.</span></h2>
            <p>
              No Zacaplace, a gente não quer ser só vitrine. Queremos ser aliados de quem faz o comércio local acontecer de verdade. Queremos:
            </p>
            <ul className="!mt-6 space-y-4 !list-none !pl-0">
                <MissionItem
                    icon={<Target className="h-6 w-6"/>}
                    text="Dar visibilidade a quem tem talento e pouca vitrine"
                />
                <MissionItem
                    icon={<Store className="h-6 w-6"/>}
                    text="Oferecer um espaço seguro e simples pra vender com dignidade"
                />
                <MissionItem
                    icon={<Heart className="h-6 w-6"/>}
                    text="Mostrar que a força de Sete Lagoas tá em cada lojinha, oficina, ateliê e cantinho de venda"
                />
            </ul>
             <p className="!mt-6 font-semibold text-slate-800 dark:text-slate-200">
                Aqui, cada venda é mais do que número: é uma história que continua, uma conta paga, um sorriso em casa.
            </p>
          </section>

          {/* Outras seções */}
          <section className="!mt-12 space-y-6">
            <p>
              No Zacaplace, cabe de tudo: moda, beleza, tecnologia, papelaria, brinquedos, decoração, serviços... O que importa é ter verdade no que se faz.
            </p>
            <blockquote className="border-l-4 border-zaca-roxo pl-4 italic">
              <p className="!my-0">
                Somos daqui também. A gente nasceu nessa cidade. A gente viu o Zaca na televisão e ouviu a risada dos vizinhos ecoar pela rua. A gente sabe o valor de uma venda. E sabe também o peso de um boleto. Por isso, a gente criou o Zacaplace com um único objetivo: ajudar quem é daqui a vender mais, com mais alcance, sem abrir mão do seu jeito.
              </p>
            </blockquote>
            <p>
              Comprar online não precisa ser distante. Vender online não precisa ser difícil. O que falta é um espaço com a nossa cara — e agora tem.
            </p>
          </section>

          <section className="!mt-16 py-8 bg-slate-100 dark:bg-slate-900 rounded-xl px-8">
            <h2 className="text-center md:text-left">Por que <span className="text-zaca-azul">“Zacaplace”?</span></h2>
            <p>
                Porque Zacarias é símbolo da nossa cidade. É simplicidade, é humor, é coração limpo. E o Zacaplace é isso também: Um lugar com nome de ícone, alma de bairro, e força de quem acredita no interior.
            </p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Zacaplace é onde o sonho da lojinha encontra o clique do cliente. É onde a venda tem nome e sobrenome. É onde Sete Lagoas vira vitrine pro mundo.
            </p>
          </section>
          
          <section className="!mt-12 space-y-6">
            <p>
              Se você é daqui, você sente. Se você tem um negócio, um talento, uma ideia — esse lugar é seu. Se você é de fora, pode entrar, mas chega devagar, com respeito: aqui tem história. Porque vender é um ato de confiança. E comprar, um gesto de afeto.
            </p>
             <p className="font-semibold text-slate-800 dark:text-slate-200 text-center text-xl !my-10">
                O Zacaplace existe, resiste e insiste. Pra mostrar que o interior tem potência. Que o local é global. E que o jeito Zaca de viver — honesto, engraçado, acolhedor — pode, sim, virar tecnologia.
            </p>
          </section>

          <section className="text-center !mt-16">
            <h3 className="text-3xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">Vamos juntos?</h3>
            <p>
              O Zacaplace é muito mais do que uma plataforma. É Sete Lagoas inteira, digitando com orgulho, vendendo com amor e crescendo com verdade. Se é feito por você, tem lugar aqui. Se é feito com alma, tem gente pra comprar.
            </p>
            <p className="text-2xl font-bangers tracking-wider text-slate-800 dark:text-slate-200 mt-8">Zacaplace.</p>
            <p className="text-lg text-slate-600 dark:text-slate-400">O vendedor número um do comércio local. Psit!</p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
