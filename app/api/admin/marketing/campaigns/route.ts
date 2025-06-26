import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const campaignSchema = z.object({
  subject: z.string().min(1, "O assunto é obrigatório."),
  headline: z.string().min(1, "O título é obrigatório."),
  body: z.string().min(1, "O corpo do email é obrigatório."),
  ctaText: z.string().min(1, "O texto do botão é obrigatório."),
  ctaLink: z.string().url("O link do botão deve ser uma URL válida."),
  imageUrl: z.string().url("A URL da imagem é obrigatória."),
  targetAudience: z.object({
      newsletter: z.boolean(),
      allUsers: z.boolean(),
  }),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    const campaigns = await prisma.marketingCampaign.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Erro ao buscar campanhas de marketing:", error);
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
    const validation = campaignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }
    
    const { targetAudience, ...emailContent } = validation.data;

    const newCampaign = await prisma.marketingCampaign.create({
      data: {
        ...emailContent,
        status: "DRAFT", // Sempre cria como rascunho
        targetAudienceJson: JSON.stringify(targetAudience), // Salva o objeto como string
      },
    });

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar rascunho de campanha:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
