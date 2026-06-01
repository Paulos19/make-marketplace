'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function checkAgentAccess() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return { hasAccess: false, error: "Usuário não autenticado." };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        role: true,
        stripeSubscriptionStatus: true,
      }
    });

    if (!user) {
      return { hasAccess: false, error: "Usuário não encontrado no banco." };
    }

    // O agente está disponível para vendedores com assinatura ativa ou administradores
    const isSellerWithPlan = user.role === UserRole.SELLER && 
      (user.stripeSubscriptionStatus === "ACTIVE" || user.stripeSubscriptionStatus === "TRIALING");
    
    const isAdmin = user.role === UserRole.ADMIN;

    if (isSellerWithPlan || isAdmin) {
      return { hasAccess: true };
    }

    return { hasAccess: false, error: "Este recurso é exclusivo para o plano Meu Catálogo no Zaca." };
  } catch (error) {
    console.error("Erro ao verificar acesso ao agente:", error);
    return { hasAccess: false, error: "Erro interno ao verificar permissões." };
  }
}
