// app/components/layout/Footer.tsx (ou o caminho do seu componente)
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, MapPin, PhoneCall } from 'lucide-react'; // Ícones de exemplo

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'Instagram', href: '#', icon: Instagram },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
    // Adicione ou remova conforme necessário
  ];

  const usefulLinks = [
    { name: 'Sobre Nós', href: '/about' },
    { name: 'Contato', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    // Adicione mais links úteis se tiver
  ];

  const legalLinks = [
    { name: 'Política de Privacidade', href: '/privacy-policy' },
    { name: 'Termos de Serviço', href: '/terms-of-service' },
    { name: 'Política de Cookies', href: '/cookie-policy' },
  ];

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
          {/* Coluna 1: Sobre a Loja */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 hover:opacity-90 transition-opacity">
              MakeStore
            </Link>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Sua loja completa de maquiagens e produtos de beleza para realçar o seu brilho natural. Qualidade e variedade em um só lugar.
            </p>
            <div className="flex space-x-4 mt-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                >
                  <social.icon className="h-6 w-6" />
                </Link>
              ))}
            </div>
          </div>

          {/* Coluna 2: Links Úteis */}
          <div className="mt-8 md:mt-0">
            <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-wider uppercase">
              Navegação
            </h5>
            <ul className="mt-4 space-y-3">
              {usefulLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Legal */}
          <div className="mt-8 md:mt-0">
            <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-wider uppercase">
              Informações
            </h5>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Coluna 4: Contato (Exemplo) */}
          <div className="mt-8 md:mt-0">
            <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-wider uppercase">
              Entre em Contato
            </h5>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2.5 mt-0.5 text-indigo-500 shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Rua Exemplo, 123, Cidade, Estado</span>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 mr-2.5 mt-0.5 text-indigo-500 shrink-0" />
                <a href="mailto:contato@makestore.com" className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                  contato@makestore.com
                </a>
              </li>
              <li className="flex items-start">
                <PhoneCall className="h-5 w-5 mr-2.5 mt-0.5 text-indigo-500 shrink-0" />
                <a href="tel:+5511999999999" className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                  (11) 99999-9999
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha do Copyright */}
        <div className="mt-12 md:mt-16 pt-8 border-t border-gray-200 dark:border-gray-700/50 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {currentYear} MakeStore. Todos os direitos reservados. CNPJ: XX.XXX.XXX/0001-XX.
          </p>
        </div>
      </div>
    </footer>
  );
}