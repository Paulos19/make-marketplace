import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUserId } from '../auth-helper';

export async function GET(request: NextRequest) {
    try {
        const userId = await getMobileUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
        }

        const sales = await prisma.reservation.findMany({
            where: {
                product: {
                    userId: userId,
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
        console.error('[MOBILE_SALES_GET_ERROR]', error);
        return NextResponse.json({ error: 'Ocorreu um erro ao buscar o histórico de vendas.' }, { status: 500 });
    }
}
