"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingBag, UserPlus, X } from "lucide-react";
import Image from "next/image";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] p-0 border-0 overflow-hidden bg-[#050505] shadow-2xl rounded-3xl">
        <div className="relative w-full h-[550px] flex">
          
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
                 <div className="absolute inset-0 bg-black/20"></div>
             </div>

             {/* Top Layer: Image 1 (Left Side) with CSS Mask feathering into Image 2 */}
             <div 
                className="absolute top-0 left-0 h-full hidden sm:block w-[60%]"
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
          <div className="relative z-10 flex w-full h-full">
             <DialogClose asChild>
                <Button variant="ghost" className="absolute right-4 top-4 h-10 w-10 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white z-50 transition-colors">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Fechar</span>
                </Button>
             </DialogClose>

             {/* 40% empty spacer for left side (only on larger screens) */}
             <div className="hidden sm:block w-[40%]"></div>
             
             {/* 60% Right Side - Content */}
             <div className="w-full sm:w-[60%] flex items-center justify-center p-6 sm:p-12 relative">
                 {/* Glassmorphic card */}
                 <div className="w-full max-w-sm bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden text-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>

                    <DialogTitle className="text-3xl font-bold text-white mb-2 tracking-tight">
                        Chegue chegando!
                    </DialogTitle>
                    <DialogDescription className="text-white/70 text-sm mb-6">
                        Crie a sua conta ou faça login para aproveitar as melhores ofertas e produtos exclusivos.
                    </DialogDescription>
                    
                    <div className="grid gap-4 py-2 relative z-10">
                        <Button asChild onClick={onClose} className="w-full h-12 bg-white hover:bg-gray-100 text-black rounded-xl text-base font-bold shadow-lg transition-all active:scale-[0.98]">
                            <Link href="/auth/signup">
                                <UserPlus className="mr-2 h-5 w-5" />
                                Criar Conta
                            </Link>
                        </Button>
                        <Button asChild variant="outline" onClick={onClose} className="w-full h-12 bg-black/40 hover:bg-black/60 text-white border-white/20 rounded-xl text-base font-bold shadow-lg transition-all active:scale-[0.98]">
                            <Link href="/auth/signin">
                                <ShoppingBag className="mr-2 h-5 w-5" />
                                Entrar
                            </Link>
                        </Button>
                    </div>

                    <p className="text-xs text-white/50 mt-6 relative z-10">
                        Ao continuar, você concorda com os nossos{" "}
                        <Link href="/terms" className="underline hover:text-white transition-colors">
                            Termos
                        </Link>{" "}
                        e{" "}
                        <Link href="/privacy" className="underline hover:text-white transition-colors">
                            Privacidade
                        </Link>
                        .
                    </p>
                 </div>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
