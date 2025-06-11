"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, User, Building } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PasswordInput } from "@/components/ui/PasswordInput"; // <<< INÍCIO DA CORREÇÃO 1: Importar o novo componente

type AccountType = 'USER' | 'SELLER';

export default function SignUpPage() {
  const [accountType, setAccountType] = useState<AccountType>('USER');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("As senhas não coincidem. Verifica aí, cumpadi!");
      return;
    }

    setIsLoading(true);

    if (accountType === 'SELLER' && !whatsappNumber) {
      setError("O número do WhatsApp é obrigatório para Vendedores.");
      setIsLoading(false);
      return;
    }
    
    const whatsappLink = accountType === 'SELLER' 
      ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
      : null;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword, whatsappLink, role: accountType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha ao registrar. Tente novamente.");
      }
      
      toast.success("Cadastro realizado com sucesso!", {
        description: "Você será redirecionado para a página de login para entrar.",
        duration: 3000,
      });

      setTimeout(() => {
        router.push('/auth/signin?signup=success');
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-slate-50 dark:bg-slate-950">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
        <aside className="relative flex h-32 items-end bg-gray-900 lg:col-span-5 lg:h-full xl:col-span-6">
          <Image
            alt="Painel de maquiagem Zacaplace"
            src="/signup.jpg"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            fill
            priority
          />
          <div className="hidden lg:relative lg:block lg:p-12">
            <Link className="block" href="/">
              <Image className="bg-transparent backdrop:blur-md border-sky-100" src="/zacalogo1.svg" alt="Zacaplace Logo" width={400} height={50} />
            </Link>
            <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl md:text-4xl font-bangers tracking-wider filter drop-shadow-lg">
              Bem-vindo à Turma do Zaca!
            </h2>
            <p className="mt-4 leading-relaxed text-white/90">
              Crie sua conta e comece a vender seus achadinhos ou encontrar as melhores ofertas da praça!
            </p>
          </div>
        </aside>

        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl md:text-4xl font-bangers text-zaca-roxo dark:text-zaca-lilas">
                Crie sua Conta
              </h1>
              <p className="mt-2 leading-relaxed text-slate-500 dark:text-slate-400">
                Escolha seu tipo de conta e preencha os dados abaixo.
              </p>
            </div>
            
            <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <Label htmlFor="account-type-switch" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 text-center">
                    Qual tipo de conta você quer, cumpadi?
                </Label>
                <div className="flex items-center space-x-4 justify-center">
                    <div className={cn("flex flex-col items-center gap-1 transition-colors", accountType === 'USER' ? 'text-zaca-azul' : 'text-slate-500')}>
                        <User className="h-6 w-6"/>
                        <span className="text-sm font-semibold">Quero Comprar</span>
                    </div>
                    <Switch
                        id="account-type-switch"
                        checked={accountType === 'SELLER'}
                        onCheckedChange={(checked) => setAccountType(checked ? 'SELLER' : 'USER')}
                        aria-label="Alternar entre conta de comprador e vendedor"
                    />
                    <div className={cn("flex flex-col items-center gap-1 transition-colors", accountType === 'SELLER' ? 'text-zaca-magenta' : 'text-slate-500')}>
                        <Building className="h-6 w-6"/>
                        <span className="text-sm font-semibold">Quero Vender</span>
                    </div>
                </div>
            </div>
            
            {error && (
              <div className="rounded-md bg-red-100 dark:bg-red-900/30 p-3 text-center text-sm font-medium text-zaca-vermelho dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input type="text" id="name" placeholder="Seu nome, carinho!" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} className="mt-1"/>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input type="email" id="email" placeholder="seuemail@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="mt-1"/>
              </div>
              {/* <<< INÍCIO DA CORREÇÃO 2: Usar PasswordInput >>> */}
              <div>
                <Label htmlFor="password">Senha</Label>
                <PasswordInput id="password" placeholder="Uma senha bem forte, psit!" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="mt-1"/>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirme a Senha</Label>
                <PasswordInput id="confirmPassword" placeholder="Repete a senha aqui, cumpadi!" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} className="mt-1"/>
              </div>
              {/* <<< FIM DA CORREÇÃO 2 >>> */}
              
              {accountType === 'SELLER' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
                  <Label htmlFor="whatsappNumber">Número do WhatsApp (com DDD)</Label>
                  <Input
                    type="tel"
                    id="whatsappNumber"
                    placeholder="Ex: 5511987654321"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    required={accountType === 'SELLER'}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Apenas números. O link será criado automaticamente.</p>
                </motion.div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-zaca-roxo to-zaca-magenta hover:from-zaca-roxo/90 hover:to-zaca-magenta/90 py-3 text-base font-semibold text-white shadow-lg">
                {isLoading ? (
                  <><Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" /> Cadastrando o novo trapalhão...</>
                ) : (
                  `Criar Conta de ${accountType === 'USER' ? 'Comprador' : 'Vendedor'}`
                )}
              </Button>
            </form>
            
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              <p>Já faz parte da turma?{' '}
                <Link href="/auth/signin" className="font-semibold text-zaca-azul hover:underline dark:text-zaca-lilas">
                  Entre na sua conta
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}