"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      
      setSubmitted(true);
      toast.success("Solicitação enviada!", { description: data.message });

    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro desconhecido.');
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
                alt="Zacaplace Forgot Password"
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
                    aria-label="Formulário de Redefinição de Senha"
                    className="w-full max-w-[450px]"
                >
                    <div className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden my-4 lg:my-8">
                        {/* Subtle glow effect inside the card */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>

                        <div className="text-center mb-6 relative z-10">
                            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                                {submitted ? 'Verifique o seu Email' : 'Recuperar Senha'}
                            </h1>
                            <p className="text-white/70 text-sm">
                                {submitted 
                                    ? 'Enviámos um link de recuperação para o seu email. Por favor, siga as instruções para criar uma nova senha.' 
                                    : 'Insira o seu email abaixo e enviaremos um link para redefinir a sua senha.'}
                            </p>
                        </div>

                        {submitted ? (
                            <div className="text-center py-6 relative z-10">
                                <MailCheck className="mx-auto h-16 w-16 text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                                <Link href="/auth/signin" className="block w-full">
                                    <Button className="w-full h-12 bg-white hover:bg-gray-100 text-black rounded-xl text-base font-bold shadow-lg transition-all active:scale-[0.98]">
                                        <ArrowLeft className="mr-2 h-5 w-5" /> Voltar ao Login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
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
                                
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 mt-2 bg-white hover:bg-gray-100 text-black rounded-xl text-base font-bold shadow-lg transition-all active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                            Processando...
                                        </div>
                                    ) : (
                                        "Enviar Link"
                                    )}
                                </Button>
                                
                                <div className="text-center mt-6">
                                    <Link href="/auth/signin" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Voltar ao Login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </main>
            </div>
        </div>
      </div>
    </section>
  );
}