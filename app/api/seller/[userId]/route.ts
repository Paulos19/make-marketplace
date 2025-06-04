import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; //

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
  }

  try {
    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true, // Nome pessoal do usuário/vendedor
        email: false, // Geralmente não exibimos email publicamente
        image: true, // Avatar do vendedor
        whatsappLink: true,
        storeName: true, // << NOVO CAMPO ADICIONADO
        profileDescription: true,
        sellerBannerImageUrl: true, // << NOVO CAMPO ADICIONADO
        products: {
          orderBy: { createdAt: 'desc' },
          include: {
            categories: true,
          }
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Vendedor não encontrado (Seller not found)' }, { status: 404 });
    }

    return NextResponse.json(seller, { status: 200 });
  } catch (error) {
    console.error('Error fetching seller profile API ROUTE:', error);
    try {
      return NextResponse.json({ error: 'Erro interno do servidor ao buscar perfil do vendedor', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    } catch (responseError) {
      console.error('Failed to construct JSON error response in API route:', responseError);
      return new Response('Internal server error', { status: 500 });
    }
  }
}