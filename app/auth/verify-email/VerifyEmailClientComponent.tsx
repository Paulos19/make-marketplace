// app/auth/verify-email/VerifyEmailClientComponent.tsx
"use client";

import { useEffect, useState, Suspense } from 'react'; // Import Suspense aqui também se for usar nested
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailClientComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu email, um momentinho...');

  useEffect(() => {
    if (!token) {
      setMessage("Token de verificação não encontrado ou inválido. Por favor, tente o link do seu email novamente ou solicite um novo.");
      setStatus('error');
      return;
    }

    const verifyToken = async () => {
      setStatus('loading');
      try {
        // Substitua '/api/auth/confirm-email' pelo seu endpoint real de verificação
        const response = await fetch(`/api/auth/confirm-email`, { // Exemplo de endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Falha ao verificar o email.');
        }

        setMessage(data.message || 'Email verificado com sucesso! Você já pode fazer login.');
        setStatus('success');
        
        // Opcional: redirecionar para o login após alguns segundos
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);

      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        setStatus('error');
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <Card className="w-full max-w-md shadow-xl dark:bg-slate-800/70">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bangers text-zaca-roxo dark:text-zaca-lilas">
          {status === 'loading' && "Verificando Email do Zaca..."}
          {status === 'success' && "Email Verificado, Cumpadi!"}
          {status === 'error' && "Xiii, Deu Ruim na Verificação!"}
        </CardTitle>
        {status !== 'loading' && (
            <CardDescription className="pt-2 dark:text-slate-400">{message}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-zaca-azul animate-spin" />
            <p className="text-slate-600 dark:text-slate-300">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500" />
            <Button asChild className="mt-4 bg-zaca-azul hover:bg-zaca-azul/90 text-white">
              <Link href="/auth/signin">Ir para Login</Link>
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertTriangle className="h-12 w-12 text-zaca-vermelho" />
            <Button asChild variant="outline" className="mt-4 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              <Link href="/">Voltar para Home</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}