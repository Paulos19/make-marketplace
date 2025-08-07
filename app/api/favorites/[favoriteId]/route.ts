import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Rota DELETE para remover um favorito específico
export async function DELETE(
  request: Request,
  { params }: { params: { favoriteId: string } }
) {
  const session = await getServerSession(authOptions);
  const { favoriteId } = params;

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (!favoriteId) {
    return NextResponse.json({ error: 'ID do favorito não fornecido.' }, { status: 400 });
  }

  try {
    // Primeiro, verifica se o favorito pertence ao usuário logado
    const favorite = await prisma.favorite.findUnique({
      where: {
        id: favoriteId,
      },
    });

    if (!favorite || favorite.userId !== session.user.id) {
      return NextResponse.json({ error: 'Favorito não encontrado ou não pertence ao usuário.' }, { status: 404 });
    }

    // Se pertence, deleta o favorito
    await prisma.favorite.delete({
      where: {
        id: favoriteId,
      },
    });

    return NextResponse.json({ message: 'Favorito removido com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error("Erro ao deletar favorito:", error);
    return NextResponse.json({ error: 'Erro interno do servidor ao remover favorito.' }, { status: 500 });
  }
}