
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';


const updateSectionSchema = z.object({
  title: z.string().min(3, "O título é obrigatório.").optional(),
  bannerImageUrl: z.string().url("A URL da imagem do banner é inválida.").optional(),
  bannerFontColor: z.string().optional(),
  productIds: z.array(z.string()).min(1, "Selecione pelo menos um produto.").optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: { sectionId: string };
}


export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const validation = updateSectionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }

    const updatedSection = await prisma.homepageSection.update({
      where: { id: params.sectionId },
      data: validation.data,
    });

    return NextResponse.json(updatedSection);
  } catch (error) {
    console.error("Erro ao atualizar seção:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}


export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    await prisma.homepageSection.delete({
      where: { id: params.sectionId },
    });
    return new NextResponse(null, { status: 204 }); 
  } catch (error) {
    console.error("Erro ao deletar seção:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}