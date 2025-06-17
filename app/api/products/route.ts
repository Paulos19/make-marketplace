import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache'; // <<< 1. IMPORTAR revalidatePath

// GET: Busca produtos e normaliza os dados para o frontend.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get('userId'); 

  try {
    const queryOptions: any = {
      orderBy: { createdAt: 'desc' },
      include: {
        user: { 
          select: { id: true, name: true, image: true, whatsappLink: true, storeName: true },
        },
        category: true,
      },
    };

    if (userIdParam) {
      queryOptions.where = { userId: userIdParam };
    } 
    
    const productsFromDb = await prisma.product.findMany(queryOptions);

    const products = productsFromDb.map(product => {
      const productForFrontend: any = { ...product };
      productForFrontend.categories = product.categoryId ? [product.categoryId] : [];
      productForFrontend.images = product.images || [];
      delete productForFrontend.category;
      return productForFrontend;
    });
    
    return NextResponse.json(products);

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST: Cria um produto, garantindo que os dados são salvos com os nomes corretos do DB.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  
  if (session.user.role !== UserRole.SELLER && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Apenas vendedores podem criar produtos.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, price, quantity, imageUrls, categoryId, onPromotion, originalPrice } = body;
    
    if (!categoryId) {
      return NextResponse.json({ error: 'A categoria do produto é obrigatória.' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        images: imageUrls,
        onPromotion: onPromotion || false,
        originalPrice: onPromotion ? parseFloat(originalPrice) : null,
        user: { connect: { id: session.user.id } },
        category: { connect: { id: categoryId } },
      },
    });
    
    // <<< 2. ADICIONAR REVALIDAÇÃO APÓS CRIAR PRODUTO >>>
    revalidatePath('/'); // Revalida a HomePage
    revalidatePath('/products'); // Revalida a página de listagem de todos os produtos
    // <<< FIM DA ADIÇÃO >>>

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Falha ao criar o produto.' }, { status: 500 });
  }
}