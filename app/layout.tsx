import type { Metadata } from 'next'
import { Inter } from 'next/font/google' // Importar a fonte Inter
import AuthProvider from './components/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import { cn } from '@/lib/utils'

// Configurar a fonte Inter com pesos diferentes e uma variável CSS
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Zacaplace',
  description: 'Seu marketplace de achadinhos',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Simula a busca de dados do tema
  const themeSettings = {
    primaryColor: '#5D3A9E',
    secondaryColor: '#FFFFFF',
    accentColor: '#F2B705',
    backgroundColor: '#F2F2F2',
    textColor: '#0D0D0D',
  }

  const customStyles = `
    :root {
      --primary-color: ${themeSettings.primaryColor};
      --secondary-color: ${themeSettings.secondaryColor};
      --accent-color: ${themeSettings.accentColor};
      --background-color: ${themeSettings.backgroundColor};
      --text-color: ${themeSettings.textColor};
    }
  `

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <style>{customStyles}</style>
      </head>
      {/* Aplicar a classe da fonte no body usando a variável CSS.
        A função `cn` ajuda a mesclar as classes do Tailwind de forma limpa.
      */}
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
        )}
      >
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <main className="flex-grow">{children}</main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}