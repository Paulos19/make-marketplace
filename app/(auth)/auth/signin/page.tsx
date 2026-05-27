"use client";

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SigninForm from './SigninForm';
import { Loader2 } from 'lucide-react';

const SigninFormSkeleton = () => {
  return (
    <div className="w-full max-w-md space-y-8 animate-pulse bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-[2rem] shadow-2xl">
      <div className="text-center">
        <div className="h-8 bg-white/20 rounded w-1/2 mx-auto mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-3/4 mx-auto mt-4"></div>
      </div>
      <div className="space-y-6 mt-8">
        <div>
          <div className="h-12 bg-white/10 rounded-xl w-full"></div>
        </div>
        <div>
          <div className="h-12 bg-white/10 rounded-xl w-full"></div>
        </div>
        <div className="h-12 bg-white/20 rounded-xl w-full"></div>
      </div>
      <div className="flex justify-center mt-8">
         <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    </div>
  );
};

export default function LoginPageContainer() {
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
                alt="Zacaplace Sign In"
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
                    aria-label="Formulário de Login"
                    className="w-full max-w-[450px]"
                >
                    <Suspense fallback={<SigninFormSkeleton />}>
                        <SigninForm />
                    </Suspense>
                </main>
            </div>
        </div>
      </div>
    </section>
  );
}