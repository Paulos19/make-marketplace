'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Sub-componente para os links do rodapé para evitar repetição
const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link href={href} className="text-muted-foreground transition-colors hover:text-primary">
        {children}
    </Link>
  </li>
)

export default function Footer() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) {
      toast.error('Por favor, insira o seu e-mail.')
      return
    }
    setIsLoading(true)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Ocorreu um erro ao inscrever-se.')
      }

      toast.success('Inscrição realizada com sucesso! Fique de olho nas novidades.')
      setEmail('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao inscrever-se.')
    } finally {
      setIsLoading(false)
    }
  }

  const institutionalLinks = [
    { href: '/about', label: 'Sobre o Zacaplace' },
    { href: '/terms', label: 'Termos de Serviço' },
    { href: '/privacy', label: 'Política de Privacidade' },
  ]

  const supportLinks = [
    { href: '/contact', label: 'Fale com o Zaca' },
    { href: '/faq', label: 'Dúvidas Frequentes' },
    { href: '/how-to-sell', label: 'Como Vender no Zacaplace' },
    { href: '/how-to-buy', label: 'Como Comprar' },
  ]

  return (
    <footer className="border-t bg-slate-100 dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
            {/* Coluna Principal: Logo, Descrição e Newsletter */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/zacalogo.png" alt="Zacaplace Logo" width={200} height={100} />
              </Link>

              <p className="mt-4 max-w-sm text-muted-foreground">
                O seu marketplace de achadinhos incríveis! Encontre as melhores ofertas e venda os seus produtos de forma fácil e segura. É um estouro, psit!
              </p>

              <form className="mt-6" onSubmit={handleNewsletterSubmit}>
                <label htmlFor="email-newsletter" className="block text-sm font-medium text-foreground">
                  Cadastre o seu e-mail para não perder nenhuma promoção
                </label>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    id="email-newsletter"
                    placeholder="zacaplace@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button type="submit" className="bg-zaca-azul hover:bg-zaca-azul/90" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Quero Receber!'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Coluna Institucional */}
            <div>
              <p className="font-semibold text-foreground">Institucional</p>
              <ul className="mt-4 space-y-2 text-sm">
                {institutionalLinks.map((link) => (
                  <FooterLink key={link.href} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </ul>
            </div>

            {/* Coluna Ajuda & Suporte */}
            <div>
              <p className="font-semibold text-foreground">Ajuda & Suporte</p>
              <ul className="mt-4 space-y-2 text-sm">
                {supportLinks.map((link) => (
                  <FooterLink key={link.href} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="flex flex-col items-center justify-between border-t py-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Zacaplace Inc. Todos os direitos reservados. Dedéco, tira a mão daí!
          </p>

          <div className="mt-4 flex items-center space-x-4 sm:mt-0">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
