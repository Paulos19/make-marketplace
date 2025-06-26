import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        whatsappLink: true,
        profileDescription: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        products: { // Inclui um resumo dos produtos de cada usuário
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        reservations: { // Inclui um resumo das reservas de cada usuário
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    return NextResponse.json({ message: 'Could not fetch users' }, { status: 500 });
  }
}