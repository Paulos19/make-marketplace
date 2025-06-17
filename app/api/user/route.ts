// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache'; // <<< 1. IMPORTAR revalidatePath

const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional().nullable(),
  image: z.string().url().nullable().optional(),
  whatsappLink: z.string().url().nullable().optional(),
  storeName: z.string().min(2).max(50).nullable().optional(),
  sellerBannerImageUrl: z.string().url().nullable().optional(),
  profileDescription: z.string().max(500).nullable().optional(),
  showInSellersPage: z.boolean().optional(),
});

// GET: Busca os dados do usuário logado
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

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

    const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: validation.data,
    });
    
    // <<< 2. ADICIONAR REVALIDAÇÃO APÓS ATUALIZAR O USUÁRIO >>>
    // Revalida a página principal de listagem de vendedores.
    revalidatePath('/sellers');
    // Revalida a página de perfil específica do vendedor que foi atualizada.
    revalidatePath(`/seller/${updatedUser.id}`);

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ message: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
