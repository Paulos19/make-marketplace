// app/api/shortener/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const createLinkSchema = z.object({
  url: z.string().url({ message: "Por favor, insira uma URL válida." }),
});

// POST: Cria um novo link encurtado
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createLinkSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }

    const { url } = validation.data;
    const shortCode = nanoid(8); // Gera um código aleatório de 8 caracteres

    const newLink = await prisma.shortLink.create({
      data: {
        originalUrl: url,
        shortCode: shortCode,
        userId: session.user.id,
      },
    });

    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${newLink.shortCode}`;
    return NextResponse.json({ ...newLink, shortUrl }, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar link encurtado:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}

// GET: Lista os links encurtados do usuário logado
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
        }

        const links = await prisma.shortLink.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        return NextResponse.json(links, { status: 200 });

    } catch (error) {
        console.error("Erro ao buscar links encurtados:", error);
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}