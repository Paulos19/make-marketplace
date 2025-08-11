
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
      <DialogContent className="sm:max-w-md p-0 rounded-lg">
        <div className="relative">
          <Image
            src="/login.png"
            alt="Promoção"
            width={500}
            height={200}
            className="w-full h-auto rounded-t-lg"
          />
          <DialogClose asChild>
            <Button variant="ghost" className="absolute right-2 top-2 h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </div>
        <div className="p-6 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Chegue chegando!</DialogTitle>
            <DialogDescription className="mt-2">
              Crie sua conta ou faça login para aproveitar as melhores ofertas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button asChild size="lg" onClick={onClose} className="bg-primary hover:bg-primary/90">
              <Link href="/auth/signup">
                <UserPlus className="mr-2 h-5 w-5" />
                Criar Conta
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" onClick={onClose}>
              <Link href="/auth/signin">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Entrar
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ao criar uma conta, você concorda com nossos{" "}
            <Link href="/terms" className="underline hover:text-primary">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
