import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const updateCampaignSchema = z.object({
  subject: z.string().min(1).optional(),
  headline: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  ctaText: z.string().min(1).optional(),
  ctaLink: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  targetAudience: z.object({ newsletter: z.boolean(), allUsers: z.boolean() }).optional(),
});

interface RouteParams {
  params: { campaignId: string };
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = updateCampaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
    }
    
    const { targetAudience, ...emailContent } = validation.data;
    const dataToUpdate: any = { ...emailContent };
    
    if (targetAudience) {
      dataToUpdate.targetAudienceJson = JSON.stringify(targetAudience);
    }

    const updatedCampaign = await prisma.marketingCampaign.update({
      where: { id: params.campaignId },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("Erro ao atualizar campanha:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    await prisma.marketingCampaign.delete({
      where: { id: params.campaignId },
    });
    return new NextResponse(null, { status: 204 }); // Sucesso, sem conteúdo
  } catch (error) {
    console.error("Erro ao deletar campanha:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}