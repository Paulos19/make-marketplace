// app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET: Lista todos os produtos da plataforma para o admin
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      include: {
        user: { // Inclui os dados do vendedor (usuário)
          select: {
            name: true,
            email: true,
          },
        },
        categories: { // Inclui as categorias do produto
          select: {
            name: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar todos os produtos para o admin:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}