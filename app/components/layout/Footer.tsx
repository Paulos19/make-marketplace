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
    <Link href={href} className="text-white/60 transition-colors duration-300 hover:text-white hover:translate-x-1 inline-block">
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
    <footer className="relative bg-[#020202] border-t border-white/5 text-white overflow-hidden">
      {/* Glow border top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      {/* Subtle ambient glow in the background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[400px] bg-gradient-to-t from-blue-900/10 via-purple-900/5 to-transparent pointer-events-none rounded-t-[100%]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
            {/* Coluna Principal: Logo, Descrição e Newsletter */}
            <div className="lg:col-span-2 space-y-6">
              <Link href="/" className="inline-block transition-transform duration-300 hover:scale-105">
                <Image src="/zacalogo.png" alt="Zacaplace Logo" width={180} height={50} className="brightness-0 invert" priority />
              </Link>

              <p className="max-w-md text-white/60 leading-relaxed font-light">
                O seu marketplace de achadinhos incríveis! Encontre as melhores ofertas e venda os seus produtos de forma fácil e segura. É um estouro, psit!
              </p>

              <form className="mt-8 relative" onSubmit={handleNewsletterSubmit}>
                <label htmlFor="email-newsletter" className="block text-sm font-semibold text-white/90 mb-3 tracking-wide">
                  FIQUE POR DENTRO DAS NOVIDADES
                </label>
                <div className="relative max-w-md flex items-center">
                  <Input
                    type="email"
                    id="email-newsletter"
                    placeholder="Seu melhor e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14 rounded-full pl-6 pr-32 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/30 backdrop-blur-md"
                    disabled={isLoading}
                  />
                  <Button type="submit" className="absolute right-1.5 h-11 rounded-full px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assinar'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Coluna Institucional */}
            <div className="lg:pl-8">
              <p className="font-bold text-white tracking-wider mb-6 uppercase text-sm">Institucional</p>
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
              <p className="font-bold text-white tracking-wider mb-6 uppercase text-sm">Ajuda & Suporte</p>
              <ul className="space-y-4 text-sm">
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
        <div className="flex flex-col md:flex-row items-center justify-between border-t border-white/5 py-8 mt-4">
          <p className="text-sm text-white/40 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Zacaplace Inc. Todos os direitos reservados.<br className="md:hidden"/> <span className="hidden md:inline">|</span> Dedéco, tira a mão daí!
          </p>

          <div className="flex items-center space-x-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-blue-600 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-300">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:border-transparent hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all duration-300">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
