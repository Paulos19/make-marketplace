import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { sections } = body as { sections: { id: string; order: number }[] };

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });
    }

    
    await prisma.$transaction(
      sections.map((section, index) =>
        prisma.homepageSection.update({
          where: { id: section.id },
          data: { order: index }, 
        })
      )
    );
    
    revalidatePath('/');

    return NextResponse.json({ message: 'Ordem salva com sucesso!' });
  } catch (error) {
    console.error("Erro ao reordenar seções:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
