import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Ajuste o caminho se necessário
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, image, whatsappLink } = body;

    // Validação básica (pode ser expandida)
    if (name && typeof name !== 'string') {
      return NextResponse.json({ message: 'Nome inválido' }, { status: 400 });
    }
    if (image && typeof image !== 'string') {
      return NextResponse.json({ message: 'URL da imagem inválida' }, { status: 400 });
    }
    if (whatsappLink && typeof whatsappLink !== 'string') {
      return NextResponse.json({ message: 'Link do WhatsApp inválido' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(name && { name }),
        ...(image && { image }),
        ...(whatsappLink && { whatsappLink }),
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ message: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        whatsappLink: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ message: 'Erro ao buscar usuário' }, { status: 500 });
  }
}