import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ProductCondition } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Chave secreta compartilhada com o n8n para segurança
const AGENT_SECRET = process.env.AGENT_SECRET_KEY || 'zaca-agent-secret-123';

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
  sellerId: z.string().min(1), // O agente deve passar o sellerId
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${AGENT_SECRET}`) {
      return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten() }, { status: 400 });
    }
    
    const { sellerId, ...productData } = validation.data;

    const product = await prisma.product.create({
      data: {
        ...productData,
        userId: sellerId,
      },
    });

    revalidatePath('/');
    revalidatePath('/dashboard');

    return NextResponse.json(product);
  } catch (error) {
    console.error('[AGENT_PRODUCTS_POST]', error);
    return NextResponse.json({ message: 'Erro Interno', error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${AGENT_SECRET}`) {
      return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const sellerId = searchParams.get('sellerId');

    if (!id || !sellerId) {
      return NextResponse.json({ message: 'ID do produto e sellerId são obrigatórios.' }, { status: 400 });
    }

    // Verifica se o produto pertence a este vendedor
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.userId !== sellerId) {
      return NextResponse.json({ message: 'Produto não encontrado ou não pertence a este vendedor.' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/dashboard');

    return NextResponse.json({ message: 'Produto excluído com sucesso.' });
  } catch (error) {
    console.error('[AGENT_PRODUCTS_DELETE]', error);
    return NextResponse.json({ message: 'Erro Interno', error: String(error) }, { status: 500 });
  }
}
