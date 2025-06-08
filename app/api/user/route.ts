// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para o PUT (permanece o mesmo)
const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional().nullable(),
  image: z.string().url().nullable().optional(),
  whatsappLink: z.string().url().nullable().optional(),
  storeName: z.string().min(2).max(50).nullable().optional(),
  sellerBannerImageUrl: z.string().url().nullable().optional(),
  profileDescription: z.string().max(500).nullable().optional(),
});


// GET: Busca os dados do usuário logado
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    // CORREÇÃO: Removido o 'include: { seller: ... }'
    // Agora buscamos o usuário diretamente.
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // A resposta já contém todos os campos necessários.
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ message: 'Erro ao buscar usuário' }, { status: 500 });
  }
}


// PUT: Atualiza os dados do usuário
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: validation.error.format() }, { status: 400 });
    }

    // CORREÇÃO: Todos os dados são atualizados diretamente no modelo User.
    // Não há mais separação entre dados de User e Seller.
    const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: validation.data, // Passa todos os dados validados diretamente
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ message: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
