import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const reservationsFromDb = await prisma.reservation.findMany({
            where: {
                userId: session.user.id,
                isArchived: false, // Ignora reservas arquivadas
            },
            include: {
                // Inclui o produto e os dados do vendedor associado a ele
                product: {
                    select: {
                        id: true,
                        name: true,
                        images: true,
                        price: true,
                        user: { // O vendedor
                            select: {
                                name: true,
                                whatsappLink: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const transformedReservations = reservationsFromDb.map(res => {
            // Garante que o produto e os dados do vendedor existem
            if (!res.product || !res.product.user) {
                return null;
            }
            return {
                id: res.id,
                createdAt: res.createdAt.toISOString(),
                product: {
                    id: res.product.id,
                    name: res.product.name,
                    images: res.product.images,
                    price: res.product.price,
                },
                // Anexa os dados do vendedor ao objeto principal da reserva
                user: {
                    name: res.product.user.name,
                    whatsappLink: res.product.user.whatsappLink
                }
            };
        }).filter(Boolean); // Remove quaisquer entradas nulas

        return NextResponse.json(transformedReservations);

    } catch (error) {
        console.error('[MY_RESERVATIONS_GET_ERROR]', error);
        return NextResponse.json({ error: 'Ocorreu um erro ao buscar suas reservas.' }, { status: 500 });
    }
}
