import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

interface RouteParams {

const changePasswordSchema = z.object({

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();

    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }
    const { newPassword } = validation.data;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return NextResponse.json({ message: 'Senha do usuário atualizada com sucesso!' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const { userId } = params;

    if (userId === session.user.id) {
      return NextResponse.json({ message: 'O administrador não pode se autoexcluir.' }, { status: 400 });
    }

    const userToDelete = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!userToDelete) {
        return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'Usuário excluído com sucesso!' }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    if (error.code === 'P2025') { // Código de erro do Prisma para "registro não encontrado"
        return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}