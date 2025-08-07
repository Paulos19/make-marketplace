import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            storeName: true,
            whatsappLink: true, // A linha crucial
          },
        },
      },
    });

    // --- LOG DE DEPURAÇÃO NO BACKEND ---
    // Este log vai mostrar os dados no seu terminal.
    console.log("=============================================");
    console.log("API DADOS DO VENDEDOR (BACKEND):");
    notifications.forEach((n: { id: any; sellerId: any; seller: any; }) => {
        console.log({
            notificationId: n.id,
            sellerId: n.sellerId,
            sellerInfo: n.seller // Vamos inspecionar este objeto
        });
    });
    console.log("=============================================");


    return NextResponse.json(notifications);

  } catch (error) {
    console.error("Erro ao buscar notificações do admin:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}