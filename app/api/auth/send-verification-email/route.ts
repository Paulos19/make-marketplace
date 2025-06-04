// app/api/auth/send-verification-email/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid'; // Para gerar tokens únicos

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new NextResponse('Email é obrigatório', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Para segurança, não informamos se o email não existe.
      // Apenas retornamos sucesso para evitar enumeração de usuários.
      return new NextResponse('E-mail de verificação enviado (se a conta existir).', { status: 200 });
    }

    // Gerar um token único e de tempo limitado
    const verificationToken = uuidv4();
    const expires = new Date(Date.now() + 3600 * 1000); // Token válido por 1 hora

    // Salvar o token no banco de dados.
    // Você pode ter uma tabela separada para tokens ou adicionar um campo no User.
    // Para simplificar, vou criar uma nova tabela para `VerificationToken` no seu schema.prisma.
    // **NOTA**: Certifique-se de adicionar esta tabela no seu schema.prisma e rodar `npx prisma migrate dev`
    //  model VerificationToken {
    //    id        String   @id @default(uuid())
    //    email     String   @unique
    //    token     String   @unique
    //    expires   DateTime
    //    @@unique([email, token])
    //  }
    await prisma.verificationToken.create({
      data: {
        email: user.email!,
        token: verificationToken,
        expires: expires,
      },
    });

    // Enviar o e-mail de verificação
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST, // Certifique-se de configurar estas variáveis no .env
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SERVER_SECURE === 'true', // Use 'true' para 465 (SSL) ou 'false' para 587 (TLS/STARTTLS)
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email!,
      subject: 'Verifique seu e-mail para MakeStore Marketplace',
      html: `
        <p>Olá ${user.name || ''},</p>
        <p>Obrigado por se registrar no MakeStore Marketplace. Por favor, verifique seu endereço de e-mail clicando no link abaixo:</p>
        <p><a href="${verificationLink}">Verificar E-mail Agora</a></p>
        <p>Este link expirará em 1 hora.</p>
        <p>Se você não se registrou em nosso site, por favor ignore este e-mail.</p>
        <p>Atenciosamente,<br/>Equipe MakeStore</p>
      `,
    });

    return new NextResponse('E-mail de verificação enviado.', { status: 200 });
  } catch (error) {
    console.error('Erro ao enviar e-mail de verificação:', error);
    return new NextResponse('Erro interno do servidor ao enviar e-mail de verificação', { status: 500 });
  }
}