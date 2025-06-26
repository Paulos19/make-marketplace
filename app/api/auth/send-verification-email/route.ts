import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid'; // Para gerar tokens únicos
import { z } from 'zod';

const sendVerificationEmailSchema = z.object({
  email: z.string().email({ message: "Por favor, forneça um email válido." }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = sendVerificationEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: validation.error.format().email?._errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`Tentativa de envio de verificação para email não cadastrado: ${email}`);
      return NextResponse.json({ message: 'Se uma conta com este email existir, um link de verificação foi enviado.' }, { status: 200 });
    }

    if (user.emailVerified) {
        return NextResponse.json({ message: 'Este email já foi verificado, cumpadi!' }, { status: 400 });
    }

    const verificationTokenValue = uuidv4() + uuidv4(); // Token mais longo
    const expires = new Date(Date.now() + 3600 * 1000 * 24); // Token válido por 24 horas

    // Usar upsert para criar um novo token ou atualizar um existente para o mesmo identifier (email)
    // Isso evita o erro de "Unique constraint failed" se o usuário solicitar várias vezes.
    // O modelo VerificationToken deve usar 'identifier' para o email.
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: email,
          token: ''
        }
      },
      create: {
        identifier: email,
        token: verificationTokenValue,
        expires,
      },
      update: { // Se um token para este 'identifier' já existe, atualiza o token e a expiração
        token: verificationTokenValue,
        expires,
      },
    });
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SERVER_PORT === '465', // true para porta 465 (SSL), false para outras (TLS/STARTTLS)
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
      // Adicione opções de TLS se necessário para alguns provedores (ex: Gmail com App Passwords)
      // tls: {
      //   ciphers:'SSLv3'
      // }
    });

    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationTokenValue}`;
    const siteName = "Zacaplace"; // Nome do seu site/marca

    await transporter.sendMail({
      from: `"${siteName}" <${process.env.EMAIL_FROM}>`,
      to: user.email!,
      subject: `Ô Psit! Verifique seu Email no ${siteName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #8A2BE2; text-align: center; font-family: 'Bangers', cursive;">Só falta um tiquinho, Cumpadi ${user.name || ''}!</h2>
          <p>Obrigado por se juntar à trupe do ${siteName}! Para começar a farra (e as compras!), precisamos que você verifique seu email clicando no botão mágico abaixo:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${verificationLink}" style="background-color: #EC4899; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Verificar Meu Email Agora!</a>
          </div>
          <p>Este link é mais rápido que o Zaca fugindo da bronca e expira em <strong>24 horas</strong>.</p>
          <p>Se você não pediu pra entrar na nossa 'Zoropa', pode ignorar este email que não dá nada!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="text-align: center; font-size: 12px; color: #777;">Abraços apertados (mas sem amassar o chapéu!),<br/>Equipe ${siteName}</p>
        </div>
      `,
      text: `Olá ${user.name || ''},\n\nObrigado por se registrar no ${siteName}. Por favor, verifique seu endereço de e-mail visitando o seguinte link: ${verificationLink}\n\nEste link expirará em 24 horas.\n\nSe você não se registrou, por favor ignore este e-mail.\n\nAtenciosamente,\nEquipe ${siteName}`
    });

    return NextResponse.json({ message: `Email de verificação enviado para ${user.email}. Dá uma espiada na sua caixa de entrada e no spam, viu?!` }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao enviar e-mail de verificação (API):', error);
    // Tratar erro P2002 (unique constraint) especificamente se o upsert falhar por alguma razão de schema
    if (error.code === 'P2002' && error.meta?.target?.includes('identifier')) {
      // Isso não deveria acontecer com o upsert configurado corretamente, mas como fallback:
      return NextResponse.json({ message: 'Já existe uma solicitação de verificação para este email. Verifique sua caixa de entrada.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Deu um revertério aqui e não conseguimos enviar o email. Tente de novo, psit!' }, { status: 500 });
  }
}
