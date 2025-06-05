// app/api/auth/send-password-reset/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '@/lib/nodemailer';

const forgotPasswordSchema = z.object({
  email: z.string().email("Por favor, insira um email válido."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // IMPORTANTE: Por segurança, não informamos ao cliente se o email foi encontrado ou não.
    // Isso previne ataques de enumeração de emails.
    if (user) {
      // 1. Gera um token único e seguro
      const resetToken = `${uuidv4()}${uuidv4()}`.replace(/-/g, '');
      const tokenExpires = new Date(Date.now() + 3600 * 1000); // Token válido por 1 hora

      // 2. Invalida tokens de redefinição anteriores para este email
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });

      // 3. Salva o novo token no banco, associado ao email do usuário
      // Reutilizaremos a tabela VerificationToken para isso
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: resetToken,
          expires: tokenExpires,
        },
      });

      // 4. Envia o email com o link de redefinição
      await sendPasswordResetEmail({ email, token: resetToken });
    }
    
    // Retorna uma mensagem genérica de sucesso em todos os casos
    return NextResponse.json({ 
      message: "Se um usuário com este e-mail existir em nossa base, um link para redefinição de senha foi enviado." 
    }, { status: 200 });

  } catch (error) {
    console.error("Erro ao solicitar redefinição de senha:", error);
    // Não retorne o erro detalhado para o cliente
    return NextResponse.json({ message: "Ocorreu um erro interno. Tente novamente mais tarde." }, { status: 500 });
  }
}