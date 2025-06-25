// app/api/admin/banners/[bannerId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema para validar os dados recebidos no PATCH
const bannerPatchSchema = z.object({
    title: z.string().optional().nullable(),
    imageUrl: z.string().url({ message: "URL da imagem é obrigatória." }),
    linkUrl: z.string().url({ message: "URL do link inválida." }).optional().or(z.literal('')),
    isActive: z.boolean().optional(),
});


export async function DELETE(
  req: Request,
  { params }: { params: { bannerId: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  if (!params.bannerId) {
    return new NextResponse('ID do Banner não encontrado', { status: 400 });
  }

  try {
    await prisma.homePageBanner.delete({
      where: {
        id: params.bannerId,
      },
    });
    
    revalidatePath('/');

    return new NextResponse(null, { status: 204 }); 
  } catch (error) {
    console.error('[BANNER_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { bannerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.ADMIN) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    // 1. Consome o corpo da requisição ANTES de acessar os parâmetros
    const body = await req.json();
    const { bannerId } = params;

    if (!bannerId) {
      return new NextResponse('ID do Banner não encontrado', { status: 400 });
    }
    
    // 2. Valida os dados do corpo com Zod
    const validation = bannerPatchSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ message: 'Dados inválidos', errors: validation.error.flatten() }, { status: 400 });
    }
    
    // 3. Atualiza o banco de dados com os dados validados
    const banner = await prisma.homePageBanner.update({
      where: {
        id: bannerId,
      },
      data: {
        ...validation.data,
        title: validation.data.title || '', // Garante que o título seja uma string
      },
    });

    // Invalida o cache da homepage para que a alteração apareça imediatamente
    revalidatePath('/');

    return NextResponse.json(banner);
  } catch (error) {
    console.error('[BANNER_PATCH]', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
