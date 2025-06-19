import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = params;

        const reservation = await prisma.reservation.findUnique({
            where: { reviewToken: token },
            select: {
                product: {
                    select: {
                        name: true,
                        user: {
                            select: { name: true, storeName: true }
                        }
                    }
                },
                review: true // Verifica se já existe uma avaliação
            }
        });

        if (!reservation) {
            return NextResponse.json({ error: 'Link de avaliação inválido ou expirado.' }, { status: 404 });
        }
        
        if (reservation.review) {
            return NextResponse.json({ error: 'Esta compra já foi avaliada.' }, { status: 409 });
        }

        const details = {
            productName: reservation.product.name,
            sellerName: reservation.product.user.storeName || reservation.product.user.name
        }

        return NextResponse.json(details);

    } catch (error) {
        console.error("Erro ao buscar detalhes da reserva para avaliação:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
