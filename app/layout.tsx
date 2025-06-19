import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import AuthProvider from "./components/AuthProvider";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Configuração da nova fonte 'Sora'
const sora = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Zacaplace",
  description: "O seu marketplace de achadinhos!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Busca o tema do banco de dados para aplicar as cores globalmente
  const theme = await prisma.themeSettings.findFirst();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Adiciona as variáveis de cor do tema no <head> */}
        <style>
          {`
            :root {
              --primary: ${theme?.zaca_azul || '#000000'};
              --secondary: ${theme?.zaca_magenta || '#ffffff'};
              --accent: ${theme?.zaca_roxo || '#333333'};
            }
          `}
        </style>
      </head>
      {/* Aplica a nova fonte na classe do body */}
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          sora.variable
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
  );
}
