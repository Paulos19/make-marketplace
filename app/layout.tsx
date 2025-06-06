import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import AuthProvider from '@/app/components/AuthProvider';
import prisma from '@/lib/prisma';

const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const fontBangers = Montserrat({ subsets: ['latin'], weight: '700', variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Zacaplace - O Marketplace dos Achadinhos',
  description: 'Compre e venda produtos de maquiagem com os melhores preços!',
};

// Função para buscar o tema do banco de dados
async function getThemeSettings() {
  try {
    const settings = await prisma.themeSettings.findUnique({
      where: { id: "global_theme_settings" },
    });
    return settings;
  } catch (error) {
    console.error("Não foi possível buscar as configurações de tema:", error);
    return null; // Retorna nulo em caso de erro
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemeSettings();

  // Gera a string de estilos CSS para injetar no <head>
  // Apenas sobrescreve as variáveis que foram salvas no banco.
  // Se um valor for nulo ou uma string vazia, a variável não será gerada,
  // e o CSS usará o valor padrão definido em globals.css.
  const dynamicThemeStyle = `
    :root {
      ${theme?.zaca_roxo ? `--zaca-roxo: ${theme.zaca_roxo};` : ''}
      ${theme?.zaca_azul ? `--zaca-azul: ${theme.zaca_azul};` : ''}
      /* Adicione outras variáveis aqui no futuro */
    }
  `;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Injeta os estilos do tema dinamicamente */}
        <style dangerouslySetInnerHTML={{ __html: dynamicThemeStyle }} />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable, fontBangers.variable)}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}