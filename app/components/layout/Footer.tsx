"use client"; // <<< ADICIONADO para permitir o uso de hooks (useState)

import { useState } from 'react'; // <<< ADICIONADO para gerenciar o estado do formulário
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Loader2 } from 'lucide-react'; // <<< ÍCONES ADICIONADOS
import { toast } from 'sonner'; // <<< ADICIONADO para notificações

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Função para lidar com o envio do formulário da newsletter
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        // Usa a mensagem de erro da API (ex: "Este e-mail já está cadastrado")
        throw new Error(data.message || 'Falha ao se inscrever. Tente novamente.');
      }
      
      toast.success("Inscrição confirmada!", { 
        description: "Você agora receberá as melhores ofertas do Zacaplace!" 
      });
      setEmail(''); // Limpa o campo após o sucesso

    } catch (err: any) {
      toast.error("Ô psit, deu erro!", { 
        description: err.message || "Não foi possível completar sua inscrição."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 print:hidden">
      <div className="mx-auto max-w-screen-xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="flex justify-center">
            <Link href="/" className="inline-block" aria-label="Página Inicial do Zacaplace">
              <Image src="/zacalogo.png" alt="Zacaplace Logo" width={200} height={50} priority={false} />
            </Link>
          </div>

          <p className="mx-auto mt-6 max-w-md text-center leading-relaxed text-slate-600 dark:text-slate-400">
            O seu marketplace de achadinhos incríveis! Encontre as melhores ofertas, e venda seus produtos de forma fácil e segura em Sete Lagoas.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-32">
          <div className="mx-auto max-w-sm lg:max-w-none text-center lg:text-left">
            <p className="text-2xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
              Fique por Dentro das Novidades!
            </p>

            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Cadastre seu e-mail para não perder nenhuma promoção ou lançamento dos seus vendedores favoritos. Prometemos não ser chatos igual o Sargento Pincel!
            </p>

            {/* <<< FORMULÁRIO ATUALIZADO COM LÓGICA >>> */}
            <form onSubmit={handleSubscribe} className="mt-6 flex flex-col sm:flex-row gap-4">
              <label htmlFor="FooterEmail" className="sr-only"> Email </label>
              <input
                type="email"
                id="FooterEmail"
                placeholder="zacaplace@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full rounded-md border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 px-4 py-3 text-slate-700 dark:text-slate-200 shadow-sm transition focus:border-zaca-azul dark:focus:border-zaca-lilas focus:ring-1 focus:ring-zaca-azul dark:focus:ring-zaca-lilas"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center shrink-0 rounded-md border border-zaca-azul bg-zaca-azul px-6 py-3 text-sm font-bold text-white transition hover:bg-zaca-azul/90 focus:outline-none focus:ring-2 focus:ring-zaca-azul focus:ring-offset-2 dark:focus:ring-offset-slate-900 active:bg-zaca-azul/80 disabled:opacity-60"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Quero Receber!
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 lg:text-left">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white font-bangers tracking-wide">Institucional</p>
              <ul className="mt-6 space-y-3 text-sm">
                <li><Link href="/about" className="text-slate-700 transition hover:text-zaca-azul dark:text-slate-300 dark:hover:text-zaca-lilas">Sobre o Zacaplace</Link></li>
                <li><Link href="/terms" className="text-slate-700 transition hover:text-zaca-azul dark:text-slate-300 dark:hover:text-zaca-lilas">Termos de Serviço</Link></li>
                <li><Link href="/privacy" className="text-slate-700 transition hover:text-zaca-azul dark:text-slate-300 dark:hover:text-zaca-lilas">Política de Privacidade</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white font-bangers tracking-wide">Ajuda & Suporte</p>
              <ul className="mt-6 space-y-3 text-sm">
                <li><Link href="/contact" className="text-slate-700 transition hover:text-zaca-azul dark:text-slate-300 dark:hover:text-zaca-lilas">Fale com o Zaca</Link></li>
                <li><Link href="/faq" className="text-slate-700 transition hover:text-zaca-azul dark:text-slate-300 dark:hover:text-zaca-lilas">Dúvidas Frequentes</Link></li>
                <li><Link href="/how-to-sell" className="text-slate-700 transition hover:text-zaca-azul dark:text-slate-300 dark:hover:text-zaca-lilas">Como Vender no Zacaplace</Link></li>
                <li><Link href="/how-to-buy" className="text-slate-700 transition hover:text-zaca-azul dark:text-slate-300 dark:hover:text-zaca-lilas">Como Comprar</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-slate-200 dark:border-slate-800 pt-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              &copy; {new Date().getFullYear()} Zacaplace Inc. Todos os direitos reservados. Dedéco, tira a mão daí!
            </p>
            <ul className="mt-4 flex justify-center gap-x-5 sm:mt-0">
              <li>
                <a href="#" target="_blank" rel="noreferrer" className="text-slate-700 transition hover:text-zaca-magenta dark:text-slate-300 dark:hover:text-zaca-magenta" aria-label="Facebook do Zacaplace">
                  <Facebook className="h-5 w-5" />
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/zacaplace_setelagoas?igsh=c3o4bXN2emhoY29o&utm_source=qr" target="_blank" rel="noreferrer" className="text-slate-700 transition hover:text-zaca-magenta dark:text-slate-300 dark:hover:text-zaca-magenta" aria-label="Instagram do Zacaplace">
                  <Instagram className="h-5 w-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
