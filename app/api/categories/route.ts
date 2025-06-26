import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Ajuste o caminho se necessário

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Opcional: Adicionar verificação de admin/role se necessário para criar categorias
  // Opcional: Adicionar verificação de admin/role se necessário para criar categorias
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'O nome da categoria é obrigatório.' }, { status: 400 });
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive', // Para busca case-insensitive
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'Esta categoria já existe.' }, { status: 409 }); // 409 Conflict
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor ao criar categoria.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}