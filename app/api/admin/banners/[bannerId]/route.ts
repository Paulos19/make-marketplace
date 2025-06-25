// app/api/admin/banners/[bannerId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache'; // <<< 1. IMPORTADO

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
    
    revalidatePath('/'); // <<< 2. ADICIONADO: Revalida a homepage

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

    const { bannerId } = params;
    if (!bannerId) {
      return new NextResponse('ID do Banner não encontrado', { status: 400 });
    }
    
    const body = await req.json();
    const { title, imageUrl, linkUrl, isActive } = body;

    if (!title || !imageUrl) {
      return new NextResponse('Título e URL da imagem são obrigatórios', { status: 400 });
    }

    const banner = await prisma.homePageBanner.update({
      where: {
        id: bannerId,
      },
      data: {
        title,
        imageUrl,
        linkUrl,
        isActive,
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
