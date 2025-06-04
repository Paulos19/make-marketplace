// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token de verificação ausente.' }, { status: 400 });
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 404 });
    }

    if (verificationToken.expires < new Date()) {
      // Opcional: Você pode deletar tokens expirados aqui ou em um cron job
      await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
      return NextResponse.json({ error: 'Token expirado. Por favor, solicite um novo e-mail de verificação.' }, { status: 400 });
    }

    // Usar uma transação para garantir que ambas as operações sejam atômicas
    await prisma.$transaction(async (tx) => {
      // Atualizar o status do usuário para verificado
      await tx.user.update({
        where: { email: verificationToken.email },
        data: { emailVerified: new Date() },
      });

      // Deletar o token de verificação após o uso
      await tx.verificationToken.delete({
        where: { id: verificationToken.id },
      });
    });

    // Redirecionar para uma página de sucesso ou para a página de login
    // Recomendado redirecionar o usuário para uma página de sucesso ou para a página de login
    // para que ele possa entrar com a conta verificada.
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('emailVerified', 'true');
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Erro durante a verificação de e-mail:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao verificar e-mail.' }, { status: 500 });
  }
}