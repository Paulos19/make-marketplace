import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUserId } from '../../auth-helper';
import { ReservationStatus } from '@prisma/client';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getMobileUserId(request);
        if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const body = await request.json();
        const { status } = body;

        const reservation = await prisma.reservation.findUnique({
            where: { id: params.id },
            include: { product: true }
        });

        if (!reservation) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
        if (reservation.product.userId !== userId) return NextResponse.json({ error: 'Proibido' }, { status: 403 });

        const updated = await prisma.reservation.update({
            where: { id: params.id },
            data: { status: status as ReservationStatus }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('[MOBILE_SALES_PATCH_ERROR]', error);
        return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getMobileUserId(request);
        if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const reservation = await prisma.reservation.findUnique({
            where: { id: params.id },
            include: { product: true }
        });

        if (!reservation) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
        if (reservation.product.userId !== userId) return NextResponse.json({ error: 'Proibido' }, { status: 403 });

        await prisma.reservation.delete({ where: { id: params.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[MOBILE_SALES_DELETE_ERROR]', error);
        return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
    }
}
