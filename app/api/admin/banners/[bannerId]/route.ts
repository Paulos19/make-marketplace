import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

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

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error('[BANNER_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}