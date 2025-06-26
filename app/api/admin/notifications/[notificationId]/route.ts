import { NextResponse as NotificationNextResponse } from 'next/server';
import { getServerSession as getNotificationServerSession } from 'next-auth/next';
import { authOptions as notificationAuthOptions } from '@/app/api/auth/[...nextauth]/route';
import prismaClient from '@/lib/prisma';
import { UserRole as NotificationUserRole } from '@prisma/client';

interface RouteParams {
  params: { notificationId: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getNotificationServerSession(notificationAuthOptions);
  if (session?.user?.role !== NotificationUserRole.ADMIN) {
    return NotificationNextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    await prismaClient.adminNotification.update({
      where: { id: params.notificationId },
      data: { isRead: true },
    });
    return NotificationNextResponse.json({ message: 'Notificação marcada como lida.' });
  } catch (error) {
    console.error("Erro ao atualizar notificação:", error);
    return NotificationNextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getNotificationServerSession(notificationAuthOptions);
  if (session?.user?.role !== NotificationUserRole.ADMIN) {
    return NotificationNextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    await prismaClient.adminNotification.delete({
      where: { id: params.notificationId },
    });
    return new NotificationNextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error("Erro ao excluir notificação:", error);
    return NotificationNextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}