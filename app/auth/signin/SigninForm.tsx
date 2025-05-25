// components/auth/SigninForm.tsx
"use client";

// Core Next.js and React imports
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Next-Auth imports
import { signIn, getProviders } from "next-auth/react";

// shadcn/ui component imports (ajuste os caminhos se necessário)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// lucide-react icon imports (ajuste os caminhos se necessário)
import { Ghost, ChromeIcon, AlertCircle } from "lucide-react"; // ChromeIcon para Google, Ghost para loading

// Tipagem para os providers do Next-Auth
type Provider = Awaited<ReturnType<typeof getProviders>>;

export default function SigninForm() {
  // State para os providers de autenticação
  const [providers, setProviders] = useState<Provider | null>(null);
  // State para os campos do formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // State para mensagens de erro
  const [error, setError] = useState<string | null>(null);
  // State para feedback de carregamento
  const [isLoading, setIsLoading] = useState(false); // Loading geral do formulário/ação
  const [isLoadingProviders, setIsLoadingProviders] = useState(true); // Loading específico para providers

  // Hooks do Next.js para navegação e parâmetros de URL
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Efeito para buscar os providers de autenticação ao montar o componente
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
  }, []);

  // Handler genérico para signIn (credentials ou OAuth)
  const handleSignIn = async (providerId: string, formData?: any) => {
    setIsLoading(true); // Ativa o loading da ação específica
    setError(null);
    
    const result = await signIn(providerId, {
      redirect: false,
      ...(formData && { ...formData }), // Adiciona email e senha se for 'credentials'
      callbackUrl,
    });

    setIsLoading(false); // Desativa o loading da ação específica

    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        setError("Email ou senha inválidos. Verifique e tente novamente.");
      } else if (result.error.includes("OAuthAccountNotLinked")) {
        const emailMatch = result.error.match(/email (\S+)/);
        const userEmail = emailMatch ? emailMatch[1] : "seu email";
        setError(`Para confirmar sua identidade, entre com a mesma conta (${userEmail}) que você usou originalmente.`);
      } else {
        setError("Ocorreu um erro ao tentar fazer login. Tente mais tarde.");
        console.error("SignIn Error:", result.error);
      }
    } else if (result?.ok) {
      router.push(callbackUrl); // Redireciona em caso de sucesso
    }
  };
  
  // Handler para o submit do formulário de credenciais
  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, preencha o email e a senha.");
      return;
    }
    // Passa 'credentials' como providerId e os dados do formulário
    handleSignIn("credentials", { email, password });
  };

  // Enquanto os providers estão sendo carregados dentro deste componente
  if (isLoadingProviders) {
    return (
      <div className="w-full max-w-md space-y-6 py-10 text-center">
        <Ghost className="w-12 h-12 animate-pulse mb-4 mx-auto text-gray-400 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">Carregando opções de login...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8"> {/* Aumentado space-y para mais respiro */}
      {/* Logo e Título */}
      <div className="text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl">
          MakeStore
        </h1>
        <p className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-400">
          Acesse sua conta para continuar explorando.
        </p>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-700/50">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Formulário de Credenciais */}
      <form onSubmit={handleSubmitCredentials} className="space-y-6">
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
            className="h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 dark:placeholder-gray-500 focus:ring-sky-500 focus:border-sky-500 dark:focus:ring-sky-500 dark:focus:border-sky-500"
          />
        </div>

        <div>
          <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Senha
          </Label>
          <Input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 dark:placeholder-gray-500 focus:ring-sky-500 focus:border-sky-500 dark:focus:ring-sky-500 dark:focus:border-sky-500"
          />
        </div>
        {/* Link para esqueci minha senha (opcional) */}
         <div className="text-right">
            <Link href="/auth/forgot-password" // Crie esta rota se necessário
                className="text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-500 dark:hover:text-sky-400 hover:underline">
                Esqueceu sua senha?
            </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading} // Desabilita se qualquer ação de signin estiver em progresso
          className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 py-3 text-base font-semibold text-white shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
        >
          {isLoading && providers?.credentials?.id === "credentials" ? ( // Verifica se o loading é específico do credentials
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Entrando...
            </div>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      {/* Separador "OU" e Login Social */}
      {providers && Object.values(providers).filter(provider => provider.id !== 'credentials').length > 0 && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <Separator className="dark:bg-gray-700" />
            </div>
          </div>
        </>
      )}
      
      {/* Links Adicionais */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4 space-y-1">
        <p>
          Não tem uma conta?{' '}
          <Link href="/auth/signup" className="font-semibold text-sky-600 hover:underline dark:text-sky-500 dark:hover:text-sky-400">
            Cadastre-se agora
          </Link>
        </p>
        <p className="text-xs">
          <Link href="/privacy-policy" className="hover:underline"> {/* Crie esta página */}
            Política de Privacidade
          </Link>
          {' & '}
          <Link href="/terms-of-service" className="hover:underline"> {/* Crie esta página */}
            Termos de Serviço
          </Link>
        </p>
      </div>
    </div>
  );
}