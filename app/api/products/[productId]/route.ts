import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { ProductCondition, UserRole } from '@prisma/client';

// Reutilizando o schema de validação de produto
const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  price: z.number().optional().nullable(),
  priceType: z.enum(['FIXED', 'ON_BUDGET']).optional(),
  originalPrice: z.number().optional().nullable(),
  images: z.array(z.string()).min(1),
  categoryId: z.string(),
  quantity: z.number().int().min(1),
  condition: z.nativeEnum(ProductCondition),
  onPromotion: z.boolean().optional(),
  isService: z.boolean().optional(),
});

export async function GET(req: Request, { params }: { params: { productId: string } }) {
  try {
    const { productId } = params;

    if (!productId) {
      return NextResponse.json({ message: 'ID do produto não fornecido.' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: true, category: true }, // Include related data
    });

    if (!product) {
      return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('[PRODUCT_DETAIL_GET]', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { productId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const { productId } = params;
    if (!productId) {
      return NextResponse.json({ message: 'ID do produto não fornecido.' }, { status: 400 });
    }

    const body = await req.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten() }, { status: 400 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 });
    }

    // Verifica se o usuário logado é o proprietário do produto
    if (existingProduct.userId !== session.user.id) {
      return NextResponse.json({ message: 'Não autorizado. Você não é o proprietário deste produto.' }, { status: 403 });
    }

    const { ...productData } = validation.data;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...productData,
      },
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error('[PRODUCT_UPDATE_PUT]', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return NextResponse.json({ message: 'Erro interno do servidor', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { productId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const { productId } = params;
    if (!productId) {
      return NextResponse.json({ message: 'ID do produto não fornecido.' }, { status: 400 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 });
    }

    // Verifica se o usuário logado é o proprietário do produto
    if (existingProduct.userId !== session.user.id) {
      return NextResponse.json({ message: 'Não autorizado. Você não é o proprietário deste produto.' }, { status: 403 });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: 'Produto excluído com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('[PRODUCT_DELETE]', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return NextResponse.json({ message: 'Erro interno do servidor', error: errorMessage }, { status: 500 });
  }
}