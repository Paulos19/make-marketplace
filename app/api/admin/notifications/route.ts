import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET: Busca todas as notificações para o painel do admin
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      // Inclui dados relacionados para exibir na UI
      include: {
        reservation: {
          include: {
            product: { select: { name: true, images: true } },
            user: { select: { name: true } }, // Cliente que reservou
          }
        },
        seller: { select: { name: true } } // Vendedor a ser notificado
      }
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Erro ao buscar notificações do admin:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}