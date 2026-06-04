import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const seller = await prisma.user.findUnique({
            where: { id: id },
            select: {
                id: true,
                name: true,
                storeName: true,
                image: true,
                whatsappLink: true,
                sellerBannerImageUrl: true,
                profileDescription: true,
            }
        });

        if (!seller) {
            return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 });
        }

        return NextResponse.json(seller);
    } catch (error) {
        console.error('[MOBILE_SELLER_GET_ERROR]', error);
        return NextResponse.json({ error: 'Erro ao buscar vendedor' }, { status: 500 });
    }
}
