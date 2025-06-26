import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== UserRole.SELLER) {
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
        }

        const sales = await prisma.reservation.findMany({
            where: {
                product: {
                    userId: session.user.id,
                },
                isArchived: false,
            },
            include: {
                product: {
                    select: { id: true, name: true, images: true },
                },
                user: {
                    select: { name: true, whatsappLink: true },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(sales);

    } catch (error) {
        console.error('[SALES_GET_ERROR]', error);
        return NextResponse.json({ error: 'Ocorreu um erro ao buscar o histórico de vendas.' }, { status: 500 });
    }
}
