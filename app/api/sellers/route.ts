// app/api/sellers/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET: Busca todos os usuários com a role de SELLER que optaram por aparecer na página
export async function GET() {
  try {
    const sellers = await prisma.user.findMany({
      // <<< INÍCIO DA CORREÇÃO >>>
      where: {
        role: UserRole.SELLER,
        showInSellersPage: true, // Filtra apenas vendedores que querem aparecer
      },
      // <<< FIM DA CORREÇÃO >>>
      select: {
        id: true,
        name: true,
        image: true,
        storeName: true,
        whatsappLink: true,
        sellerBannerImageUrl: true,
        profileDescription: true,
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