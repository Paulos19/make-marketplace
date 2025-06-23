import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, imageUrl, linkUrl } = body;

    if (!title || !imageUrl) {
      return new NextResponse('Título e URL da imagem são obrigatórios', { status: 400 });
    }

    const banner = await prisma.homePageBanner.create({
      data: {
        title,
        imageUrl,
        linkUrl,
      },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error('[BANNERS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}


export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  try {
    const banners = await prisma.homePageBanner.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(banners);
  } catch (error) {
    console.error('[BANNERS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}