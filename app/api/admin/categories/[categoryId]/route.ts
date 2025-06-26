import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

interface RouteParams {
  params: { categoryId: string };
}

const categorySchema = z.object({
  name: z.string().min(2, "O nome da categoria deve ter no mínimo 2 caracteres."),
});


export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }
    
    const { categoryId } = params;
    const body = await request.json();
    const validation = categorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }
    const { name } = validation.data;

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name },
    });

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}


export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const { categoryId } = params;

    
    
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: 'Categoria excluída com sucesso' }, { status: 200 });
  } catch (error: unknown) {
    console.error("Erro ao excluir categoria:", error);
    
    if (error.code === 'P2003') {
        return NextResponse.json({ message: 'Não é possível excluir esta categoria pois ela está associada a um ou mais produtos.'}, { status: 409 });
    }
    if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Categoria não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}