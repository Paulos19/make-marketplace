// app/api/admin/products/[productId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: {
    productId: string;
  };
}

// DELETE: Exclui um produto específico
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const { productId } = params;

    // O Prisma cuidará da exclusão em cascata das reservas relacionadas a este produto
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: 'Produto excluído com sucesso!' }, { status: 200 });
  } catch (error: any) {
    console.error("Erro ao excluir produto:", error);
    if (error.code === 'P2025') { // Erro do Prisma para "registro não encontrado"
      return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}