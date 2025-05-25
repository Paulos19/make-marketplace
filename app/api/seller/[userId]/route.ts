import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
        name: true,
        image: true,
        whatsappLink: true,
        profileDescription: true,
        products: {  // <--- ALTERADO DE 'Product' PARA 'products'
          orderBy: { createdAt: 'desc' },
          include: {
            categories: true, 
          }
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    return NextResponse.json(seller, { status: 200 });
  } catch (error) {
    console.error('Error fetching seller profile API ROUTE:', error); // Log aprimorado
    // Tenta retornar uma resposta de erro JSON
    try {
      return NextResponse.json({ error: 'Internal server error fetching seller profile', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    } catch (responseError) {
      // Se NextResponse.json falhar, loga e retorna uma resposta de texto simples
      console.error('Failed to construct JSON error response in API route:', responseError);
      return new Response('Internal server error', { status: 500 });
    }
  }
}