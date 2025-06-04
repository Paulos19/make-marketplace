// app/auth/verify-email/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificação não encontrado na URL.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        if (response.ok) {
          setStatus('success');
          setMessage('Seu e-mail foi verificado com sucesso! Agora você pode fazer login.');
        } else {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.error || 'Falha na verificação do e-mail. Por favor, tente novamente.');
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        setStatus('error');
        setMessage('Ocorreu um erro ao tentar verificar seu e-mail. Tente novamente mais tarde.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-4 text-center">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full space-y-6 border border-gray-200 dark:border-gray-800">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-16 w-16 text-sky-500 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Verificando seu E-mail...</h1>
            <p className="text-gray-600 dark:text-gray-400">Por favor, aguarde enquanto confirmamos seu endereço de e-mail.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">E-mail Verificado!</h1>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <Button asChild className="w-full bg-sky-600 hover:bg-sky-700 text-white">
              <Link href="/auth/signin">Ir para o Login</Link>
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Erro na Verificação</h1>
            <p className="text-red-600 dark:text-red-400">{message}</p>
            <Button asChild variant="outline" className="w-full dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <Link href="/auth/signup">Tentar Registrar Novamente</Link>
            </Button>
            {/* Opcional: Adicionar botão para reenviar email de verificação, se você criar uma rota para isso */}
            {/* <Button variant="ghost" onClick={handleResendEmail} className="mt-2 text-sm">Reenviar E-mail</Button> */}
          </>
        )}
      </div>
    </div>
  );
}