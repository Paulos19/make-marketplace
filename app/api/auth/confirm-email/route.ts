import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const confirmEmailSchema = z.object({
  token: z.string().min(1, { message: "Token de verificação é obrigatório." }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = confirmEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Token ausente ou inválido.", errors: validation.error.format().token?._errors },
        { status: 400 }
      );
    }
    const { token } = validation.data;

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }, // Busca pelo token, que é único
    });

    if (!verificationToken) {
      return NextResponse.json({ message: 'Este link de verificação é inválido ou já foi utilizado. Tente novamente, psit!' }, { status: 404 });
    }

    if (new Date(verificationToken.expires) < new Date()) {
      // Deletar o token expirado para limpeza
      await prisma.verificationToken.delete({
        where: { token: verificationToken.token },
      });
      return NextResponse.json({ message: 'Seu link de verificação expirou igual promessa de político! Solicite um novo, cumpadi.' }, { status: 400 });
    }

    const user = await prisma.$transaction(async (tx) => {
      const userToVerify = await tx.user.findUnique({
        where: { email: verificationToken.identifier },
      });

      if (!userToVerify) {
        // Se o usuário não existe mais por algum motivo, deleta o token órfão e lança um erro
        await tx.verificationToken.delete({ where: { token: verificationToken.token } });
        throw new Error("Usuário associado a este token não foi encontrado.");
      }

      // Atualiza o status do usuário para verificado
      const updatedUser = await tx.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      });

      // Deleta o token de verificação após o uso bem-sucedido
      await tx.verificationToken.delete({
        where: { token: verificationToken.token },
      });

      return updatedUser;
    });

    // 5. Retornar sucesso
    return NextResponse.json({ message: 'Seu email foi verificado com sucesso! Pode entrar na festa, Zé!' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro durante a verificação de e-mail (API):', error);
    if (error.code === 'P2025') { // Erro do Prisma "Record to delete does not exist."
      return NextResponse.json({ message: 'Token de verificação já foi utilizado.' }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Erro interno do servidor ao verificar e-mail. Ai, pastor!' }, { status: 500 });
  }
}