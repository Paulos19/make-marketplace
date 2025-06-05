// app/api/seller/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
  }

  try {
    const sellerProfile = await prisma.seller.findUnique({
      where: { id: userId },
      include: {
        // Inclui dados do usuário relacionado (nome, avatar)
        user: {
          select: {
            name: true,
            image: true,
          }
        },
        // Inclui os produtos do vendedor
        products: {
          orderBy: { createdAt: 'desc' },
          include: {
            categories: true,
          }
        },
      },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Perfil de vendedor não encontrado (Seller not found)' }, { status: 404 });
    }

    // Combinar os dados para um formato de resposta amigável para o frontend
    const responseData = {
      id: sellerProfile.id,
      name: sellerProfile.user.name,
      image: sellerProfile.user.image,
      storeName: sellerProfile.storeName,
      whatsappLink: sellerProfile.whatsappLink,
      profileDescription: sellerProfile.profileDescription,
      sellerBannerImageUrl: sellerProfile.sellerBannerImageUrl,
      products: sellerProfile.products,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Error fetching seller profile API ROUTE:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar perfil do vendedor', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}