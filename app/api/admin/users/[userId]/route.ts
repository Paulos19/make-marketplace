import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Ajuste o caminho se necessário
import prisma from '@/lib/prisma';

interface RouteContext {
  params: {
    userId?: string;
  };
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar se o usuário está autenticado e é o admin
    if (!session || session.user?.role !== 'ADMIN') { // MODIFICADO AQUI
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // Opcional: Verificar se o admin não está tentando se auto-deletar
    // Assumindo que o ID do usuário na sessão é session.user.id
    if (userId === session.user.id) { 
      return NextResponse.json({ message: 'Admin cannot delete self' }, { status: 400 });
    }

    // Deletar o usuário
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User deleted successfully', deletedUser }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting user for admin:", error);
    if (error.code === 'P2025') { // Código de erro do Prisma para registro não encontrado
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Could not delete user' }, { status: 500 });
  }
}