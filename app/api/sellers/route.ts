// app/api/sellers/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET: Busca todos os usuários com a role de SELLER
export async function GET() {
  try {
    const sellers = await prisma.user.findMany({
      where: {
        role: UserRole.SELLER,
        // Opcional: Adicionar um filtro para garantir que o perfil está visível
        // Ex: name: { not: null },
      },
      // Selecionamos os campos públicos e necessários para os cards
      select: {
        id: true,
        name: true,
        image: true, // Foto de perfil
        storeName: true, // Nome da loja
        whatsappLink: true, // Para o botão de contato
        sellerBannerImageUrl: true, // A nova imagem do banner
        profileDescription: true, // Uma breve descrição para o card
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(sellers);
  } catch (error) {
    console.error('[API_SELLERS_GET]', error);
    return new NextResponse('Erro interno do servidor ao buscar vendedores', { status: 500 });
  }
}
