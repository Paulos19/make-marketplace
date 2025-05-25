import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Ajuste o caminho se necessário
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("API /api/admin/users - Session object:", JSON.stringify(session, null, 2)); // Adicionado para depuração

    // Verificar se o usuário está autenticado e é o admin
    if (!session || session.user?.role !== 'ADMIN') {
      console.log("API /api/admin/users - Access Denied. Role:", session?.user?.role); // Adicionado para depuração
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: { // Selecione os campos que deseja exibir no painel de admin
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        whatsappLink: true,
        profileDescription: true,
        role: true, 
      },
      orderBy: {
        createdAt: 'desc', 
      },
    });

    return NextResponse.json(users, { status: 200 });

  } catch (error) {
    console.error("Error fetching users for admin:", error);
    return NextResponse.json({ message: 'Could not fetch users' }, { status: 500 });
  }
}