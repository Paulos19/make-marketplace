// app/api/admin/theme/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Schema para validar os dados do tema
const themeSchema = z.object({
  zaca_roxo: z.string().regex(/^\d{1,3}\s\d{1,3}%\s\d{1,3}%$/, "Formato HSL inválido").optional().or(z.literal("")),
  zaca_azul: z.string().regex(/^\d{1,3}\s\d{1,3}%\s\d{1,3}%$/, "Formato HSL inválido").optional().or(z.literal("")),
  // Adicione outras validações conforme expandir
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const validation = themeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }
    
    // Usamos 'upsert' para criar as configurações se não existirem, ou atualizá-las.
    // Usaremos um ID fixo para garantir que sempre haja apenas uma linha de configurações.
    const settingsId = "global_theme_settings";

    const updatedSettings = await prisma.themeSettings.upsert({
      where: { id: settingsId },
      update: validation.data,
      create: {
        id: settingsId,
        ...validation.data
      },
    });

    return NextResponse.json(updatedSettings, { status: 200 });
  } catch (error) {
    console.error("Erro ao salvar configurações de tema:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}