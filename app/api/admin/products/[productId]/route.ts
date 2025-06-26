import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

interface RouteParams {

const updateProductSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres.").optional(),
  categoryId: z.string().optional(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const { productId } = params;
    const body = await request.json();

    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: validation.data,
    });

    revalidatePath('/admin-dashboard/products');
    revalidatePath(`/products/${productId}`);
    revalidatePath('/');


    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar produto pelo admin:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}


export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const { productId } = params;

    await prisma.product.delete({
      where: { id: productId },
    });
    
    revalidatePath('/admin-dashboard/products');
    revalidatePath('/');
    revalidatePath('/products');

    return NextResponse.json({ message: 'Produto excluído com sucesso!' }, { status: 200 });
  } catch (error: any) {
    console.error("Erro ao excluir produto:", error);
    if (error.code === 'P2025') { 
      return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}