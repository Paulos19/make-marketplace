// app/auth/reset-password/ResetPasswordForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordInput } from '@/components/ui/PasswordInput'; // <<< INÍCIO DA CORREÇÃO 1

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token de redefinição não encontrado ou inválido. Por favor, solicite um novo link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao redefinir a senha.');
      }
      
      setSuccess(true);
      toast.success("Senha alterada!", { description: "Sua senha foi redefinida com sucesso. Agora você já pode fazer o login." });

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Link href="/" className="inline-block mx-auto mb-4">
          <Image src="/logo.svg" alt="Zacaplace Logo" width={180} height={45} />
        </Link>
        <CardTitle className="text-2xl font-bangers text-zaca-roxo dark:text-zaca-lilas">
          {success ? 'Tudo Pronto!' : 'Crie sua Nova Senha'}
        </CardTitle>
        <CardDescription>
          {success 
            ? 'Sua senha foi alterada com sucesso. Você já pode usar a nova senha para entrar na sua conta.' 
            : 'Digite e confirme sua nova senha abaixo. Use algo forte, cumpadi!'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center py-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <Link href="/auth/signin">
              <Button className="w-full mt-4 bg-zaca-azul hover:bg-zaca-azul/90">
                <ArrowLeft className="mr-2 h-4 w-4" /> Ir para o Login
              </Button>
            </Link>
          </div>
        ) : error && !token ? (
          <div className="text-center py-6 text-red-600 dark:text-red-400">
              <AlertTriangle className="mx-auto h-16 w-16 mb-4"/>
              <p className="font-semibold">{error}</p>
               <Link href="/auth/forgot-password">
                  <Button variant="link" className="mt-2">Solicitar um novo link</Button>
               </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* <<< INÍCIO DA CORREÇÃO 2: Usar PasswordInput >>> */}
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <PasswordInput
                id="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme a Nova Senha</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {/* <<< FIM DA CORREÇÃO 2 >>> */}
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Nova Senha
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}