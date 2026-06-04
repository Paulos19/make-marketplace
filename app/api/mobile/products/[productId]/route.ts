import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ProductCondition } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getMobileUserId } from '../../auth-helper';

const updateProductSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  price: z.coerce.number().optional().nullable(),
  priceType: z.enum(['FIXED', 'ON_BUDGET']).default('FIXED'),
  onPromotion: z.boolean().default(false),
  originalPrice: z.coerce.number().optional().nullable(),
  images: z.array(z.string()).min(1, 'Pelo menos uma imagem é necessária.'),
  categoryId: z.string().min(1, 'Selecione uma categoria.'),
  quantity: z.coerce.number().int().min(1, 'A quantidade deve ser de pelo menos 1.'),
  condition: z.nativeEnum(ProductCondition),
  isService: z.boolean().default(false),
  productUrl: z.string().url().or(z.literal('')).optional().nullable(),
}).refine((data) => {
    if (data.onPromotion && data.originalPrice && data.price && data.price >= data.originalPrice) {
        return false;
    }
    return true;
}, {
    message: "O preço promocional deve ser menor que o original.",
    path: ["price"],
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json({ message: 'ID do produto não fornecido.' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: true,
        category: true
      }
    });

    if (!product) {
      return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("[MOBILE_PRODUCT_GET]", error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

async function handleUpdate(
  request: NextRequest,
  productId: string
) {
  try {
    const userId = await getMobileUserId(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
    }

    if (!productId) {
      return NextResponse.json({ message: 'ID do produto não fornecido.' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.userId !== userId) {
      return NextResponse.json({ message: 'Produto não encontrado ou você não tem permissão para editá-lo.' }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: validation.data,
    });

    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath(`/products/${productId}`);

    return NextResponse.json(updatedProduct, { status: 200 });

  } catch (error) {
    console.error("[MOBILE_PRODUCT_UPDATE]", error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  return handleUpdate(request, productId);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  return handleUpdate(request, productId);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const userId = await getMobileUserId(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
    }

    const { productId } = await params;
    if (!productId) {
      return NextResponse.json({ message: 'ID do produto não fornecido.' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.userId !== userId) {
      return NextResponse.json({ message: 'Produto não encontrado ou você não tem permissão para excluí-lo.' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath('/');
    revalidatePath('/dashboard');

    return NextResponse.json({ message: 'Produto excluído com sucesso.' }, { status: 200 });

  } catch (error) {
    console.error("[MOBILE_PRODUCT_DELETE]", error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
