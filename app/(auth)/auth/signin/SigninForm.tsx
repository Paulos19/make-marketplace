"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getProviders } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"; 
import { toast } from "sonner";

type Provider = Awaited<ReturnType<typeof getProviders>>;

export default function SigninForm() {
  const [providers, setProviders] = useState<Provider | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    const fetchProvidersAsync = async () => {
      try {
        const res = await getProviders();
        setProviders(res);
      } catch (err) {
        console.error("Falha ao buscar providers:", err);
      }
    };
    fetchProvidersAsync();

    if (searchParams.get('emailVerified') === 'true') {
        toast.success(searchParams.get('message') || 'Email verificado com sucesso! Por favor, faça login.');
    }
  }, [searchParams]);

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
        setError("Email ou senha inválidos. Verifique os seus dados.");
      } else if (result.error.includes("OAuthAccountNotLinked")) {
        setError("Para confirmar sua identidade, entre com a mesma conta que usou originalmente.");
      } else {
        setError("Ocorreu um erro ao tentar fazer login. Tente novamente.");
      }
    } else if (result?.ok) {
      router.push(callbackUrl);
    }
  };
  
  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, preencha o email e a senha.");
      return;
    }
    handleSignIn("credentials", { email, password });
  };

  return (
    <div className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle glow effect inside the card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="text-center mb-8 relative z-10">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Olá!</h1>
        <h2 className="text-2xl font-bold text-white tracking-tight">Bem-vindo de volta</h2>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 backdrop-blur-md p-4 border border-red-500/50">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-200">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitCredentials} className="space-y-4 relative z-10">
        <div>
          <Input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="Insira seu Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="h-12 bg-white/95 border-0 text-black placeholder:text-gray-500 rounded-xl px-4 font-medium focus-visible:ring-2 focus-visible:ring-white/50"
          />
        </div>

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-12 bg-white/95 border-0 text-black placeholder:text-gray-500 rounded-xl px-4 pr-12 font-medium focus-visible:ring-2 focus-visible:ring-white/50"
          />
          <button 
             type="button"
             className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
             onClick={() => setShowPassword(!showPassword)}
          >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="text-right pb-2">
            <Link href="/auth/forgot-password"
                className="text-xs font-medium text-white/70 hover:text-white transition-colors">
                Esqueceu a senha?
            </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-white hover:bg-gray-100 text-black rounded-xl text-base font-bold shadow-lg transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
              Processando...
            </div>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      {/* Links Adicionais */}
      <div className="text-center text-sm text-white/70 relative z-10 mt-8">
        <p>
          Ainda não tem conta?{' '}
          <Link href="/auth/signup" className="font-bold text-white hover:underline">
            Criar Conta!
          </Link>
        </p>
      </div>
    </div>
  );
}