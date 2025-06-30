import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ProductCondition, UserRole } from '@prisma/client';

const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  price: z.number().optional().nullable(),
  priceType: z.enum(['FIXED', 'ON_BUDGET']).default('FIXED'),
  originalPrice: z.number().optional().nullable(),
  images: z.array(z.string()).min(1),
  categoryId: z.string(),
  quantity: z.number().int().min(1),
  condition: z.nativeEnum(ProductCondition),
  onPromotion: z.boolean().optional(),
  isService: z.boolean().optional(),
}).refine((data) => {
    if (data.isService && data.priceType === 'FIXED' && (!data.price || data.price <= 0)) {
        return false;
    }
    if (!data.isService && (!data.price || data.price <= 0)) {
        return false;
    }
    return true;
}, {
    message: "O preço é obrigatório para este tipo de anúncio.",
    path: ["price"],
}).refine((data) => {
    if (data.onPromotion && (!data.originalPrice || data.originalPrice <= 0)) {
        return false;
    }
    return true;
}, {
    message: "O preço original é obrigatório para promoções.",
    path: ["originalPrice"],
}).refine((data) => {
    if (data.onPromotion && data.originalPrice && data.price && data.price >= data.originalPrice) {
        return false;
    }
    return true;
}, {
    message: "O preço promocional deve ser menor que o original.",
    path: ["price"],
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Sessão não encontrada. Por favor, faça login novamente.' }, { status: 401 });
    }

    if (!session.user.id) {
        return NextResponse.json({ message: 'ID de utilizador não encontrado na sessão.' }, { status: 401 });
    }

    if (session.user.role !== UserRole.SELLER) {
      return NextResponse.json({ message: `A sua permissão é '${session.user.role}'. É necessário ser um VENDEDOR.` }, { status: 403 });
    }

    const body = await req.json();
    
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten() }, { status: 400 });
    }
    
    const { ...productData } = validation.data;

    const product = await prisma.product.create({
      data: {
        ...productData,
        userId: session.user.id,
      },
    });

    revalidatePath('/');
    revalidatePath('/services');

    return NextResponse.json(product);
  } catch (error) {
    console.error('[PRODUCTS_POST]', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return NextResponse.json({ message: 'Erro Interno do Servidor', error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const categoryId = searchParams.get('categoryId');
  const isServiceQuery = searchParams.get('isService');
  const query = searchParams.get('q');
  const sort = searchParams.get('sort');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);

  const where: any = {
    isSold: false,
    isReserved: false,
  };

  if (userId) where.userId = userId;
  if (categoryId) where.categoryId = categoryId;
  if (isServiceQuery !== null) where.isService = isServiceQuery === 'true';

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  const orderBy: any = {};
  if (sort) {
    const [field, direction] = sort.split(':');
    if (['price', 'createdAt'].includes(field) && ['asc', 'desc'].includes(direction)) {
      orderBy[field] = direction;
    }
  } else {
    orderBy.createdAt = 'desc';
  }

  console.log('Final WHERE clause:', where);

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { user: true, category: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    console.log('Number of products found by Prisma:', products.length);

    return NextResponse.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('[PRODUCTS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

