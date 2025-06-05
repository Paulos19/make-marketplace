// app/auth/forgot-password/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao enviar a solicitação.');
      }
      
      // Mesmo se o email não existir, mostramos uma mensagem de sucesso por segurança
      setSubmitted(true);
      toast.success("Solicitação enviada!", { description: data.message });

    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950 px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mx-auto mb-4">
            <Image src="/logo.svg" alt="Zacaplace Logo" width={180} height={45} />
          </Link>
          <CardTitle className="text-2xl font-bangers text-zaca-roxo dark:text-zaca-lilas">
            {submitted ? 'Verifique seu Email' : 'Esqueceu sua Senha?'}
          </CardTitle>
          <CardDescription>
            {submitted 
              ? 'Enviamos um link para o seu email. Siga as instruções para criar uma nova senha, psit!' 
              : 'Sem estresse, cumpadi! Digite seu email abaixo e enviaremos um link para você criar uma nova senha.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-6">
              <MailCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <Link href="/auth/signin">
                <Button className="w-full mt-4 bg-zaca-azul hover:bg-zaca-azul/90">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Seu Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="didi@trapalhoes.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Link de Redefinição
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}