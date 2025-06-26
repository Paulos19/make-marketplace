import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { sendCarouselPostConfirmationEmail } from '@/lib/resend';

interface RouteParams {
  params: { notificationId: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    const { notificationId } = params;

    const notification = await prisma.adminNotification.findUnique({
      where: { id: notificationId },
      include: {
        seller: { select: { name: true, email: true } },
      },
    });

    if (!notification || !notification.metadata || typeof notification.metadata !== 'object' || !notification.seller) {
      throw new Error('Notificação ou metadados inválidos.');
    }

    const metadata = notification.metadata as { purchaseId?: string; productName?: string; productImage?: string; };
    const purchaseId = metadata.purchaseId;
    
    if (!purchaseId) {
        throw new Error('ID da compra (purchaseId) não encontrado nos metadados da notificação.');
    }

    const purchaseToUpdate = await prisma.purchase.findUnique({
        where: { id: purchaseId },
    });
    
    if (!purchaseToUpdate) {
        console.error(`FALHA NA CONFIRMAÇÃO: A compra com ID ${purchaseId} não foi encontrada. A notificação ${notificationId} pode estar desatualizada ou a compra já foi processada/removida.`);
        throw new Error(`A compra associada a esta notificação não foi encontrada. A ação não pode ser concluída.`);
    }
    const productName = metadata.productName;
    const productImageUrl = metadata.productImage;

    if (!productName || !notification.seller.email) {
      throw new Error('Dados insuficientes na notificação para confirmar a ação.');
    }

    await prisma.$transaction([
      prisma.purchase.update({
        where: { id: purchaseId },
        data: { submissionStatus: 'USED' },
      }),
      prisma.adminNotification.update({
        where: { id: notificationId },
        data: { isRead: true },
      }),
    ]);
    
    await sendCarouselPostConfirmationEmail({
        to: notification.seller.email,
        userName: notification.seller.name,
        productName: productName,
        productImageUrl: productImageUrl,
    });

    return NextResponse.json({ message: 'Divulgação confirmada e vendedor notificado!' });
  } catch (error) {
    console.error("Erro ao confirmar divulgação do carrossel:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}
