import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Ajuste o caminho se necessário
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema para validação no PUT (opcional, mas recomendado para robustez)
const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  image: z.string().url().nullable().optional(),
  whatsappLink: z.string().url().nullable().optional(),
  storeName: z.string().min(2).max(50).nullable().optional(),
  sellerBannerImageUrl: z.string().url().nullable().optional(),
  profileDescription: z.string().max(500).nullable().optional(), // Adicionado também
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Validação com Zod
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: validation.error.format() }, { status: 400 });
    }

    const { name, image, whatsappLink, storeName, sellerBannerImageUrl, profileDescription } = validation.data;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (image !== undefined) dataToUpdate.image = image; // Permite null para remover
    if (whatsappLink !== undefined) dataToUpdate.whatsappLink = whatsappLink; // Permite null
    if (storeName !== undefined) dataToUpdate.storeName = storeName; // Permite null
    if (sellerBannerImageUrl !== undefined) dataToUpdate.sellerBannerImageUrl = sellerBannerImageUrl; // Permite null
    if (profileDescription !== undefined) dataToUpdate.profileDescription = profileDescription; // Permite null


    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json({ message: 'Nenhum dado para atualizar' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: dataToUpdate,
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
        storeName: true, // Adicionado
        sellerBannerImageUrl: true, // Adicionado
        profileDescription: true, // Adicionado
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