import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUserId } from '../auth-helper';

export async function GET(request: NextRequest) {
    try {
        const userId = await getMobileUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const reservationsFromDb = await prisma.reservation.findMany({
            where: {
                userId: userId,
                isArchived: false,
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        images: true,
                        price: true,
                        user: {
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
                user: {
                    name: res.product.user.name,
                    whatsappLink: res.product.user.whatsappLink
                }
            };
        }).filter(Boolean);

        return NextResponse.json(transformedReservations);

    } catch (error) {
        console.error('[MOBILE_MY_RESERVATIONS_GET_ERROR]', error);
        return NextResponse.json({ error: 'Ocorreu um erro ao buscar suas reservas.' }, { status: 500 });
    }
}
