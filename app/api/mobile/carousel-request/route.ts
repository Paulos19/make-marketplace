// app/api/mobile/carousel-request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { getMobileUserId } from '../auth-helper';

const carouselRequestSchema = z.object({
  productId: z.string().min(1, "O ID do produto é obrigatório."),
  purchaseId: z.string().min(1, "O ID da compra é obrigatório."),
});

export async function POST(request: NextRequest) {
  const userId = await getMobileUserId(request);
  if (!userId) {
    return NextResponse.json({ message: 'Não autorizado. Faça login novamente.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true },
  });

  if (!user || (user.role !== UserRole.SELLER && user.role !== UserRole.ADMIN)) {
    return NextResponse.json({ message: 'Acesso negado. Apenas para vendedores.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = carouselRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }
    const { productId, purchaseId } = validation.data;

    await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: {
          id: purchaseId,
          userId: userId,
          type: 'CARROSSEL_PRACA',
          submissionStatus: 'AVAILABLE',
        },
      });

      if (!purchase) {
        throw new Error('Compra inválida, não encontrada ou já utilizada.');
      }

      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { name: true, images: true, price: true },
      });

      if (!product) {
        throw new Error('Produto selecionado não encontrado.');
      }

      const message = `${user.name} solicitou a divulgação do produto "${product.name}" no Carrossel na Praça.`;
      const metadata = {
        productId: productId,
        productName: product.name,
        productImage: product.images[0] || null,
        productPrice: product.price,
        purchaseId: purchase.id,
      };

      await tx.adminNotification.create({
        data: {
          message,
          type: 'CAROUSEL_REQUEST',
          sellerId: userId,
          metadata,
        },
      });

      await tx.purchase.update({
        where: { id: purchase.id },
        data: { submissionStatus: 'PENDING_APPROVAL' },
      });

      return { success: true };
    });

    return NextResponse.json({ message: 'Solicitação de divulgação enviada para aprovação do admin!' }, { status: 201 });
  } catch (error: unknown) {
    console.error("Erro ao criar solicitação de carrossel:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}
