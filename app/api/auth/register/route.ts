// app/api/auth/register/route.ts
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import nodemailer from 'nodemailer'; // NOVO: Importar nodemailer
import { v4 as uuidv4 } from 'uuid'; // NOVO: Importar uuid

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password, whatsappLink } = body;

    if (!email || !password || !whatsappLink) {
      return new NextResponse("Email, senha e link do WhatsApp são obrigatórios", { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("Usuário já existe com este email", { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        whatsappLink,
        // emailVerified: new Date(), // Remover esta linha
      },
    });

    // --- Lógica de envio de e-mail de verificação integrada diretamente ---
    try {
      // Gerar um token único e de tempo limitado
      const verificationToken = uuidv4();
      const expires = new Date(Date.now() + 3600 * 1000); // Token válido por 1 hora

      // Salvar o token no banco de dados.
      // Certifique-se que o modelo VerificationToken está no seu schema.prisma
      await prisma.verificationToken.create({
        data: {
          email: newUser.email!,
          token: verificationToken,
          expires: expires,
        },
      });

      // Configurar o Nodemailer
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        secure: process.env.EMAIL_SERVER_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });

      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: newUser.email!,
        subject: 'Verifique seu e-mail para ZECAPLACE',
        html: `
          <p>Olá ${newUser.name || ''},</p>
          <p>Obrigado por se registrar no Zecaplace. Por favor, verifique seu endereço de e-mail clicando no link abaixo:</p>
          <p><a href="${verificationLink}">Verificar E-mail Agora</a></p>
          <p>Este link expirará em 1 hora.</p>
          <p>Se você não se registrou em nosso site, por favor ignore este e-mail.</p>
          <p>Atenciosamente,<br/>Equipe MakeStore</p>
        `,
      });
      console.log(`E-mail de verificação enviado para ${newUser.email}`);
    } catch (emailError: any) { // Capture o erro do e-mail
      console.error(`Falha ao enviar e-mail de verificação para ${newUser.email}:`, emailError);
      // Aqui você pode decidir o que fazer:
      // 1. Apenas logar o erro e continuar (como está feito agora).
      // 2. Retornar um erro para o frontend (e impedir o registro).
      // Se decidir retornar erro, considere: return new NextResponse("Erro ao enviar e-mail de verificação. Por favor, tente novamente ou contate o suporte.", { status: 500 });
    }
    // -------------------------------------------------------------------

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.log("--- DETALHES DO ERRO CAPTURADO DURANTE REGISTRO ---");
    console.log("Tipo do erro:", typeof error);
    console.log("Mensagem do erro:", error?.message);
    console.log("Stack do erro:", error?.stack);
    console.error("Erro no registro:", error);
    return new NextResponse("Erro interno do servidor ao registrar. Por favor, tente novamente.", { status: 500 });
  }
}