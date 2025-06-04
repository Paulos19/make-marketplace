// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Bangers } from 'next/font/google';
import './globals.css';
import AuthProvider from './components/AuthProvider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const bangers = Bangers({ 
  subsets: ['latin'], 
  weight: ['400'], 
  variable: '--font-bangers' 
});

export const metadata: Metadata = {
  title: 'MakeStore Marketplace',
  description: 'Your one-stop shop for amazing products.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Adicione a classe da nova fonte ao body ou a um elemento wrapper */}
      <body className={`${inter.variable} ${bangers.variable} font-sans`} suppressHydrationWarning={true}>
        <AuthProvider>
          <main>
            {children}
          </main>
          <Toaster/>
        </AuthProvider>
      </body>
    </html>
  );
}