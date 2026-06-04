import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getMobileUserId } from '../auth-helper';

const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional().nullable(),
  image: z.string().url().nullable().optional(),
  whatsappLink: z.string().url().nullable().optional(),
  storeName: z.string().min(2).max(50).nullable().optional(),
  sellerBannerImageUrl: z.string().url().nullable().optional(),
  profileDescription: z.string().max(500).nullable().optional(),
  showInSellersPage: z.boolean().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const userId = await getMobileUserId(req);

  if (!userId) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar usuário mobile:', error);
    return NextResponse.json({ message: 'Erro ao buscar usuário' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const userId = await getMobileUserId(req);

  if (!userId) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: validation.error.format() }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: validation.data,
    });
    
    revalidatePath('/sellers');
    revalidatePath(`/seller/${updatedUser.id}`);

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar usuário mobile:', error);
    return NextResponse.json({ message: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
