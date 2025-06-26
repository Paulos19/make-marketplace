import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const resetPasswordSchema = z.object({
  token: z.string().min(1, "O token é obrigatório."),
  password: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }
    const { token, password } = validation.data;

    await prisma.$transaction(async (tx) => {
      const resetToken = await tx.verificationToken.findUnique({
        where: { token },
      });

      if (!resetToken) {
        throw new Error('Token inválido ou não encontrado.');
      }
      if (new Date() > resetToken.expires) {
        await tx.verificationToken.delete({ where: { token } });
        throw new Error('Token expirado. Por favor, solicite um novo link.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userEmail = resetToken.identifier;

      await tx.user.update({
        where: { email: userEmail },
        data: { passwordHash: hashedPassword },
      });

      await tx.verificationToken.delete({
        where: { token },
      });
    });

    return NextResponse.json({ message: "Senha redefinida com sucesso!" }, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao redefinir senha:", error);
    // Retorna a mensagem de erro específica para o cliente (token inválido/expirado)
    if (error.message.includes('Token')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    // Retorna uma mensagem genérica para outros erros
    return NextResponse.json({ message: "Ocorreu um erro ao redefinir sua senha." }, { status: 500 });
  }
}