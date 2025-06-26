// app/api/newsletter/subscribe/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }
    const { email } = validation.data;

    await prisma.newsletterSubscription.create({
      data: { email },
    });

    return NextResponse.json({ message: 'Inscrição realizada com sucesso! Fique de olho nas novidades.' }, { status: 201 });

  } catch (error: any) {
    // Código P2002 indica violação de constraint única (email já existe)
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Este e-mail já está cadastrado em nossa newsletter.' }, { status: 409 }); // 409 Conflict
    }
    
    console.error("Erro na inscrição do newsletter:", error);
    return NextResponse.json({ message: 'Ocorreu um erro interno.' }, { status: 500 });
  }
}