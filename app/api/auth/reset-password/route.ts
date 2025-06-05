// app/api/auth/reset-password/route.ts
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

    // Inicia uma transação para garantir a atomicidade das operações
    await prisma.$transaction(async (tx) => {
      // 1. Encontra e valida o token no banco de dados
      const resetToken = await tx.verificationToken.findUnique({
        where: { token },
      });

      if (!resetToken) {
        throw new Error('Token inválido ou não encontrado.');
      }
      if (new Date() > resetToken.expires) {
        // Opcional: deletar tokens expirados
        await tx.verificationToken.delete({ where: { token } });
        throw new Error('Token expirado. Por favor, solicite um novo link.');
      }

      // 2. Hash da nova senha
      const hashedPassword = await bcrypt.hash(password, 10);
      const userEmail = resetToken.identifier;

      // 3. Atualiza a senha do usuário
      await tx.user.update({
        where: { email: userEmail },
        data: { passwordHash: hashedPassword },
      });

      // 4. Invalida (deleta) o token após o uso bem-sucedido
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