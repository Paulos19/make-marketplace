// app/api/products/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get('userId'); 

  try {
    const queryOptions: any = {
      orderBy: { createdAt: 'desc' },
      // << RELAÇÃO CORRIGIDA >>
      // Voltamos a incluir o 'user' diretamente
      include: {
        user: { 
          select: {
            id: true,
            name: true,
            image: true,
            whatsappLink: true,
            storeName: true,
          },
        },
        categories: true,
      },
    };

    // << FILTRO CORRIGIDO >>
    // Filtra por 'userId' novamente
    if (userIdParam) {
      queryOptions.where = { userId: userIdParam };
    } 
    
    const products = await prisma.product.findMany(queryOptions);
    return NextResponse.json(products);

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  
  if (session.user.role !== UserRole.SELLER && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Apenas vendedores podem criar produtos.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, price, quantity, imageUrls, categoryIds } = body;

    // << CRIAÇÃO CORRIGIDA >>
    // O produto é conectado diretamente ao 'userId' da sessão
    const createData: any = {
      name,
      description,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      imageUrls,
      user: {
        connect: {
          id: session.user.id,
        },
      },
    };

    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      createData.categories = {
        connect: categoryIds.map((id: string) => ({ id })),
      };
    }

    const product = await prisma.product.create({
      data: createData,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Falha ao criar o produto.' }, { status: 500 });
  }
}