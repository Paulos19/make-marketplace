import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ProductCondition, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache'; // <<< 1. IMPORTAR revalidatePath
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  price: z.number().min(0.01, 'O preço deve ser maior que zero.'),
  onPromotion: z.boolean().default(false),
  originalPrice: z.number().optional().nullable(),
  images: z.array(z.string()).min(1, 'Pelo menos uma imagem é necessária.'),
  categoryId: z.string().min(1, 'Selecione uma categoria.'),
  quantity: z.number().int().min(1, 'A quantidade deve ser de pelo menos 1.'),
  condition: z.nativeEnum(ProductCondition),
});

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
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role === UserRole.USER) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Valida o corpo do pedido com o schema Zod
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { name, description, price, originalPrice, images, categoryId, quantity, condition, onPromotion } = validation.data;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        originalPrice: onPromotion ? originalPrice : null, // Salva o preço original apenas se estiver em promoção
        images,
        quantity,
        condition,
        onPromotion,
        categoryId,
        userId: session.user.id,
      },
    })

    return NextResponse.json(product, { status: 201 });

  } catch (error) {
    console.error('[PRODUCTS_POST_ERROR]', error)
    if (error instanceof z.ZodError) {
        return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor ao criar o produto.' }, { status: 500 });
  }
}