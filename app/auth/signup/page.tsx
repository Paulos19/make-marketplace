"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); 

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!name || !email || !password || !whatsappLink) {
      setError("Todos os campos são obrigatórios.");
      setIsLoading(false);
      return;
    }

    if (!whatsappLink.startsWith("https://wa.me/") && !whatsappLink.startsWith("https://api.whatsapp.com/send?phone=")) {
        setError("Link do WhatsApp inválido. Use o formato https://wa.me/SEUNUMERO ou https://api.whatsapp.com/send?phone=SEUNUMERO (com código do país, ex: 55119...).");
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, whatsappLink }),
      });

      const data = await response.json(); 

      if (!response.ok) {
        throw new Error(data.message || "Falha ao registrar. Tente novamente.");
      }
      
      setSuccess("Cadastro realizado com sucesso! Tentando fazer login...");
      
      const loginResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (loginResult?.ok) {
        setSuccess("Login realizado com sucesso! Redirecionando..."); 
        router.push(loginResult.url || '/signin'); 
      } else {
        setError("Cadastro realizado, mas o login automático falhou. Por favor, tente fazer login manualmente.");
        setIsLoading(false); 
      }

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro desconhecido.");
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-950">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
        {}
        <section className="relative flex h-32 items-end bg-gray-900 lg:col-span-6 lg:h-full xl:col-span-7">
          <img
            alt="Painel de maquiagem e produtos de beleza para cadastro" 
            src="/signup.jpg" 
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="hidden lg:relative lg:block lg:p-12">
            <a className="block text-white" href="/">
              <span className="sr-only">Home</span>
              {}
            </a>
          </div>
        </section>

        {}
        <main
          aria-label="Formulário de Cadastro"
          className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-6 lg:px-16 lg:py-12 xl:col-span-5"
        >
          <div className="w-full max-w-md space-y-6">
            {}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 sm:text-3xl md:text-4xl">
                Makeshop
              </h1>
              <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
                Crie sua conta para começar a vender e comprar.
              </p>
            </div>

            {}
            {error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
            {success && !error && ( 
              <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">{success}</p>
              </div>
            )}

            {}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome Completo
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="mt-1 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="mt-1 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Senha
                </Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Crie uma senha forte"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="mt-1 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="whatsappLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Link do WhatsApp <span className="text-xs text-gray-500">(ex: https://wa.me/55119...)</span>
                </Label>
                <Input
                  type="url"
                  id="whatsappLink"
                  name="whatsappLink"
                  autoComplete="tel"
                  placeholder="https://wa.me/SEUNUMEROCOMCODIGOPAIS"
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  required
                  disabled={isLoading}
                  className="mt-1 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 dark:placeholder-gray-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-800 py-3 text-white hover:bg-gray-900 dark:bg-sky-600 dark:hover:bg-sky-700"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cadastrando...
                  </div>
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>
            
            {}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                Já tem uma conta?{' '}
                <Link href="/auth/signin" className="font-medium text-sky-600 hover:underline dark:text-sky-500">
                  Faça login
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}