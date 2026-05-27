"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, EyeOff, Eye, User, Building, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AccountType = 'USER' | 'SELLER';

export default function SignUpPage() {
  const [accountType, setAccountType] = useState<AccountType>('USER');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    if (accountType === 'SELLER' && !whatsappNumber) {
      setError("O número de WhatsApp é obrigatório para Vendedores.");
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
        throw new Error(data.message || "Falha ao registar. Tente novamente.");
      }
      
      toast.success("Conta criada com sucesso!", {
        description: "Vai ser redirecionado para a página de login.",
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
    <section className="min-h-screen w-full relative bg-[#050505] overflow-hidden">
      
      {/* --- UNIFIED CROSSFADE BACKGROUND --- */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
         {/* Base Layer: Image 2 (Right Side) spans full width but is focused right */}
         <div className="absolute inset-0 w-full h-full">
             <Image 
                src="/Gemini_Generated_Image_e4wm4we4wm4we4wm.png"
                alt="Zacaplace Background Right"
                fill
                className="object-cover object-right lg:object-center opacity-100"
                priority
             />
             {/* Subtle overall dark overlay for form readability */}
             <div className="absolute inset-0 bg-black/10"></div>
         </div>

         {/* Top Layer: Image 1 (Left Side) with CSS Mask feathering into Image 2 */}
         <div 
            className="absolute top-0 left-0 h-full hidden lg:block w-[60%]"
            style={{ 
                maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)' 
            }}
         >
             <Image 
                src="/Gemini_Generated_Image_6vp0u46vp0u46vp0.png"
                alt="Zacaplace Sign Up"
                fill
                className="object-cover object-left opacity-100"
                priority
             />
         </div>
      </div>

      {/* --- FOREGROUND CONTENT --- */}
      <div className="relative z-10 flex min-h-screen w-full">
        {/* 40% empty spacer for left side */}
        <div className="hidden lg:block w-[40%]"></div>

        {/* 60% Right Side - Form Container */}
        <div className="w-full lg:w-[60%] flex flex-col relative">
            
            {/* Header / Logo Navigation */}
            <header className="w-full p-6 lg:px-12 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <Image src="/zacalogo.png" alt="Zacaplace Logo" width={140} height={35} className="brightness-0 invert" />
                </Link>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
                    <Link href="/" className="hover:text-white transition-colors">Página Inicial</Link>
                    <Link href="/about" className="hover:text-white transition-colors">Sobre</Link>
                    <Link href="/contact" className="hover:text-white transition-colors">Contacto</Link>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-white/60 hidden sm:inline-block">Português (PT)</span>
                    <Link href="/auth/signin" className="text-white font-semibold">Entrar</Link>
                    <Link href="/auth/signup" className="bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors">
                        Registar
                    </Link>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 w-full flex items-center justify-center p-4 relative">
                <main
                    aria-label="Formulário de Registro"
                    className="w-full max-w-[450px]"
                >
                    <div className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden my-4 lg:my-8">
                        {/* Subtle glow effect inside the card */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>

                        <div className="text-center mb-6 relative z-10">
                            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Criar Conta</h1>
                            <p className="text-white/70 text-sm">Junte-se a nós para comprar ou vender.</p>
                        </div>

                        {/* Account Type Selector */}
                        <div className="flex bg-black/40 rounded-xl p-1 mb-6 relative z-10">
                            <button 
                                type="button"
                                onClick={() => setAccountType('USER')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                                    accountType === 'USER' ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
                                )}
                            >
                                <User className="w-4 h-4" /> Comprador
                            </button>
                            <button 
                                type="button"
                                onClick={() => setAccountType('SELLER')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                                    accountType === 'SELLER' ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
                                )}
                            >
                                <Building className="w-4 h-4" /> Vendedor
                            </button>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-xl bg-red-500/10 backdrop-blur-md p-4 border border-red-500/50 relative z-10">
                                <div className="flex items-start">
                                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-red-200">{error}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            <div>
                                <Input
                                    type="text"
                                    id="name"
                                    placeholder="Nome Completo"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="h-12 bg-white/95 border-0 text-black placeholder:text-gray-500 rounded-xl px-4 font-medium focus-visible:ring-2 focus-visible:ring-white/50"
                                />
                            </div>
                            
                            <div>
                                <Input
                                    type="email"
                                    id="email"
                                    placeholder="Endereço de Email"
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
                                    placeholder="Senha"
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

                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    placeholder="Confirmar Senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="h-12 bg-white/95 border-0 text-black placeholder:text-gray-500 rounded-xl px-4 pr-12 font-medium focus-visible:ring-2 focus-visible:ring-white/50"
                                />
                                <button 
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className={cn("grid transition-all duration-300", accountType === 'SELLER' ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0")}>
                                <div className="overflow-hidden">
                                    <Input
                                        type="tel"
                                        id="whatsappNumber"
                                        placeholder="WhatsApp (ex: 55119...)"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        required={accountType === 'SELLER'}
                                        disabled={isLoading}
                                        className="h-12 bg-white/95 border-0 text-black placeholder:text-gray-500 rounded-xl px-4 font-medium focus-visible:ring-2 focus-visible:ring-white/50"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 mt-2 bg-white hover:bg-gray-100 text-black rounded-xl text-base font-bold shadow-lg transition-all active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                        A Criar Conta...
                                    </div>
                                ) : (
                                    "Registar"
                                )}
                            </Button>
                        </form>
                        
                        {/* Login Link */}
                        <div className="text-center text-sm text-white/70 relative z-10 mt-8">
                            <p>
                                Já tem conta?{' '}
                                <Link href="/auth/signin" className="font-bold text-white hover:underline">
                                    Entrar!
                                </Link>
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
      </div>
    </section>
  );
}