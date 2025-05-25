import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Ajuste o caminho se necessário

// GET: Listar produtos do usuário logado ou todos os produtos
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const userIdParams = searchParams.get('userId');

  try {
    const queryOptions: any = {
      orderBy: { createdAt: 'desc' }, // Keep recently added as default sort
      include: {
        user: { 
          select: {
            id: true,
            name: true,
            email: true, 
            image: true,
            whatsappLink: true,
          },
        },
        categories: true, // Include category data
      },
    };

    if (userIdParams) {
      queryOptions.where = { userId: userIdParams };
      const products = await prisma.product.findMany(queryOptions);
      return NextResponse.json(products);
    } else if (session && session.user && session.user.id && !searchParams.has('all')) { // Adicionado !searchParams.has('all') para diferenciar
      // Listar produtos do usuário logado (para o dashboard)
      // Se 'all' não estiver presente nos parâmetros, e o usuário estiver logado, busca apenas os dele.
      queryOptions.where = { userId: session.user.id };
      const products = await prisma.product.findMany(queryOptions);
      return NextResponse.json(products);
    } else {
      // Listar todos os produtos (para a página inicial do marketplace ou /products)
      delete queryOptions.where; 
      const products = await prisma.product.findMany(queryOptions); // queryOptions now includes categories
      return NextResponse.json(products);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST: Criar um novo produto
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      originalPrice, // Assuming you might add this here too eventually
      onPromotion,   // Assuming you might add this here too eventually
      imageUrls,
      categoryIds    // Added categoryIds
    } = body;

    if (!name || !price || !imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: name, price, and at least one imageUrl' }, { status: 400 });
    }

    // Basic validation for promotion, adapt as needed for product creation
    if (onPromotion && (typeof originalPrice !== 'number' || originalPrice <= parseFloat(price))) {
      return NextResponse.json({ error: 'If in promotion, the original price must be provided and greater than the promotional price.' }, { status: 400 });
    }
    if (!onPromotion && originalPrice != null) {
      return NextResponse.json({ error: 'Original price is only applicable when the product is on promotion.' }, { status: 400 });
    }

    const createData: any = {
      name,
      description,
      price: parseFloat(price),
      originalPrice: onPromotion ? originalPrice : null,
      onPromotion: onPromotion || false,
      imageUrls,
      userId: session.user.id,
    };

    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      createData.categories = {
        connect: categoryIds.map((id: string) => ({ id })),
      };
    }

    const product = await prisma.product.create({
      data: createData,
      include: { // Optional: include categories in the response
        categories: true,
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}