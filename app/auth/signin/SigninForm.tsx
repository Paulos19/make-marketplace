// components/auth/SigninForm.tsx
"use client";

// Core Next.js and React imports
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from 'next/image'; // <<< Adicionar import do Image

// Next-Auth imports
import { signIn, getProviders } from "next-auth/react";

// shadcn/ui component imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// lucide-react icon imports
import { Ghost, AlertCircle, LogIn } from "lucide-react"; // Removido ChromeIcon, adicionado LogIn

// Tipagem para os providers do Next-Auth
type Provider = Awaited<ReturnType<typeof getProviders>>;

export default function SigninForm() {
  const [providers, setProviders] = useState<Provider | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Efeito para buscar os providers de autenticação
  useEffect(() => {
    const fetchProvidersAsync = async () => {
      setIsLoadingProviders(true);
      try {
        const res = await getProviders();
        setProviders(res);
      } catch (err) {
        console.error("Falha ao buscar providers:", err);
        setError("Não foi possível carregar as opções de login.");
      } finally {
        setIsLoadingProviders(false);
      }
    };
    fetchProvidersAsync();

    // Exibe a mensagem de sucesso se o email foi verificado
    if (searchParams.get('emailVerified') === 'true') {
        // Você pode usar 'sonner' aqui se quiser um toast mais elegante
        // toast.success(searchParams.get('message') || 'Email verificado com sucesso! Por favor, faça login.');
        // Por simplicidade, usaremos um alerta ou uma mensagem no estado de erro/sucesso.
    }

  }, [searchParams]);

  // Handler genérico para signIn
  const handleSignIn = async (providerId: string, formData?: any) => {
    setIsLoading(true);
    setError(null);
    
    const result = await signIn(providerId, {
      redirect: false,
      ...(formData && { ...formData }),
      callbackUrl,
    });

    setIsLoading(false);

    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        setError("Email ou senha inválidos. Ô psit, verifica aí, cumpadi!");
      } else if (result.error.includes("OAuthAccountNotLinked")) {
        const emailMatch = result.error.match(/email (\S+)/);
        const userEmail = emailMatch ? emailMatch[1] : "seu email";
        setError(`Para confirmar sua identidade, entre com a mesma conta (${userEmail}) que você usou originalmente.`);
      } else {
        setError("Ocorreu um erro ao tentar fazer login. Ai, pastor!");
        console.error("SignIn Error:", result.error);
      }
    } else if (result?.ok) {
      router.push(callbackUrl);
    }
  };
  
  // Handler para o submit do formulário de credenciais
  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, preencha o email e a senha, carinho!");
      return;
    }
    handleSignIn("credentials", { email, password });
  };

  if (isLoadingProviders) {
    return (
      <div className="w-full max-w-md space-y-6 py-10 text-center">
        <Ghost className="w-12 h-12 animate-pulse mb-4 mx-auto text-zaca-roxo dark:text-zaca-lilas" />
        <p className="text-slate-500 dark:text-slate-400">Carregando as 'Zacarias-opções' de login...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Logo e Título */}
      <div className="text-center">
        <Link href="/">
            <Image
                src="/loginLogo.png"
                alt="Zacaplace Logo"
                width={200} // Ajuste a largura conforme o design do seu logo
                height={60} // Ajuste a altura conforme o design do seu logo
                className="mx-auto"
                priority
            />
        </Link>
        <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Entre na sua conta pra ver os achadinhos, psit!
        </p>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="rounded-md bg-red-100 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-700/50">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-zaca-vermelho mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Formulário de Credenciais */}
      <form onSubmit={handleSubmitCredentials} className="space-y-4">
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
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
            className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50 dark:placeholder-slate-500 focus:ring-zaca-roxo focus:border-zaca-roxo dark:focus:ring-zaca-lilas dark:focus:border-zaca-lilas"
          />
        </div>

        <div>
          <Label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Senha
          </Label>
          <Input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Sua senha secreta"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50 dark:placeholder-slate-500 focus:ring-zaca-roxo focus:border-zaca-roxo dark:focus:ring-zaca-lilas dark:focus:border-zaca-lilas"
          />
        </div>
        
        <div className="text-right">
            <Link href="/auth/forgot-password" // Futura página de esqueci a senha
                className="text-xs font-medium text-zaca-azul hover:text-zaca-roxo dark:text-zaca-lilas dark:hover:text-white hover:underline">
                Esqueceu sua senha?
            </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-zaca-roxo to-zaca-magenta hover:from-zaca-roxo/90 hover:to-zaca-magenta/90 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.03]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Entrando na 'Zacafesta'...
            </div>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      {/* Separador "OU" e Login Social */}
      {providers && Object.values(providers).filter(provider => provider.id !== 'credentials' && provider.id !== 'email').length > 0 && (
        <>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <Separator className="dark:bg-slate-700" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
             {/* Aqui seriam renderizados botões de login social como Google, se configurado */}
          </div>
        </>
      )}
      
      {/* Links Adicionais */}
      <div className="text-center text-sm text-slate-600 dark:text-slate-400 pt-2 space-y-1">
        <p>
          É novo na 'Zoropa'?{' '}
          <Link href="/auth/signup" className="font-semibold text-zaca-azul hover:text-zaca-roxo dark:text-zaca-lilas dark:hover:text-white hover:underline">
            Crie sua conta, cumpadi!
          </Link>
        </p>
      </div>
    </div>
  );
}