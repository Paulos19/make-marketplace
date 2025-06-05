// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para o PUT
const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional().nullable(),
  image: z.string().url().nullable().optional(),
  whatsappLink: z.string().url().nullable().optional(),
  storeName: z.string().min(2).max(50).nullable().optional(),
  sellerBannerImageUrl: z.string().url().nullable().optional(),
  profileDescription: z.string().max(500).nullable().optional(),
});


// GET: Busca os dados do usuário logado (incluindo dados de vendedor, se houver)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    // <<< CORREÇÃO PRINCIPAL AQUI (GET) >>>
    // A query agora inclui a relação com 'seller' para buscar os dados de vendedor
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        seller: { // Inclui os dados da tabela Seller associada
          select: {
            storeName: true,
            whatsappLink: true,
            sellerBannerImageUrl: true,
            profileDescription: true,
          }
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Combina os dados para uma resposta fácil de usar no frontend
    const { seller, ...userData } = user;
    const responseData = {
      ...userData,
      ...(seller && seller), // Adiciona os campos de seller ao objeto principal se existirem
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ message: 'Erro ao buscar usuário' }, { status: 500 });
  }
}


// PUT: Atualiza os dados do usuário e/ou vendedor
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: validation.error.format() }, { status: 400 });
    }

    const { name, image, whatsappLink, storeName, sellerBannerImageUrl, profileDescription } = validation.data;

    // <<< CORREÇÃO PRINCIPAL AQUI (PUT) >>>
    // A lógica de atualização agora separa os dados do User e do Seller
    const userDataToUpdate: any = {};
    if (name !== undefined) userDataToUpdate.name = name;
    if (image !== undefined) userDataToUpdate.image = image;

    const sellerDataToUpdate: any = {};
    if (whatsappLink !== undefined) sellerDataToUpdate.whatsappLink = whatsappLink;
    if (storeName !== undefined) sellerDataToUpdate.storeName = storeName;
    if (sellerBannerImageUrl !== undefined) sellerDataToUpdate.sellerBannerImageUrl = sellerBannerImageUrl;
    if (profileDescription !== undefined) sellerDataToUpdate.profileDescription = profileDescription;

    // Executa as atualizações. Usar uma transação é ideal se você atualizar ambos ao mesmo tempo.
    await prisma.$transaction(async (tx) => {
      // Atualiza a tabela User se houver dados para ela
      if (Object.keys(userDataToUpdate).length > 0) {
        await tx.user.update({
          where: { id: session.user!.id },
          data: userDataToUpdate,
        });
      }
      
      // Atualiza a tabela Seller se houver dados para ela e se o usuário for um vendedor
      if (Object.keys(sellerDataToUpdate).length > 0 && session.user?.role === 'SELLER') {
        await tx.seller.update({
          where: { id: session.user!.id },
          data: sellerDataToUpdate,
        });
      }
    });

    // Retorna os dados atualizados para consistência (opcional, mas boa prática)
    const updatedUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { seller: true }
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ message: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}