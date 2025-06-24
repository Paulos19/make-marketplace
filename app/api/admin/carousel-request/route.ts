import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const carouselRequestSchema = z.object({
  productId: z.string().min(1, "O ID do produto é obrigatório."),
  purchaseId: z.string().min(1, "O ID da compra é obrigatório."),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== UserRole.SELLER) {
    return NextResponse.json({ message: 'Acesso negado. Apenas para vendedores.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = carouselRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }
    const { productId, purchaseId } = validation.data;

    // Inicia uma transação para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verifica se a compra é válida e pertence ao usuário
      const purchase = await tx.purchase.findFirst({
        where: {
          id: purchaseId,
          userId: session.user?.id,
          type: 'CARROSSEL_PRACA',
          submissionStatus: 'AVAILABLE',
        },
      });

      if (!purchase) {
        throw new Error('Compra inválida, não encontrada ou já utilizada.');
      }

      // 2. Busca os detalhes do produto para a notificação, incluindo o preço
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { name: true, images: true, price: true }, // Preço adicionado
      });

      if (!product) {
        throw new Error('Produto selecionado não encontrado.');
      }

      // 3. Cria os metadados para a notificação
      const message = `${session.user?.name} solicitou a divulgação do produto "${product.name}" no Carrossel na Praça.`;
      const metadata = {
        productId: productId,
        productName: product.name,
        productImage: product.images[0] || null,
        productPrice: product.price, // Preço adicionado aos metadados
        purchaseId: purchase.id,
      };

      // 4. Cria a notificação para o admin
      await tx.adminNotification.create({
        data: {
          message,
          type: 'CAROUSEL_REQUEST',
          sellerId: session.user?.id,
          metadata,
        },
      });

      // 5. Atualiza o status da compra para 'PENDING_APPROVAL'
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { submissionStatus: 'PENDING_APPROVAL' },
      });

      return { success: true };
    });

    return NextResponse.json({ message: 'Solicitação de divulgação enviada para aprovação do admin!' }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar solicitação de carrossel:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}
