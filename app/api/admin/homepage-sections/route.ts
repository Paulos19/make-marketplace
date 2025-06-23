// app/api/admin/homepage-sections/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache'; // <<< 1. IMPORTADO

const sectionSchema = z.object({
  title: z.string().min(3, "O título é obrigatório."),
  bannerImageUrl: z.string().url("A URL da imagem do banner é inválida."),
  bannerFontColor: z.string().optional().default("#FFFFFF"),
  productIds: z.array(z.string()).min(1, "Selecione pelo menos um produto."),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});


export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    const sections = await prisma.homepageSection.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(sections);
  } catch (error) {
    console.error("Erro ao buscar seções da homepage:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = sectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }

    const newSection = await prisma.homepageSection.create({
      data: validation.data,
    });
    
    revalidatePath('/'); // <<< 2. ADICIONADO: Revalida a homepage

    return NextResponse.json(newSection, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar seção da homepage:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
